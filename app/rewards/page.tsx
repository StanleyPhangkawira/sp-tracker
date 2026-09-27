"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpinningWheel from "../../components/SpinningWheel";
import { useAppContext } from "../../context/AppContext";
import { ShoppingCart, Dices, Coins, Sparkles, Wand2 } from "lucide-react";

interface FlyingParticle {
  id: string; type: 'coin' | 'token';
  startX: number; startY: number; endX: number; endY: number;
}

export default function RewardsPage() {
  const { spCoins, setSpCoins, setSpinTokens, wheelSlices, setWheelSlices } = useAppContext();
  const [logs, setLogs] = useState<string[]>([]);
  const [particles, setParticles] = useState<FlyingParticle[]>([]);
  const [isGlowing, setIsGlowing] = useState(false);

  const shopItems = [ { tokens: 1, cost: 100 }, { tokens: 2, cost: 190 }, { tokens: 3, cost: 280 }, { tokens: 5, cost: 450 }, { tokens: 10, cost: 850 } ];

  const ENCH_TIERS: Record<string, { f: string, t: number }> = {
    "Altering I": { f: "Altering", t: 1 }, "Altering II": { f: "Altering", t: 2 },
    "Quietness I": { f: "Quietness", t: 1 }, "Quietness II": { f: "Quietness", t: 2 },
    "Purity I": { f: "Purity", t: 1 }, "Purity II": { f: "Purity", t: 2 }, "Purity III": { f: "Purity", t: 3 }, "Purity IV": { f: "Purity", t: 4 },
    "Tail I": { f: "Tail", t: 1 }, "Tail II": { f: "Tail", t: 2 }, "Tail III": { f: "Tail", t: 3 },
    "Breaking": { f: "Breaking", t: 1 }, "Respect": { f: "Respect", t: 1 }
  };

  const handleBuyTokens = (e: React.MouseEvent, cost: number, tokens: number) => {
    if (spCoins >= cost) {
      const btn = e.currentTarget.getBoundingClientRect();
      const spEl = document.getElementById("sp-resource")?.getBoundingClientRect();
      const tokenEl = document.getElementById("token-resource")?.getBoundingClientRect();

      const newParticles: FlyingParticle[] = [];
      if (spEl) newParticles.push({ id: `c-${Date.now()}`, type: 'coin', startX: spEl.left + spEl.width/2, startY: spEl.top + spEl.height/2, endX: btn.left + btn.width/2, endY: btn.top + btn.height/2 });
      if (tokenEl) newParticles.push({ id: `t-${Date.now()}`, type: 'token', startX: btn.left + btn.width/2, startY: btn.top + btn.height/2, endX: tokenEl.left + tokenEl.width/2, endY: tokenEl.top + tokenEl.height/2 });

      setParticles(prev => [...prev, ...newParticles]);

      setTimeout(() => {
        setSpCoins(prev => prev - cost);
        setSpinTokens(prev => prev + tokens);
        setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id)));
      }, 700);
    }
  };

  const handleBuyEnchantment = (type: 'common' | 'rare') => {
    const cost = type === 'common' ? 40 : 80;
    if (spCoins < cost || wheelSlices.length === 0) return;

    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 2000);

    let newSlices = [...wheelSlices];
    const numTargets = type === 'common' ? 3 : 2;
    const pool = type === 'common' 
      ? ["Altering I", "Quietness I", "Purity I", "Purity II", "Tail I"]
      : ["Altering II", "Breaking", "Quietness II", "Purity III", "Purity IV", "Respect", "Tail II", "Tail III"];
    
    let refund = 0; let localLogs = [];

    for(let i = 0; i < numTargets; i++) {
        if (newSlices.length === 0) break;
        const targetIdx = Math.floor(Math.random() * newSlices.length);
        const slice = { ...newSlices[targetIdx] };
        slice.enchantments = slice.enchantments ? [...slice.enchantments] : [];
        
        const ench = pool[Math.floor(Math.random() * pool.length)];
        const familyMatch = ENCH_TIERS[ench].f;
        const existingIdx = slice.enchantments.findIndex(e => ENCH_TIERS[e]?.f === familyMatch);
        
        if (existingIdx !== -1) {
            const existingEnch = slice.enchantments[existingIdx];
            if (existingEnch === ench || ENCH_TIERS[existingEnch].t >= ENCH_TIERS[ench].t) {
                const rf = Math.floor(Math.random() * 6) + 5; refund += rf;
                localLogs.push(`Redundant ${ench} on "${slice.text}". Refunded ${rf} SP.`);
            } else {
                slice.enchantments[existingIdx] = ench;
                localLogs.push(`Upgraded to ${ench} on "${slice.text}"!`);
            }
        } else {
            slice.enchantments.push(ench);
            localLogs.push(`Applied ${ench} to "${slice.text}"!`);
        }
        newSlices[targetIdx] = slice;
    }

    setSpCoins(prev => prev - cost + refund); setWheelSlices(newSlices);
    setLogs(localLogs); setTimeout(() => setLogs([]), 6000);
  };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pt-20 md:pt-10 space-y-8 relative">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div key={p.id} initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 0.5 }} animate={{ x: p.endX, y: p.endY, opacity: 0, scale: 1.5 }} transition={{ duration: 0.7, ease: "easeOut" }} className="fixed z-[100] pointer-events-none">
            {p.type === 'coin' ? <Coins className="text-yellow-500 bg-yellow-100 rounded-full p-1 shadow-xl" size={32}/> : <Dices className="text-purple-500 bg-purple-100 rounded-full p-1 shadow-xl" size={32}/>}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {logs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed top-20 right-10 bg-gray-900 text-white p-4 rounded-xl shadow-2xl z-50">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-fuchsia-400"><Sparkles size={16}/> Enchantment Report</h4>
            <ul className="text-sm space-y-1">{logs.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div><h1 className="text-3xl font-bold text-gray-800">Rewards & Shop</h1><p className="text-gray-500 mt-2">Buy Spin Tokens and Enchant your slices.</p></div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4"><ShoppingCart className="text-blue-500" /><h2 className="text-xl font-bold text-gray-800">Tokens</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {shopItems.map((item, idx) => (
              <button key={idx} onClick={(e) => handleBuyTokens(e, item.cost, item.tokens)} disabled={spCoins < item.cost} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all disabled:opacity-50 group relative">
                <div className="flex items-center gap-1 text-purple-600 font-black mb-2"><Dices size={20} /> x{item.tokens}</div>
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-bold"><Coins size={12} /> {item.cost}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 mb-4"><Wand2 className="text-indigo-500" /><h2 className="text-xl font-bold text-gray-800">Enchanting</h2></div>
          <div className="flex gap-4">
            <button onClick={() => handleBuyEnchantment('common')} disabled={spCoins < 40} className={`flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 p-4 rounded-xl hover:scale-105 transition-all disabled:opacity-50 ${isGlowing ? 'border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'border-indigo-200'}`}>
              <h3 className="font-bold text-indigo-800 text-sm">Common Box</h3>
              <p className="text-xs text-indigo-600 mb-2 mt-1 leading-tight">Enchants 3 random slices</p>
              <span className="flex items-center justify-center gap-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold py-1 w-full"><Coins size={12}/> 40 SP</span>
            </button>
            <button onClick={() => handleBuyEnchantment('rare')} disabled={spCoins < 80} className={`flex-1 bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 p-4 rounded-xl hover:scale-105 transition-all disabled:opacity-50 ${isGlowing ? 'border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.8)]' : 'border-fuchsia-200'}`}>
              <h3 className="font-bold text-fuchsia-800 text-sm">Rare Box</h3>
              <p className="text-xs text-fuchsia-600 mb-2 mt-1 leading-tight">Enchants 2 random slices</p>
              <span className="flex items-center justify-center gap-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold py-1 w-full"><Coins size={12}/> 80 SP</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <SpinningWheel isGlowing={isGlowing} />
      </div>
    </div>
  );
}