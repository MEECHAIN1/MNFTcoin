
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS } from './voxelConstants';

function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

export const Generators = {
    Sword: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = 0; y < 4; y++) setBlock(map, 0, y, 0, COLORS.WOOD);
        for (let x = -2; x <= 2; x++) setBlock(map, x, 4, 0, COLORS.GOLD);
        for (let y = 5; y < 15; y++) {
            setBlock(map, 0, y, 0, COLORS.STEEL);
            if (y < 14) {
                setBlock(map, 1, y, 0, COLORS.WHITE);
                setBlock(map, -1, y, 0, COLORS.WHITE);
            }
        }
        return Array.from(map.values());
    },
    Hammer: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = 0; y < 8; y++) setBlock(map, 0, y, 0, COLORS.WOOD);
        for (let x = -2; x <= 2; x++) {
            for (let y = 8; y <= 12; y++) {
                for (let z = -2; z <= 2; z++) setBlock(map, x, y, z, COLORS.STEEL);
            }
        }
        return Array.from(map.values());
    },
    Axe: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = 0; y < 10; y++) setBlock(map, 0, y, 0, COLORS.WOOD);
        for (let y = 7; y <= 11; y++) {
            for (let x = 1; x <= 4; x++) setBlock(map, x, y, 0, COLORS.STEEL);
            setBlock(map, 5, y, 0, COLORS.WHITE);
        }
        return Array.from(map.values());
    },
    Bow: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = -5; y <= 5; y++) {
            const x = Math.sqrt(25 - y * y) * 0.8;
            setBlock(map, x, y + 5, 0, COLORS.WOOD);
        }
        for (let y = -4; y <= 4; y++) setBlock(map, 0, y + 5, 0, COLORS.WHITE);
        return Array.from(map.values());
    },
    Shield: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let x = -3; x <= 3; x++) {
            for (let y = 0; y <= 6; y++) {
                if (Math.abs(x) < 3 || (y > 0 && y < 6)) {
                    setBlock(map, x, y, 0, COLORS.AZURE);
                }
            }
        }
        for (let i = -3; i <= 3; i++) {
            setBlock(map, i, 0, 0, COLORS.GOLD);
            setBlock(map, i, 6, 0, COLORS.GOLD);
            setBlock(map, 3, i + 3, 0, COLORS.GOLD);
            setBlock(map, -3, i + 3, 0, COLORS.GOLD);
        }
        return Array.from(map.values());
    },
    Book: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let x = -2; x <= 2; x++) {
            for (let y = 0; y < 6; y++) {
                for (let z = 0; z < 4; z++) {
                    const col = (z === 0) ? COLORS.CRIMSON : COLORS.WHITE;
                    setBlock(map, x, y, z, col);
                }
            }
        }
        setBlock(map, 0, 3, 0, COLORS.GOLD);
        return Array.from(map.values());
    },
    Scepter: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = 0; y < 12; y++) setBlock(map, 0, y, 0, COLORS.BRONZE);
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) setBlock(map, x, 12, z, COLORS.GOLD);
        }
        setBlock(map, 0, 14, 0, COLORS.ORB);
        setBlock(map, 1, 13, 0, COLORS.ORB);
        setBlock(map, -1, 13, 0, COLORS.ORB);
        setBlock(map, 0, 13, 1, COLORS.ORB);
        setBlock(map, 0, 13, -1, COLORS.ORB);
        return Array.from(map.values());
    },
    Gauntlet: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let y = 0; y < 6; y++) {
            for (let x = -2; x <= 2; x++) {
                for (let z = -1; z <= 2; z++) setBlock(map, x, y, z, COLORS.STEEL);
            }
        }
        for (let x = -2; x <= 2; x++) setBlock(map, x, 6, 0, COLORS.GOLD);
        setBlock(map, 0, 3, 2, COLORS.CRIMSON);
        return Array.from(map.values());
    },
    Boots: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Two boots
        for (let xOffset = -2; xOffset <= 2; xOffset += 4) {
            for (let y = 0; y < 4; y++) {
                for (let x = -1; x <= 1; x++) {
                    for (let z = -1; z <= 1; z++) setBlock(map, x + xOffset, y, z, COLORS.STEEL);
                }
            }
            for (let z = 1; z <= 2; z++) {
                for (let x = -1; x <= 1; x++) setBlock(map, x + xOffset, 0, z, COLORS.STEEL);
            }
        }
        return Array.from(map.values());
    },
    Crown: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let x = -3; x <= 3; x++) {
            for (let z = -3; z <= 3; z++) {
                if (Math.abs(x) === 3 || Math.abs(z) === 3) {
                    setBlock(map, x, 0, z, COLORS.GOLD);
                    if (x % 2 === 0 && z % 2 === 0) {
                        setBlock(map, x, 1, z, COLORS.GOLD);
                        setBlock(map, x, 2, z, COLORS.CRIMSON);
                    }
                }
            }
        }
        return Array.from(map.values());
    },
    SolarTrident: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Shaft
        for (let y = 0; y < 14; y++) setBlock(map, 0, y, 0, COLORS.GOLD);
        // Fork
        for (let x = -2; x <= 2; x++) setBlock(map, x, 14, 0, COLORS.GOLD);
        for (let x = -2; x <= 2; x += 2) {
            for (let y = 15; y < 19; y++) setBlock(map, x, y, 0, COLORS.ORB);
        }
        return Array.from(map.values());
    },
    AbyssalCompass: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Circle base
        for (let x = -3; x <= 3; x++) {
            for (let z = -3; z <= 3; z++) {
                if (x*x + z*z <= 10) setBlock(map, x, 0, z, COLORS.BRONZE);
            }
        }
        // Needle
        for (let y = 1; y < 4; y++) setBlock(map, 0, y, 0, COLORS.CRIMSON);
        setBlock(map, 0, 4, 0, COLORS.ORB);
        return Array.from(map.values());
    },
    PulseHarp: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Frame
        for (let y = 0; y < 12; y++) setBlock(map, -4, y, 0, COLORS.GOLD);
        for (let x = -4; x < 4; x++) setBlock(map, x, 0, 0, COLORS.GOLD);
        for (let x = -4; x < 4; x++) setBlock(map, x, 12, 0, COLORS.GOLD);
        // Strings
        for (let x = -2; x <= 2; x++) {
            for (let y = 1; y < 12; y++) setBlock(map, x, y, 0, COLORS.AZURE);
        }
        return Array.from(map.values());
    },
    StarShell: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Spiraling shell
        for (let i = 0; i < 20; i++) {
            const r = i * 0.2;
            const x = Math.cos(i) * r;
            const z = Math.sin(i) * r;
            const y = i * 0.5;
            for(let dx=-1; dx<=1; dx++) {
                for(let dz=-1; dz<=1; dz++) {
                    setBlock(map, x + dx, y, z + dz, COLORS.ORB);
                }
            }
        }
        return Array.from(map.values());
    }
};
