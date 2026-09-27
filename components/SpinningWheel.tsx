"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Plus, RotateCcw, Check, Clock, PackageOpen, Dices, History, List, Sparkles } from "lucide-react";
import { useAppContext, WheelSlice, RewardItem, SliceType } from "../context/AppContext";

const formatTime = (totalSeconds: number) => {
  if (!totalSeconds) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  let res = [];
  if (h > 0) res.push(`${h}h`);
  if (m > 0) res.push(`${m}m`);
  if (s > 0 || res.length === 0) res.push(`${s}s`);
  return res.join(' ');
};

interface SpinningWheelProps {
  isGlowing?: boolean;
}

export default function SpinningWheel({ isGlowing = false }: SpinningWheelProps) {
  const { spinTokens, setSpinTokens, wheelSlices, setWheelSlices, inventory, setInventory, timeAllowances, setTimeAllowances, history, setHistory } = useAppContext();
  const [activeTab, setActiveTab] = useState<'inventory'|'time'|'entries'|'history'>('entries');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WheelSlice>>({});
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [idleRotation, setIdleRotation] = useState(0); 
  const [winner, setWinner] = useState<WheelSlice | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  
  const [activatingWildcardId, setActivatingWildcardId] = useState<string | null>(null);
  const [wildcardTargets, setWildcardTargets] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const getPastelColor = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 75%)`;
  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current;
    const radius = width / 2;
    ctx.clearRect(0, 0, width, height);

    if (wheelSlices.length === 0) { ctx.beginPath(); ctx.arc(radius, radius, radius, 0, 2 * Math.PI); ctx.fillStyle = "#e5e7eb"; ctx.fill(); return; }
    const sliceAngle = (2 * Math.PI) / wheelSlices.length;

    wheelSlices.forEach((item, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath(); ctx.moveTo(radius, radius); ctx.arc(radius, radius, radius, startAngle, endAngle); ctx.closePath();
      ctx.fillStyle = item.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.save(); ctx.translate(radius, radius); ctx.rotate(startAngle + sliceAngle / 2); ctx.textAlign = "right"; ctx.fillStyle = "#1e293b"; ctx.font = "bold 14px Inter, sans-serif";
      
      const totalSec = item.rewards?.reduce((acc, r) => acc + (r.durationSeconds || 0), 0) || 0;
      const tks = item.rewards?.reduce((acc, r) => acc + (r.spinTokens || 0), 0) || 0;
      
      let extra = [];
      if (totalSec > 0) extra.push(formatTime(totalSec));
      if (tks > 0) extra.push(`${tks}Tk`);
      const txt = `${item.enchantments?.length ? '✨' : ''}${item.text || 'Slice'} ${extra.length ? `(${extra.join('+')})` : ''}`;
      
      ctx.fillText(txt, radius - 25, 5); ctx.restore();
    });
  }, [wheelSlices]);

  useEffect(() => {
    if (isSpinning) return;
    let animId: number;
    const tick = () => { setIdleRotation(prev => (prev + 0.15) % 360); animId = requestAnimationFrame(tick); };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isSpinning]);

  const handleAddSlice = () => {
    const newId = Date.now().toString();
    const newSlice: WheelSlice = { id: newId, text: "", color: getPastelColor(), rewards: [] };
    setWheelSlices(prev => [...prev, newSlice]); setEditingId(newId); setEditForm(newSlice);
  };
  const handleDeleteSlice = (id: string) => { setWheelSlices(prev => prev.filter(s => s.id !== id)); if (editingId === id) setEditingId(null); };
  const startEdit = (slice: WheelSlice) => { setEditingId(slice.id); setEditForm(slice); };
  const saveEdit = () => { setWheelSlices(wheelSlices.map(s => s.id === editingId ? { ...s, ...editForm } as WheelSlice : s)); setEditingId(null); };

  const processEnchantments = (winSlice: WheelSlice) => {
    let activeSlices = JSON.parse(JSON.stringify(wheelSlices)) as WheelSlice[];
    let localAnnounce: string[] = []; let inventoryAdditions: typeof inventory = []; let bonusTokens = 0;
    const allRewards = () => activeSlices.flatMap(s => s.rewards.map(r => ({ slice: s, reward: r })));

    winSlice.enchantments?.forEach(ench => {
        let winIdx = activeSlices.findIndex(s => s.id === winSlice.id);
        if (ench === "Respect" && activeSlices.length >= 2) {
            const s1 = activeSlices.splice(Math.floor(Math.random() * activeSlices.length), 1)[0];
            const s2 = activeSlices.splice(Math.floor(Math.random() * activeSlices.length), 1)[0];
            activeSlices.push({ id: Date.now().toString() + Math.random(), text: `Combo Slice`, color: getPastelColor(), rewards: [...s1.rewards, ...s2.rewards], enchantments: [] });
            localAnnounce.push(`Respect: Merged "${s1.text}" & "${s2.text}" into Combo!`);
        }
        else if ((ench === "Altering I" || ench === "Altering II") && activeSlices.length >= 2) {
            let perms = allRewards().filter(x => x.reward.type === 'permanent');
            if (perms.length >= 2) {
                let cut = perms[Math.floor(Math.random() * perms.length)]; let add = perms.find(p => p.reward.id !== cut.reward.id);
                if (add) {
                    let oldCut = cut.reward.durationSeconds; let oldAdd = add.reward.durationSeconds;
                    cut.reward.durationSeconds = Math.max(0, oldCut - 120);
                    add.reward.durationSeconds = oldAdd + (ench === "Altering I" ? 180 : 240);
                    localAnnounce.push(`${ench}: "${cut.reward.target}" ${formatTime(oldCut)}->${formatTime(cut.reward.durationSeconds)}. "${add.reward.target}" ${formatTime(oldAdd)}->${formatTime(add.reward.durationSeconds)}`);
                }
            }
        }
        else if (ench === "Breaking") {
            const bRewards = winSlice.rewards.filter(r => r.type === 'permanent').map(r => ({ ...r, id: 'b'+Math.random(), type: 'booster' as SliceType, durationSeconds: Math.ceil(r.durationSeconds * 3.5) }));
            if (bRewards.length > 0) {
              inventoryAdditions.push({ id: Date.now().toString()+Math.random(), timestamp: new Date().toLocaleTimeString(), slice: { ...winSlice, id: 'brk'+Date.now(), text: `(Break) ${winSlice.text}`, rewards: bRewards, enchantments: [] } });
              localAnnounce.push(`Breaking: Generated massive 350% Booster!`);
            }
        }
        else if (ench.startsWith("Quietness")) {
            if (winIdx !== -1) activeSlices[winIdx].enchantments = activeSlices[winIdx].enchantments?.filter(e => e !== ench);
            let targets = allRewards();
            if (targets.length) {
                let rand = targets[Math.floor(Math.random() * targets.length)]; let old = rand.reward.durationSeconds;
                rand.reward.durationSeconds = Math.ceil(old * (ench === "Quietness I" ? 1.1 : 1.3));
                if (rand.slice.enchantments?.includes("Quietness I")) { rand.slice.enchantments = rand.slice.enchantments.filter(e => e !== "Quietness I"); rand.slice.enchantments.push("Quietness II"); }
                localAnnounce.push(`${ench}: "${rand.reward.target}" ${formatTime(old)}->${formatTime(rand.reward.durationSeconds)}`);
            }
        }
        else if (ench.startsWith("Purity")) {
            let targets = allRewards();
            if (targets.length) {
                let rand = targets[Math.floor(Math.random() * targets.length)]; let old = rand.reward.durationSeconds;
                if (rand.reward.type === 'permanent') rand.reward.durationSeconds += (ench === "Purity I" ? 60 : ench === "Purity II" ? 120 : 180);
                if (ench === "Purity IV" && rand.reward.type === 'booster') rand.reward.durationSeconds += 1800;
                localAnnounce.push(`${ench}: "${rand.reward.target}" ${formatTime(old)}->${formatTime(rand.reward.durationSeconds)}`);
            }
        }
        else if (ench.startsWith("Tail")) {
            bonusTokens++; let targets = allRewards().filter(x => x.reward.type === 'permanent' || x.reward.type === 'booster');
            if (targets.length) {
                let rand = targets[Math.floor(Math.random() * targets.length)]; let old = rand.reward.durationSeconds;
                rand.reward.durationSeconds = Math.ceil(old * (ench === "Tail I" ? 0.7 : ench === "Tail II" ? 0.8 : 0.9));
                localAnnounce.push(`${ench}: Gained Spin Token, "${rand.reward.target}" reduced ${formatTime(old)}->${formatTime(rand.reward.durationSeconds)}`);
            }
        }
    });
    setWheelSlices(activeSlices); if(bonusTokens > 0) setSpinTokens(prev => prev + bonusTokens);
    return { localAnnounce, inventoryAdditions };
  };

  const spinWheel = () => {
    if (wheelSlices.length === 0 || isSpinning || spinTokens < 1) return;
    setIsSpinning(true); setWinner(null); setAnnouncements([]); setSpinTokens(prev => prev - 1);
    
    const targetSpin = rotation + idleRotation + (Math.floor(Math.random() * 5 + 5) * 360) + Math.floor(Math.random() * 360);
    setRotation(targetSpin); setIdleRotation(0); 

    setTimeout(() => {
      setIsSpinning(false);
      const winningIndex = Math.floor(((360 - (targetSpin % 360)) % 360) / (360 / wheelSlices.length));
      const winningSlice = wheelSlices[winningIndex];
      setWinner(winningSlice); confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });

      const { localAnnounce, inventoryAdditions } = processEnchantments(winningSlice);
      if (localAnnounce.length) setAnnouncements(localAnnounce);
      setInventory(prev => [{ id: Date.now().toString(), slice: winningSlice, timestamp: new Date().toLocaleTimeString() }, ...inventoryAdditions, ...prev]);
      setHistory(prev => [{ id: Date.now().toString(), result: winningSlice.text, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    }, 4000);
  };

  const activateInventoryItem = (invItem: typeof inventory[0]) => {
    const { slice } = invItem;
    const missingWildcards = slice.rewards.filter(r => r.isWildcard && r.type !== 'token' && !wildcardTargets[r.id]);
    if (missingWildcards.length > 0) { setActivatingWildcardId(invItem.id); return; }

    slice.rewards.forEach(reward => {
      if (reward.type === 'token') {
         setSpinTokens(prev => prev + (reward.spinTokens || 1));
      } else {
         const targetName = reward.isWildcard ? wildcardTargets[reward.id] : reward.target;
         if (targetName && reward.durationSeconds) {
            setTimeAllowances(prev => {
               const existing = prev.find(p => p.target === targetName);
               const isNewDay = existing && existing.lastUpdated !== todayDateStr;
               let perm = existing ? existing.permanentSeconds : 0; let boost = (existing && !isNewDay) ? existing.boosterSeconds : 0;
               if (reward.type === 'permanent') perm += reward.durationSeconds; else if (reward.type === 'booster') boost += reward.durationSeconds;
               const updated = { target: targetName, permanentSeconds: perm, boosterSeconds: boost, lastUpdated: todayDateStr };
               if (existing) return prev.map(p => p.target === targetName ? updated : p);
               return [...prev, updated];
            });
         }
      }
    });

    setInventory(prev => prev.filter(i => i.id !== invItem.id)); setActivatingWildcardId(null); setWildcardTargets({});
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[80vh]">
      <div className="flex-1 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
        {winner && !isSpinning && (
          <div className="mb-6 text-center">
            <h2 className="text-xl text-purple-500 font-bold mb-1">Won Reward!</h2>
            <p className="text-3xl font-black text-gray-800 bg-purple-100 px-4 py-2 rounded-xl border border-purple-200">{winner.text}</p>
            {announcements.length > 0 && (
              <div className="mt-4 bg-white border border-gray-200 p-3 rounded-lg shadow-sm text-sm text-left max-w-sm">
                <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1"><Sparkles size={14}/> Effects Triggered:</h4>
                <ul className="text-gray-600 list-disc list-inside">{announcements.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 drop-shadow-md"></div>
          
          {/* Wheel Circle with Glow Prop */}
          <div className={`w-full h-full rounded-full overflow-hidden border-4 transition-transform ease-out ${isGlowing ? 'border-fuchsia-400 shadow-[0_0_40px_rgba(217,70,239,0.8)]' : 'shadow-2xl border-white'}`} style={{ transform: `rotate(${isSpinning ? rotation : rotation + idleRotation}deg)`, transitionDuration: isSpinning ? '4000ms' : '0ms' }}>
            <canvas ref={canvasRef} width={400} height={400} className="w-full h-full"/>
          </div>

          <button onClick={spinWheel} disabled={isSpinning || wheelSlices.length === 0 || spinTokens < 1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full shadow-2xl z-10 flex flex-col items-center justify-center font-black text-slate-800 hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide border-4 border-slate-100">
            <span className="text-xl">SPIN</span><span className="text-[10px] text-purple-600 flex items-center gap-1 mt-1"><Dices size={12}/> 1</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full md:max-h-[80vh] bg-white w-full overflow-hidden">
        <div className="grid grid-cols-4 w-full border-b border-gray-100 bg-white z-20">
          {[ { id: 'inventory', icon: PackageOpen, label: 'Inventory' }, { id: 'time', icon: Clock, label: 'Time' }, { id: 'entries', icon: List, label: 'Slices' }, { id: 'history', icon: History, label: 'History' } ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`py-4 flex flex-col items-center justify-center gap-1 transition-colors text-xs md:text-sm font-bold ${activeTab === t.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}>
              <t.icon size={18}/> <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Removed 'absolute inset-0' which crashed the layout height */}
        <div className="flex-1 relative overflow-x-hidden overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="p-4 md:p-6 space-y-4">
              
              {activeTab === 'inventory' && (
                <>
                  {inventory.length === 0 ? <p className="text-gray-400 text-center italic mt-10">Inventory is empty.</p> : null}
                  {inventory.map(item => {
                    const totalSec = item.slice.rewards.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
                    const tks = item.slice.rewards.reduce((acc, r) => acc + (r.spinTokens || 0), 0);
                    const hasWildcard = item.slice.rewards.some(r => r.isWildcard && r.type !== 'token');
                    
                    return (
                      <div key={item.id} className="flex flex-col bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              {item.slice.text} {totalSec > 0 && `(${formatTime(totalSec)})`} {tks > 0 && `(${tks}Tk)`} {item.slice.enchantments?.length ? <Sparkles size={14} className="text-yellow-500"/> : ''}
                            </p>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">{item.slice.rewards.map(r => r.type).join(' + ')}</p>
                          </div>
                          {activatingWildcardId !== item.id && (
                            <button onClick={() => activateInventoryItem(item)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shrink-0 ml-2">
                              {hasWildcard ? 'Configure' : 'Activate'}
                            </button>
                          )}
                        </div>
                        {activatingWildcardId === item.id && (
                          <div className="mt-3 space-y-2 w-full border-t border-gray-200 pt-2">
                            <p className="text-xs font-bold text-gray-500">Assign Wildcard Targets:</p>
                            {item.slice.rewards.filter(r => r.isWildcard && r.type !== 'token').map(rw => (
                               <input key={rw.id} type="text" placeholder={`Target App for ${formatTime(rw.durationSeconds)}`} value={wildcardTargets[rw.id] || ''} onChange={(e) => setWildcardTargets(prev => ({...prev, [rw.id]: e.target.value}))} className="w-full text-sm p-2 border border-blue-300 rounded-lg outline-none"/>
                            ))}
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setActivatingWildcardId(null)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">Cancel</button>
                              <button onClick={() => activateInventoryItem(item)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"><Check size={16}/> Confirm</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {activeTab === 'time' && (
                <>
                  {timeAllowances.map((allowance, idx) => {
                    const isActiveBooster = allowance.lastUpdated === todayDateStr && allowance.boosterSeconds > 0;
                    const totalSec = allowance.permanentSeconds + (isActiveBooster ? allowance.boosterSeconds : 0);
                    return (
                      <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mb-3">
                        <div className="flex justify-between items-center mb-2"><h3 className="font-black text-lg text-gray-800">{allowance.target}</h3><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{formatTime(totalSec)} Total</span></div>
                        <div className="flex gap-2 text-sm font-bold bg-gray-50 p-2 rounded-lg items-center">
                          <span className="text-gray-900">{formatTime(allowance.permanentSeconds)}</span><span className="text-gray-400">Perm</span>
                          {isActiveBooster && (<><span className="text-gray-300 mx-1">|</span><span className="text-green-500">+{formatTime(allowance.boosterSeconds)}</span><span className="text-green-600">Boost</span></>)}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {activeTab === 'entries' && (
                <>
                  {wheelSlices.map(slice => (
                    <div key={slice.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative mb-4">
                      {editingId === slice.id ? (
                        <div className="space-y-3 relative z-10">
                          <input type="text" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} className="w-full font-bold text-gray-900 border-b border-blue-400 outline-none pb-1 bg-transparent" placeholder="Slice Custom Name"/>
                          <div className="space-y-2 border-l-2 border-blue-200 pl-3">
                            {editForm.rewards?.map((reward, idx) => (
                               <div key={reward.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900 relative">
                                 <button onClick={() => setEditForm({...editForm, rewards: editForm.rewards?.filter(r => r.id !== reward.id)})} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                 
                                 <div className="grid grid-cols-2 gap-2 text-xs mb-2 pr-6">
                                   <div><label className="font-bold text-[10px] text-gray-500 uppercase">Type</label>
                                     <select value={reward.type} onChange={e => {
                                         let newRewards = [...editForm.rewards!]; newRewards[idx].type = e.target.value as SliceType; setEditForm({...editForm, rewards: newRewards});
                                     }} className="w-full border rounded p-1"><option value="permanent">Permanent</option><option value="booster">Booster</option><option value="token">Token Only</option></select>
                                   </div>
                                   
                                   {reward.type !== 'token' && (
                                     <div><label className="font-bold text-[10px] text-gray-500 uppercase flex justify-between">Target <label className="flex items-center gap-1 text-blue-600"><input type="checkbox" checked={!!reward.isWildcard} onChange={e => { let newR = [...editForm.rewards!]; newR[idx].isWildcard = e.target.checked; setEditForm({...editForm, rewards: newR}); }}/> Wildcard</label></label>
                                       <input type="text" value={reward.target} disabled={reward.isWildcard} placeholder={reward.isWildcard ? 'Dynamic' : 'e.g. Threads'} onChange={e => {
                                           let newRewards = [...editForm.rewards!]; newRewards[idx].target = e.target.value; setEditForm({...editForm, rewards: newRewards});
                                       }} className="w-full border rounded p-1 disabled:opacity-50"/>
                                     </div>
                                   )}
                                 </div>

                                 {reward.type !== 'token' ? (
                                   <div>
                                      <label className="font-bold text-[10px] text-gray-500 uppercase">Duration (H/M/S)</label>
                                      <div className="flex gap-2">
                                        <input type="number" placeholder="H" value={Math.floor(reward.durationSeconds / 3600)} onChange={e => {
                                           let newR = [...editForm.rewards!]; let h = Number(e.target.value); let m = Math.floor((newR[idx].durationSeconds % 3600)/60); let s = newR[idx].durationSeconds % 60;
                                           newR[idx].durationSeconds = (h*3600)+(m*60)+s; setEditForm({...editForm, rewards: newR});
                                        }} className="w-1/3 border rounded p-1"/>
                                        <input type="number" placeholder="M" value={Math.floor((reward.durationSeconds % 3600) / 60)} onChange={e => {
                                           let newR = [...editForm.rewards!]; let h = Math.floor(newR[idx].durationSeconds / 3600); let m = Number(e.target.value); let s = newR[idx].durationSeconds % 60;
                                           newR[idx].durationSeconds = (h*3600)+(m*60)+s; setEditForm({...editForm, rewards: newR});
                                        }} className="w-1/3 border rounded p-1"/>
                                        <input type="number" placeholder="S" value={reward.durationSeconds % 60} onChange={e => {
                                           let newR = [...editForm.rewards!]; let h = Math.floor(newR[idx].durationSeconds / 3600); let m = Math.floor((newR[idx].durationSeconds % 3600)/60); let s = Number(e.target.value);
                                           newR[idx].durationSeconds = (h*3600)+(m*60)+s; setEditForm({...editForm, rewards: newR});
                                        }} className="w-1/3 border rounded p-1"/>
                                      </div>
                                   </div>
                                 ) : (
                                   <div><label className="font-bold text-[10px] text-gray-500 uppercase">Spin Tokens Rewarded</label><input type="number" value={reward.spinTokens || 0} onChange={e => { let newR = [...editForm.rewards!]; newR[idx].spinTokens = Number(e.target.value); setEditForm({...editForm, rewards: newR}); }} className="w-full border rounded p-1"/></div>
                                 )}
                               </div>
                            ))}
                            <button onClick={() => setEditForm({...editForm, rewards: [...(editForm.rewards||[]), {id: Date.now().toString(), type: 'permanent', target: '', durationSeconds: 0, spinTokens: 0}]})} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"><Plus size={14}/> Add Reward Action</button>
                          </div>
                          <div className="flex justify-end pt-2"><button onClick={saveEdit} className="bg-green-100 text-green-700 px-3 py-1 rounded font-bold text-sm flex items-center gap-1 hover:bg-green-200"><Check size={16}/> Save</button></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start relative z-10">
                            <div className="flex items-start gap-3">
                              <div className="w-4 h-4 rounded-full shadow-sm mt-1 shrink-0" style={{ backgroundColor: slice.color }}></div>
                              <div>
                                <span className="font-bold text-gray-800">{slice.text || "Unnamed Slice"}</span>
                                <div className="flex flex-col gap-1 mt-2">
                                  {slice.rewards.map(r => (
                                     <div key={r.id} className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex-wrap">
                                       <span className="font-bold text-gray-900">{r.type === 'token' ? 'Spin Tokens' : r.isWildcard ? 'Wildcard' : r.target}</span>
                                       <span className="text-gray-400">|</span>
                                       {r.type === 'token' ? <span className="font-mono bg-purple-100 text-purple-800 px-1 rounded">+{r.spinTokens} Tk</span> : <span className="font-mono bg-blue-100 text-blue-800 px-1 rounded">{formatTime(r.durationSeconds)}</span>}
                                       <span className="text-[9px] uppercase font-bold text-gray-400 ml-auto">{r.type}</span>
                                     </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(slice)} className="text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={16} /></button>
                              <button onClick={() => handleDeleteSlice(slice.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </div>
                          {slice.enchantments && slice.enchantments.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-1 flex-wrap relative z-10">
                              {slice.enchantments.map((e, i) => <span key={i} className="text-[10px] font-bold bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded shadow-sm flex items-center gap-1"><Sparkles size={12}/> {e}</span>)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <button onClick={handleAddSlice} className="w-full bg-blue-50 text-blue-600 border-2 border-dashed border-blue-200 rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors mb-6"><Plus size={20} /> Add New Slice</button>
                </>
              )}

              {activeTab === 'history' && (
                <>
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">History</h3>{history.length > 0 && (<button onClick={() => setHistory([])} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><RotateCcw size={14} /> Clear</button>)}</div>
                  {history.length === 0 ? <p className="text-gray-400 text-sm italic">No spins yet.</p> : history.map((h) => (<div key={h.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-200 last:border-0"><span className="font-bold text-gray-700">{h.result}</span><span className="text-gray-400">{h.timestamp}</span></div>))}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}