
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback } from 'react';
import { AppState, GachaItem } from '../types';
import { 
  HelpCircle, Sparkles, ChevronRight, Zap, Target, Hammer, Boxes, 
  Activity, TrendingUp, ShoppingBag, 
  ArrowUpCircle, DollarSign, Filter, ArrowUpDown, Tag, 
  Package, RefreshCcw, LayoutGrid, Trash2, Mic, MicOff
} from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
}

interface UIOverlayProps {
  luckiness: number;
  isGenerating: boolean;
  currentReward: GachaItem | null;
  onSummon: (count: number, prompt?: string) => void;
  onCloseReveal: () => void;
  appState: AppState;
  activeTab: 'portal' | 'rig' | 'market';
  setActiveTab: (tab: 'portal' | 'rig' | 'market') => void;
  inventory: GachaItem[];
  stakedIds: Set<string>;
  onToggleStake: (id: string) => void;
  credits: number;
  onViewItem: (item: GachaItem) => void;
  onEvolve: (id: string) => void;
  onSell: (id: string) => void;
  shopItems: GachaItem[];
  onBuy: (id: string) => void;
  onRefreshShop: () => void;
  onOpenMysteryCache: () => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  liveTranscript: { input: string; output: string };
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  luckiness,
  isGenerating,
  currentReward,
  onSummon,
  onCloseReveal,
  appState,
  activeTab,
  setActiveTab,
  inventory,
  stakedIds,
  onToggleStake,
  credits,
  onViewItem,
  onEvolve,
  onSell,
  shopItems,
  onBuy,
  onRefreshShop,
  onOpenMysteryCache,
  isVoiceActive,
  onToggleVoice,
  liveTranscript
}) => {
  const [filterRarity, setFilterRarity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'power' | 'level' | 'rarity'>('rarity');
  const [marketView, setMarketView] = useState<'shop' | 'sell'>('shop');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  
  const filteredInventory = useMemo(() => {
    let list = [...inventory];
    if (filterRarity !== 'All') {
      list = list.filter(item => item.rarity === filterRarity);
    }
    list.sort((a, b) => {
      if (sortBy === 'power') return b.miningPower - a.miningPower;
      if (sortBy === 'level') return b.level - a.level;
      if (sortBy === 'rarity') {
        const weight = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
        return weight[b.rarity] - weight[a.rarity];
      }
      return 0;
    });
    return list;
  }, [inventory, filterRarity, sortBy]);

  const totalMiningPower = inventory.reduce((sum, item) => {
      if (!stakedIds.has(item.id)) return sum;
      return sum + (item.miningPower * (1 + (item.level - 1) * 0.2));
  }, 0);

  const getRarityColor = (rarity: string) => {
    if (rarity === 'Legendary') return 'text-yellow-400';
    if (rarity === 'Epic') return 'text-purple-400';
    if (rarity === 'Rare') return 'text-cyan-400';
    return 'text-slate-400';
  };

  const getRarityBg = (rarity: string) => {
    if (rarity === 'Legendary') return 'bg-yellow-500/20';
    if (rarity === 'Epic') return 'bg-purple-500/20';
    if (rarity === 'Rare') return 'bg-cyan-500/20';
    return 'bg-slate-500/20';
  };

  const handleToggleStakeWithFeedback = useCallback((e: React.MouseEvent, id: string) => {
    const isStaking = !stakedIds.has(id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setAnimatingId(id);
    onToggleStake(id);

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x,
      y,
      tx: (Math.random() - 0.5) * 200,
      ty: (Math.random() - 0.5) * 200,
      color: isStaking ? '#ec4899' : '#22d3ee'
    }));

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);

    setTimeout(() => {
      setAnimatingId(null);
    }, 600);
  }, [stakedIds, onToggleStake]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col font-sans overflow-hidden">
      
      {/* Particles Layer */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{ 
            left: p.x, 
            top: p.y, 
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            '--tx': `${p.tx}px`, 
            '--ty': `${p.ty}px` 
          } as React.CSSProperties} 
        />
      ))}

      {/* --- Header --- */}
      <div className="pt-8 px-6 flex justify-between items-start relative z-10">
        <div className="flex flex-col">
            <h1 className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] tracking-tighter italic">
                SUN FISH <span className="text-2xl text-white font-bold align-middle mx-1 not-italic">BAZAAR</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30">
                    <Zap size={12} className="text-yellow-400 fill-current" />
                    <span className="text-xs font-black text-white">{credits.toLocaleString()} Credits</span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-pink-500/30">
                    <Target size={12} className="text-pink-500" />
                    <span className="text-xs font-black text-white">{totalMiningPower.toFixed(1)} Pwr</span>
                </div>
            </div>
        </div>
        
        {/* Voice Portal Button */}
        <button 
          onClick={onToggleVoice}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            isVoiceActive 
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
              : 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300 backdrop-blur-sm'
          }`}
        >
          {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="text-xs font-black uppercase tracking-widest">{isVoiceActive ? 'Close Oracle' : 'Voice Portal'}</span>
        </button>
      </div>

      {/* --- Tabs --- */}
      <div className="flex justify-center gap-2 mt-6 pointer-events-auto px-4 z-20">
        <button 
            onClick={() => setActiveTab('portal')}
            className={`flex-1 max-w-[130px] py-3 rounded-2xl font-black text-[10px] uppercase border-b-4 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'portal' 
                ? 'bg-gradient-to-b from-cyan-500 to-blue-700 text-white border-blue-900 shadow-xl' 
                : 'bg-indigo-900/40 text-indigo-300 border-indigo-950 hover:bg-indigo-900/60'
            }`}
        >
            <Boxes size={14} /> Portal
        </button>
        <button 
            onClick={() => setActiveTab('rig')}
            className={`flex-1 max-w-[130px] py-3 rounded-2xl font-black text-[10px] uppercase border-b-4 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'rig' 
                ? 'bg-gradient-to-b from-pink-500 to-purple-700 text-white border-purple-900 shadow-xl' 
                : 'bg-indigo-900/40 text-indigo-300 border-indigo-950 hover:bg-indigo-900/60'
            }`}
        >
            <Hammer size={14} /> Rig
        </button>
        <button 
            onClick={() => setActiveTab('market')}
            className={`flex-1 max-w-[130px] py-3 rounded-2xl font-black text-[10px] uppercase border-b-4 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'market' 
                ? 'bg-gradient-to-b from-amber-500 to-orange-700 text-white border-orange-900 shadow-xl' 
                : 'bg-indigo-900/40 text-indigo-300 border-indigo-950 hover:bg-indigo-900/60'
            }`}
        >
            <ShoppingBag size={14} /> Bazaar
        </button>
      </div>

      {activeTab === 'portal' && (
        <>
            <div className="flex-1 flex flex-col justify-center items-center relative">
                {appState === AppState.STABLE && (
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-2 animate-pulse">
                        <Activity size={18} className="text-cyan-400" />
                        <span className="text-xs text-white font-black tracking-widest uppercase">Nodes Online: QuantumCore-Sun</span>
                    </div>
                )}
                
                {/* Voice Interaction Overlay */}
                {isVoiceActive && (
                  <div className="absolute inset-x-0 bottom-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-full max-w-lg bg-black/80 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 p-6 flex flex-col items-center gap-4 shadow-2xl">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                           <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Oracle Active</span>
                        </div>
                        
                        <div className="flex flex-col w-full gap-2">
                            {liveTranscript.input && (
                              <p className="text-sm font-bold text-white/90 italic bg-white/5 p-3 rounded-xl border border-white/5">
                                "{liveTranscript.input}"
                              </p>
                            )}
                            {liveTranscript.output && (
                              <p className="text-sm font-black text-cyan-300 leading-relaxed bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10">
                                {liveTranscript.output}
                              </p>
                            )}
                            {!liveTranscript.input && !liveTranscript.output && (
                              <p className="text-xs font-bold text-white/30 text-center uppercase tracking-widest py-4">
                                Speak your heart's desire... "Oracle, summon a golden solar hammer"
                              </p>
                            )}
                        </div>

                        {/* Visual Pulse */}
                        <div className="flex gap-1 items-center h-4">
                            {[...Array(12)].map((_, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-cyan-400 rounded-full animate-pulse" 
                                style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                        </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="pb-12 px-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-sm flex flex-col items-center gap-2">
                    <div className="flex justify-between w-full px-1">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Solar Pulse Calibration</span>
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{Math.floor(luckiness)}%</span>
                    </div>
                    <div className="w-full bg-indigo-950/80 h-4 rounded-full border border-cyan-500/20 overflow-hidden relative shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-cyan-600 via-pink-500 to-yellow-400 transition-all duration-1000 ease-out"
                            style={{ width: `${luckiness}%` }}
                        />
                    </div>
                </div>

                <div className="flex justify-center gap-4 w-full max-w-md pointer-events-auto">
                    <button onClick={() => onSummon(33)} disabled={isGenerating} className="flex-1 h-20 bg-gradient-to-br from-indigo-600 to-indigo-900 border-b-4 border-indigo-950 rounded-3xl flex flex-col items-center justify-center shadow-2xl active:translate-y-1 active:border-b-0 disabled:opacity-50 group">
                        <span className="text-[10px] font-black text-indigo-200 tracking-widest group-hover:text-white transition-colors">SUMMON X33</span>
                        <div className="flex items-center gap-1"><Zap size={14} className="text-cyan-400 fill-current" /><span className="text-lg font-black text-white">750</span></div>
                    </button>
                    <button onClick={() => onSummon(10)} disabled={isGenerating} className="flex-1 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 border-b-4 border-cyan-900 rounded-3xl flex flex-col items-center justify-center shadow-2xl active:translate-y-1 active:border-b-0 disabled:opacity-50 group">
                        <span className="text-[10px] font-black text-cyan-950 tracking-widest group-hover:text-indigo-950 transition-colors uppercase">SUMMON X10</span>
                        <div className="flex items-center gap-1"><Zap size={14} className="text-indigo-950 fill-current" /><span className="text-lg font-black text-indigo-950">250</span></div>
                    </button>
                </div>
            </div>
        </>
      )}

      {activeTab === 'rig' && (
        <div className="flex-1 flex flex-col px-6 mt-8 pb-12 overflow-hidden pointer-events-auto">
            <div className="bg-indigo-950/60 backdrop-blur-xl rounded-[2.5rem] border border-pink-500/20 p-8 flex flex-col h-full overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Evolution Rig</h2>
                        <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Merge duplicates or spend credits to upgrade</p>
                    </div>
                    <button onClick={() => setSortBy(prev => prev === 'power' ? 'level' : (prev === 'level' ? 'rarity' : 'power'))} className="p-3 bg-indigo-900/40 rounded-2xl text-indigo-300 border border-indigo-500/20 hover:bg-indigo-900 flex items-center gap-2">
                       <ArrowUpDown size={18} />
                       <span className="text-[10px] font-black uppercase">{sortBy}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
                    {filteredInventory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <LayoutGrid size={64} className="mb-6 text-indigo-500" />
                            <p className="text-sm font-black uppercase text-white tracking-widest">No Artifacts Registered</p>
                        </div>
                    ) : (
                        filteredInventory.map((item) => {
                          const isStaked = stakedIds.has(item.id);
                          const isAnimating = animatingId === item.id;
                          const powerWithBonus = (item.miningPower * (1 + (item.level - 1) * 0.2)).toFixed(1);
                          const hasDuplicate = inventory.some(i => i.name === item.name && i.id !== item.id && !stakedIds.has(i.id));
                          
                          return (
                            <div key={item.id} className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-300 relative overflow-hidden ${
                                isStaked ? 'staked-card border-pink-500/50' : 'bg-indigo-900/30 border-white/5'
                            }`}>
                                {isAnimating && <div className="just-staked-overlay" />}

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${getRarityBg(item.rarity)}`}>
                                        <Boxes size={24} className={getRarityColor(item.rarity)} />
                                        <div className="absolute -top-2 -right-2 bg-black px-2 rounded-lg border border-white/20 text-[10px] font-black text-white shadow-xl">
                                            {powerWithBonus}P
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-md font-black text-white uppercase italic leading-none">{item.name}</h3>
                                            <span className="text-[11px] font-black text-cyan-400 bg-cyan-400/20 px-2 py-0.5 rounded-lg border border-cyan-400/30">LV.{item.level}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                                            {isStaked && <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1"><Activity size={10} className="mining-dot" /> ACTIVE</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <button onClick={() => onViewItem(item)} className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-300 hover:bg-indigo-500/40 border border-indigo-500/20">
                                        <Target size={20} />
                                    </button>
                                    <button onClick={() => onEvolve(item.id)} className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 border-2 transition-all ${
                                      hasDuplicate ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                    }`}>
                                        <ArrowUpCircle size={16} /> {hasDuplicate ? 'FUSE' : 'UPGRADE'}
                                    </button>
                                    <button 
                                      onClick={(e) => handleToggleStakeWithFeedback(e, item.id)} 
                                      className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all shadow-lg active:scale-90 ${
                                          isStaked ? 'bg-pink-500 text-white shadow-pink-500/30' : 'bg-indigo-800/40 text-indigo-200 border border-indigo-500/20'
                                      }`}
                                    >
                                        {isStaked ? 'OFFLINE' : 'STAKE'}
                                    </button>
                                </div>
                            </div>
                          );
                        })
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="flex-1 flex flex-col px-6 mt-8 pb-12 overflow-hidden pointer-events-auto">
            <div className="bg-indigo-950/60 backdrop-blur-xl rounded-[2.5rem] border border-amber-500/20 p-8 flex flex-col h-full overflow-hidden shadow-2xl">
                
                {/* Marketplace Sub-tabs */}
                <div className="flex items-center gap-4 mb-6 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => setMarketView('shop')}
                      className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        marketView === 'shop' ? 'bg-amber-500 text-amber-950 shadow-lg' : 'text-amber-500/60 hover:text-amber-500'
                      }`}
                    >
                      <Tag size={16} /> Sun Fish Shop
                    </button>
                    <button 
                      onClick={() => setMarketView('sell')}
                      className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all ${
                        marketView === 'sell' ? 'bg-amber-500 text-amber-950 shadow-lg' : 'text-amber-500/60 hover:text-amber-500'
                      }`}
                    >
                      <DollarSign size={16} /> Sell Inventory
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
                  {marketView === 'shop' ? (
                    <>
                      {/* Featured Mystery Cache */}
                      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-amber-400/40 flex items-center justify-between mb-4 shadow-2xl relative overflow-hidden group">
                          <div className="absolute inset-0 bg-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-amber-400/20 rounded-3xl flex items-center justify-center border border-amber-400/40">
                              <Package size={32} className="text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white italic leading-tight">Quantum Fish Cache</h3>
                              <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest">Contains 1 Random Artifact</p>
                            </div>
                          </div>
                          <button 
                            onClick={onOpenMysteryCache}
                            className="px-8 py-4 bg-amber-500 rounded-2xl text-xs font-black text-amber-950 shadow-xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 relative z-10"
                          >
                            <Zap size={16} fill="currentColor" /> 400 Credits
                          </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {shopItems.map((item) => {
                          const price = item.rarity === 'Legendary' ? 5000 : (item.rarity === 'Epic' ? 1800 : 750);
                          return (
                            <div key={item.id} className="p-5 rounded-[2rem] border border-white/5 bg-black/30 flex items-center justify-between hover:border-amber-500/30 transition-all group">
                              <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getRarityBg(item.rarity)} group-hover:scale-110 transition-transform`}>
                                  <Boxes size={24} className={getRarityColor(item.rarity)} />
                                </div>
                                <div>
                                  <h3 className="text-md font-black text-white uppercase italic">{item.name}</h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black uppercase ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Base Power: {item.miningPower}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => onBuy(item.id)}
                                className="px-6 py-3 bg-indigo-900 border border-amber-500/30 text-amber-400 rounded-2xl text-[11px] font-black shadow-lg hover:bg-amber-500 hover:text-amber-950 transition-all flex items-center gap-2"
                              >
                                <ShoppingBag size={14} /> Buy: {price}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        onClick={onRefreshShop}
                        className="w-full py-4 mt-2 border-2 border-dashed border-white/10 rounded-3xl text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <RefreshCcw size={14} /> Cycle Bazaar Inventory
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Sell Filters */}
                      <div className="flex items-center gap-2 mb-2">
                          <button onClick={() => setFilterRarity('All')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${filterRarity === 'All' ? 'bg-amber-500 text-amber-950 border-amber-600' : 'text-amber-500 border-amber-500/20'}`}>All</button>
                          <button onClick={() => setFilterRarity('Rare')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${filterRarity === 'Rare' ? 'bg-cyan-500 text-cyan-950 border-cyan-600' : 'text-cyan-500 border-cyan-500/20'}`}>Rare</button>
                          <button onClick={() => setFilterRarity('Epic')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${filterRarity === 'Epic' ? 'bg-purple-500 text-purple-950 border-purple-600' : 'text-purple-500 border-purple-500/20'}`}>Epic</button>
                          <button onClick={() => setFilterRarity('Legendary')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${filterRarity === 'Legendary' ? 'bg-yellow-500 text-yellow-950 border-yellow-600' : 'text-yellow-500 border-yellow-500/20'}`}>Legendary</button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {filteredInventory.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                <Boxes size={48} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nothing for sale matching filters</p>
                            </div>
                        ) : (
                            filteredInventory.map((item) => {
                                const basePrice = item.rarity === 'Legendary' ? 2000 : (item.rarity === 'Epic' ? 800 : 250);
                                const finalPrice = Math.floor(basePrice * (1 + (item.level - 1) * 0.2));
                                const isStaked = stakedIds.has(item.id);
                                
                                return (
                                  <div key={item.id} className="p-4 rounded-[1.5rem] border border-white/5 bg-black/20 flex items-center justify-between transition-all hover:bg-black/40 group">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getRarityBg(item.rarity)}`}>
                                        <Boxes size={20} className={getRarityColor(item.rarity)} />
                                      </div>
                                      <div>
                                        <h3 className="text-sm font-black text-white uppercase italic">{item.name} <span className="text-[9px] opacity-40 not-italic ml-1">LV.{item.level}</span></h3>
                                        <span className={`text-[9px] font-black uppercase ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-2">
                                            <div className="text-amber-400 font-black text-xs">+{finalPrice}</div>
                                            <div className="text-[8px] text-white/30 uppercase font-bold">Estimated Value</div>
                                        </div>
                                        <button 
                                          onClick={() => onSell(item.id)}
                                          disabled={isStaked}
                                          className={`p-3 rounded-xl transition-all shadow-lg ${
                                            isStaked 
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white'
                                          }`}
                                          title={isStaked ? "Unstake to sell" : "Sell artifact"}
                                        >
                                          {isStaked ? <Activity size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                  </div>
                                );
                            })
                        )}
                      </div>
                    </>
                  )}
                </div>
            </div>
        </div>
      )}

      {/* --- State Transitions --- */}
      {appState === AppState.EVOLVING && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-cyan-950/60 backdrop-blur-2xl animate-in fade-in">
           <div className="relative mb-8">
              <TrendingUp size={100} className="text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 bg-cyan-400 blur-[100px] opacity-20" />
           </div>
           <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase text-center">FUSION COMPLETE</h2>
           <p className="text-cyan-400 font-black uppercase tracking-[0.5em] text-sm mt-4 animate-bounce">Artifact Resonated</p>
        </div>
      )}

      {/* --- Reveal Modal --- */}
      {appState === AppState.REVEALING && currentReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto bg-indigo-950/90 backdrop-blur-3xl animate-in fade-in">
            <div className="flex flex-col items-center max-w-sm text-center p-12 animate-in zoom-in slide-in-from-bottom-24 duration-500">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20 animate-pulse" />
                    <Sparkles className="text-cyan-400 w-24 h-24 animate-[spin_10s_linear_infinite]" />
                </div>
                
                <div className="space-y-2 mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                        currentReward.rarity === 'Legendary' ? 'bg-yellow-500 text-black' : (currentReward.rarity === 'Epic' ? 'bg-purple-500 text-white' : 'bg-cyan-500/20 text-cyan-300')
                    }`}>
                        {currentReward.rarity} ACQUIRED
                    </span>
                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
                        {currentReward.name}
                    </h2>
                </div>

                <p className="text-cyan-200/60 font-bold text-sm leading-relaxed mb-12 bg-black/40 p-6 rounded-[2rem] border border-white/5">
                    {currentReward.description}
                </p>

                <button onClick={onCloseReveal} className="group relative px-16 py-5 bg-cyan-400 text-indigo-950 font-black rounded-[2rem] shadow-[0_20px_40px_rgba(34,211,238,0.3)] hover:bg-white hover:scale-105 transition-all flex items-center gap-4 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    ADD TO COLLECTION <ChevronRight size={24} />
                </button>
            </div>
        </div>
      )}

      {/* --- Summoning Overlay --- */}
      {appState === AppState.SUMMONING && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/80 backdrop-blur-xl animate-in fade-in">
              <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[120px] opacity-40 animate-pulse" />
                  <div className="w-40 h-40 border-[12px] border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={48} className="text-yellow-400 animate-bounce" />
                  </div>
              </div>
              <h3 className="text-cyan-400 font-black text-3xl mt-12 tracking-[0.8em] animate-pulse uppercase italic">RITUAL ACTIVE</h3>
              <p className="text-white/30 text-xs font-black uppercase mt-4 tracking-widest">Sychronizing with the Sun Fish...</p>
          </div>
      )}

    </div>
  );
};
