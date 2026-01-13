
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

export enum AppState {
  STABLE = 'STABLE',
  SUMMONING = 'SUMMONING',
  REVEALING = 'REVEALING',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING',
  STAKING = 'STAKING',
  EVOLVING = 'EVOLVING',
  MARKET = 'MARKET',
  LIVE = 'LIVE'
}

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

export interface SimulationVoxel {
  id: number;
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
}

export interface RebuildTarget {
  x: number;
  y: number;
  z: number;
  delay: number;
  isRubble?: boolean;
}

export interface SavedModel {
  name: string;
  data: VoxelData[];
  baseModel?: string;
}

export interface GachaItem {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  data: VoxelData[];
  miningPower: number;
  level: number;
  experience: number;
  stakedAt?: number;
}
