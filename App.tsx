
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData, GachaItem } from './types';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

// Audio utility functions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [activeTab, setActiveTab] = useState<'portal' | 'rig' | 'market'>('portal');
  const [luckiness, setLuckiness] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReward, setCurrentReward] = useState<GachaItem | null>(null);
  const [inventory, setInventory] = useState<GachaItem[]>([]);
  const [credits, setCredits] = useState(2500);
  const [stakedIds, setStakedIds] = useState<Set<string>>(new Set());
  const [shopItems, setShopItems] = useState<GachaItem[]>([]);
  
  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState({ input: '', output: '' });
  const liveSessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize shop
  useEffect(() => {
    refreshShop();
  }, []);

  const refreshShop = useCallback(() => {
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
  }, []);

  // Reward calculation
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

  const generateNeonovaItem = useCallback(async (isLegendary: boolean, customPrompt?: string): Promise<GachaItem> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model,
      contents: `
        Generate a unique 'Treasure of Fish Sun' themed 3D voxel artifact.
        ${customPrompt ? `The user's specific request is: "${customPrompt}". Interpret this within the theme.` : `Artifact Type: ${isLegendary ? 'Sovereign Relic' : 'Elite Aquatic Gear'}.`}
        Theme: Mystical solar artifacts from the deep Sun Fish ocean. Vibrant neons (cyan, gold, pink).
        Voxel Rules: Max 400 voxels.
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
  }, []);

  const handleSummon = async (count: number, customPrompt?: string) => {
    if (isGenerating) return;
    const cost = customPrompt ? 400 : (count === 33 ? 750 : 250);
    if (credits < cost) {
      alert("Insufficient QuantumCredits! Visit the Bazaar or stake items to earn more.");
      return;
    }

    setIsGenerating(true);
    setAppState(AppState.SUMMONING);
    setCredits(prev => prev - cost);

    try {
      const isMilestone = luckiness + (customPrompt ? 10 : count) >= 100;
      const isRare = Math.random() < 0.25 || isMilestone || !!customPrompt;
      
      let reward: GachaItem;
      if (isRare) {
        reward = await generateNeonovaItem(isMilestone, customPrompt);
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

      setLuckiness(prev => Math.min(100, prev + (customPrompt ? 1 : (count / 10))));
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

  const toggleVoice = async () => {
    if (isVoiceActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsVoiceActive(false);
      setAppState(AppState.STABLE);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const summonFunc = {
        name: 'summon_artifact',
        parameters: {
          type: Type.OBJECT,
          description: 'Summon a new mystical artifact based on the user description.',
          properties: {
            prompt: {
              type: Type.STRING,
              description: 'A detailed description of the artifact to summon.',
            },
          },
          required: ['prompt'],
        },
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are the Sun Fish Oracle, a mystical guide to the Treasure of Fish Sun. You help players craft artifacts from the depths. If a player describes something they want to create, use the summon_artifact tool. Be mystical and helpful.',
          tools: [{ functionDeclarations: [summonFunc] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setAppState(AppState.LIVE);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              setLiveTranscript(prev => ({ ...prev, input: msg.serverContent!.inputTranscription!.text }));
            }
            if (msg.serverContent?.outputTranscription) {
              setLiveTranscript(prev => ({ ...prev, output: msg.serverContent!.outputTranscription!.text }));
            }
            if (msg.serverContent?.turnComplete) {
              setLiveTranscript({ input: '', output: '' });
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              const startTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'summon_artifact') {
                  handleSummon(1, (fc.args as any).prompt);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Summoning ritual initiated." } } }));
                }
              }
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: (e) => console.error("Voice Error:", e),
        },
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start voice:", err);
      alert("Microphone access is required for Voice Mode.");
    }
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
        isVoiceActive={isVoiceActive}
        onToggleVoice={toggleVoice}
        liveTranscript={liveTranscript}
      />
    </div>
  );
};

export default App;
