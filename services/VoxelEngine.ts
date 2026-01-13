
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData } from '../types';
import { CONFIG, COLORS } from '../utils/voxelConstants';

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private voxels: SimulationVoxel[] = [];
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;

  private orb: THREE.Mesh | null = null;
  private orbInner: THREE.Mesh | null = null;
  private pedestal: THREE.Mesh | null = null;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020412); // Near black
    this.scene.fog = new THREE.Fog(0x020412, 30, 100);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.0;
    this.controls.target.set(0, 3, 0);
    this.controls.maxPolarAngle = Math.PI / 1.8;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 50;

    const ambientLight = new THREE.AmbientLight(0x4040ff, 0.3);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 3, 100);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);

    const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
    pinkLight.position.set(-10, 5, -10);
    this.scene.add(pinkLight);

    // Pedestal - Cyberpunk/Ritual style
    const pedGeo = new THREE.CylinderGeometry(8, 9, 2, 8); // Octagon base
    const pedMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: 0x00ffff,
        emissiveIntensity: 0.05
    });
    this.pedestal = new THREE.Mesh(pedGeo, pedMat);
    this.pedestal.position.y = -3;
    this.pedestal.receiveShadow = true;
    this.scene.add(this.pedestal);

    const ringGeo = new THREE.TorusGeometry(8.5, 0.2, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2;
    this.scene.add(ring);

    // Crystal Ball (Orb) - Neonova Holographic
    const orbGeo = new THREE.SphereGeometry(6, 64, 64);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.15,
      transmission: 0.95,
      thickness: 2,
      roughness: 0,
      metalness: 0.1,
      ior: 1.5,
    });
    this.orb = new THREE.Mesh(orbGeo, orbMat);
    this.orb.position.y = 4;
    this.scene.add(this.orb);

    const innerGeo = new THREE.SphereGeometry(5.8, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.05, 
        wireframe: true 
    });
    this.orbInner = new THREE.Mesh(innerGeo, innerMat);
    this.orbInner.position.y = 4;
    this.scene.add(this.orbInner);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[]) {
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      (this.instanceMesh.material as THREE.Material).dispose();
    }

    this.voxels = data.map((v, i) => {
        const c = new THREE.Color(v.color);
        return {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    });

    const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const material = new THREE.MeshStandardMaterial({ 
        roughness: 0.2, 
        metalness: 0.8,
        emissive: 0x000000 
    });
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instanceMesh.castShadow = true;
    this.instanceMesh.position.y = 3; 
    this.scene.add(this.instanceMesh);

    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    this.voxels.forEach((v, i) => {
        // Floating effect for voxels
        const floatY = Math.sin(Date.now() * 0.001 + i * 0.1) * 0.2;
        this.dummy.position.set(v.x * 0.35, v.y * 0.35 + floatY, v.z * 0.35);
        this.dummy.rotation.set(v.rx, v.ry, v.rz);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);
        this.instanceMesh!.setColorAt(i, v.color);
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
    if (this.instanceMesh.instanceColor) this.instanceMesh.instanceColor.needsUpdate = true;
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    
    const time = Date.now();

    if (this.orb) {
        this.orb.position.y = 4 + Math.sin(time * 0.001) * 0.3;
        (this.orb.material as THREE.MeshPhysicalMaterial).opacity = 0.1 + Math.abs(Math.sin(time * 0.002)) * 0.1;
    }

    if (this.orbInner) {
        this.orbInner.position.y = 4 + Math.sin(time * 0.001) * 0.3;
        this.orbInner.rotation.y += 0.005;
        this.orbInner.rotation.z += 0.003;
    }

    this.draw();
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
