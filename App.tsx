
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData, GachaItem } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [activeTab, setActiveTab] = useState<'portal' | 'rig' | 'market'>('portal');
  const [luckiness, setLuckiness] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReward, setCurrentReward] = useState<GachaItem | null>(null);
  const [inventory, setInventory] = useState<GachaItem[]>([]);
  const [credits, setCredits] = useState(2500); // Start with a bit more for testing the market
  const [stakedIds, setStakedIds] = useState<Set<string>>(new Set());
  
  // Marketplace Shop Items
  const [shopItems, setShopItems] = useState<GachaItem[]>([]);

  // Initialize shop with varied items
  useEffect(() => {
    refreshShop();
  }, []);

  const refreshShop = () => {
    const pool: Array<keyof typeof Generators> = [
      'SolarTrident', 'AbyssalCompass', 'PulseHarp', 'StarShell', 
      'Crown', 'Scepter', 'Gauntlet', 'Boots', 'Shield', 'Book'
    ];
    
    const newShop = Array.from({ length: 3 }).map((_, i) => {
      const choice = pool[Math.floor(Math.random() * pool.length)];
      const rarityRoll = Math.random();
      let rarity: GachaItem['rarity'] = 'Rare';
      let power = 15;
      
      if (rarityRoll > 0.95) {
        rarity = 'Legendary';
        power = 95;
      } else if (rarityRoll > 0.7) {
        rarity = 'Epic';
        power = 45;
      }

      return {
        id: `shop-${Date.now()}-${i}`,
        name: choice,
        rarity: rarity,
        description: `Market-grade ${choice}. Perfect for expanding your mining operations.`,
        miningPower: power + Math.floor(Math.random() * 10),
        level: 1,
        experience: 0,
        data: Generators[choice]()
      } as GachaItem;
    });
    setShopItems(newShop);
  };

  // Reward calculation effect
  useEffect(() => {
    const interval = setInterval(() => {
      let totalPower = 0;
      inventory.forEach(item => {
        if (stakedIds.has(item.id)) {
          totalPower += item.miningPower * (1 + (item.level - 1) * 0.2);
        }
      });
      if (totalPower > 0) {
        setCredits(prev => prev + (totalPower / 10));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [inventory, stakedIds]);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      () => {}
    );

    engineRef.current = engine;
    engine.loadInitialModel(Generators.Sword());

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);

  const handleSummon = async (count: number) => {
    if (isGenerating) return;
    
    const cost = count === 33 ? 750 : 250;
    if (credits < cost) {
        alert("Insufficient QuantumCredits! Visit the Bazaar or stake items to earn more.");
        return;
    }

    setIsGenerating(true);
    setAppState(AppState.SUMMONING);
    setCredits(prev => prev - cost);

    try {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const isMilestone = luckiness + count >= 100;
      const isRare = Math.random() < 0.25 || isMilestone;
      
      let reward: GachaItem;

      if (isRare) {
        reward = await generateNeonovaItem(isMilestone);
      } else {
        const pool: Array<{name: keyof typeof Generators, power: number, desc: string}> = [
          { name: 'Sword', power: 6, desc: 'A classic steel blade infused with Ritual energy.' },
          { name: 'Hammer', power: 7, desc: 'A heavy tool that pounds Quantum resonance.' },
          { name: 'Axe', power: 7, desc: 'Sharp enough to split the data stream.' },
          { name: 'Bow', power: 6, desc: 'Launches arrows of pure light.' },
          { name: 'SolarTrident', power: 14, desc: 'A relic of the Sun Fish.' }
        ];
        
        const selection = pool[Math.floor(Math.random() * pool.length)];
        reward = {
          id: `item-${Date.now()}-${Math.random()}`,
          name: selection.name as string,
          rarity: 'Rare',
          description: selection.desc,
          data: Generators[selection.name](),
          miningPower: selection.power,
          level: 1,
          experience: 0
        };
      }

      setLuckiness(prev => Math.min(100, prev + (count / 10)));
      if (engineRef.current) engineRef.current.loadInitialModel(reward.data);
      
      setCurrentReward(reward);
      setInventory(prev => [reward, ...prev]);
      setAppState(AppState.REVEALING);

    } catch (err: any) {
      console.error("Summoning failed", err);
      setAppState(AppState.STABLE);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNeonovaItem = async (isLegendary: boolean): Promise<GachaItem> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model,
      contents: `
        Generate a unique 'Treasure of Fish Sun' themed 3D voxel artifact.
        Artifact Type: ${isLegendary ? 'Sovereign Relic' : 'Elite Aquatic Gear'}.
        Voxel Rules: Max 400 voxels, use vibrant neon sea/sun colors.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            voxels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  z: { type: Type.INTEGER },
                  color: { type: Type.STRING }
                },
                required: ["x", "y", "z", "color"]
              }
            }
          },
          required: ["name", "description", "voxels"]
        }
      }
    });

    const data = JSON.parse(response.text);
    const powerBase = isLegendary ? 100 : 40;
    
    return {
      id: `item-${Date.now()}-${Math.random()}`,
      name: data.name,
      rarity: isLegendary ? 'Legendary' : 'Epic',
      description: data.description,
      data: data.voxels.map((v: any) => ({
        x: v.x, y: v.y, z: v.z,
        color: parseInt(v.color.replace('#', ''), 16)
      })),
      miningPower: powerBase + Math.floor(Math.random() * 20),
      level: 1,
      experience: 0
    };
  };

  const evolveItem = (itemId: string) => {
    const target = inventory.find(i => i.id === itemId);
    if (!target) return;
    if (target.level >= 10) return;

    const duplicateIndex = inventory.findIndex(i => i.name === target.name && i.id !== target.id && !stakedIds.has(i.id));
    
    if (duplicateIndex !== -1) {
      if (confirm(`Fusion: Sacrifice duplicate '${target.name}' to evolve this artifact?`)) {
        const dupId = inventory[duplicateIndex].id;
        setInventory(prev => {
          const removedDup = prev.filter(i => i.id !== dupId);
          return removedDup.map(item => {
            if (item.id === itemId) return { ...item, level: item.level + 1 };
            return item;
          });
        });
        setAppState(AppState.EVOLVING);
        setTimeout(() => setAppState(AppState.STABLE), 1500);
        return;
      }
    }

    const cost = target.level * 300;
    if (credits < cost) {
      alert(`Insufficient Credits! Need ${cost} for Level ${target.level + 1}.`);
      return;
    }

    if (confirm(`Evolve artifact for ${cost} Credits?`)) {
      setCredits(prev => prev - cost);
      setInventory(prev => prev.map(item => {
        if (item.id === itemId) return { ...item, level: item.level + 1 };
        return item;
      }));
      setAppState(AppState.EVOLVING);
      setTimeout(() => setAppState(AppState.STABLE), 1500);
    }
  };

  const buyItem = (shopItemId: string) => {
    const itemTemplate = shopItems.find(i => i.id === shopItemId);
    if (!itemTemplate) return;

    const price = itemTemplate.rarity === 'Legendary' ? 5000 : (itemTemplate.rarity === 'Epic' ? 1800 : 750);
    if (credits < price) {
      alert("Insufficient Credits!");
      return;
    }

    setCredits(prev => prev - price);
    const newItem = { ...itemTemplate, id: `item-${Date.now()}-${Math.random()}` };
    setInventory(prev => [newItem, ...prev]);
    alert(`Purchased ${newItem.name}! Added to collection.`);
  };

  const openMysteryCache = () => {
    const cost = 400;
    if (credits < cost) {
      alert("Insufficient Credits for Mystery Cache!");
      return;
    }
    setCredits(prev => prev - cost);
    handleSummon(1);
  };

  const sellItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (stakedIds.has(itemId)) {
      alert("Item is currently staked! Unstake it before selling.");
      return;
    }

    const basePrice = item.rarity === 'Legendary' ? 2000 : (item.rarity === 'Epic' ? 800 : 250);
    const finalPrice = Math.floor(basePrice * (1 + (item.level - 1) * 0.2));
    
    if (confirm(`Sell ${item.name} (Lv.${item.level}) for ${finalPrice} Credits?`)) {
        setCredits(prev => prev + finalPrice);
        setInventory(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const toggleStake = (itemId: string) => {
    setStakedIds(prev => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
    });
  };

  const viewInOrb = (item: GachaItem) => {
    if (engineRef.current) engineRef.current.loadInitialModel(item.data);
    setActiveTab('portal');
  };

  return (
    <div className="relative w-full h-screen bg-[#020412] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <UIOverlay 
        luckiness={luckiness}
        isGenerating={isGenerating}
        currentReward={currentReward}
        onSummon={handleSummon}
        onCloseReveal={() => setAppState(AppState.STABLE)}
        appState={appState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inventory={inventory}
        stakedIds={stakedIds}
        onToggleStake={toggleStake}
        credits={Math.floor(credits)}
        onViewItem={viewInOrb}
        onEvolve={evolveItem}
        onSell={sellItem}
        shopItems={shopItems}
        onBuy={buyItem}
        onRefreshShop={refreshShop}
        onOpenMysteryCache={openMysteryCache}
      />
    </div>
  );
};

export default App;
