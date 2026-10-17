"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpinningWheel from "../../components/SpinningWheel";
import { useAppContext } from "../../context/AppContext";
import { ShoppingCart, Dices, Coins, Sparkles, Wand2 } from "lucide-react";

const X = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const Shield = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);
const BookOpen = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const Flame = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);

interface FlyingParticle {
  id: string;
  type: "coin" | "token" | "shield";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const ENCHANTMENT_CODEX = [
  {
    name: "Altering I / II",
    rarity: "Common (I) / Rare (II)",
    effect: "Steals 2m from one random Permanent reward and adds +3m (I) or +4m (II) to another Permanent reward.",
  },
  {
    name: "Quietness I / II",
    rarity: "Common (I) / Rare (II)",
    effect: "Consumes itself on win to boost a random reward's duration by +10% (I) or +30% (II). Upgrades Quietness I → II if stacked.",
  },
  {
    name: "Purity I / II / III / IV",
    rarity: "Common (I–II) / Rare (III–IV)",
    effect: "Adds +1m (I), +2m (II), or +3m (III) to a random Permanent reward. Purity IV adds +30m to a random Booster reward!",
  },
  {
    name: "Tail I / II / III",
    rarity: "Common (I) / Rare (II–III)",
    effect: "Grants +1 free Spin Token on win, at the cost of reducing a random reward's duration to 70% (I), 80% (II), or 90% (III).",
  },
  {
    name: "Breaking",
    rarity: "Rare",
    effect: "Generates a massive 350% Booster copy of all Permanent rewards on the winning slice straight into your Inventory!",
  },
  {
    name: "Respect",
    rarity: "Rare",
    effect: "Merges two random slices on your wheel into a single super Combo Slice combining all their rewards!",
  },
];

function findVisibleElementRect(selector: string): DOMRect | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

export default function RewardsPage() {
  const { spCoins, setSpCoins, setSpinTokens, wheelSlices, setWheelSlices, streak, setStreak, playSound } =
    useAppContext();
  const [logs, setLogs] = useState<string[]>([]);
  const [particles, setParticles] = useState<FlyingParticle[]>([]);
  const [isGlowing, setIsGlowing] = useState(false);
  const [showCodex, setShowCodex] = useState(false);

  const shopItems = [
    { tokens: 1, cost: 100, label: "Single Spin" },
    { tokens: 2, cost: 190, label: "5% Off" },
    { tokens: 3, cost: 280, label: "7% Off" },
    { tokens: 5, cost: 450, label: "10% Off" },
    { tokens: 10, cost: 850, label: "Best Value" },
  ];

  const ENCH_TIERS: Record<string, { f: string; t: number }> = {
    "Altering I": { f: "Altering", t: 1 },
    "Altering II": { f: "Altering", t: 2 },
    "Quietness I": { f: "Quietness", t: 1 },
    "Quietness II": { f: "Quietness", t: 2 },
    "Purity I": { f: "Purity", t: 1 },
    "Purity II": { f: "Purity", t: 2 },
    "Purity III": { f: "Purity", t: 3 },
    "Purity IV": { f: "Purity", t: 4 },
    "Tail I": { f: "Tail", t: 1 },
    "Tail II": { f: "Tail", t: 2 },
    "Tail III": { f: "Tail", t: 3 },
    Breaking: { f: "Breaking", t: 1 },
    Respect: { f: "Respect", t: 1 },
  };

  const handleBuyTokens = (e: React.MouseEvent, cost: number, tokens: number) => {
    if (spCoins >= cost) {
      playSound("claim");
      const btn = e.currentTarget.getBoundingClientRect();
      const spEl = findVisibleElementRect("[data-sp-badge]");
      const tokenEl = findVisibleElementRect("[data-token-badge]");

      const newParticles: FlyingParticle[] = [];
      if (spEl) {
        newParticles.push({
          id: `c-${Date.now()}-${Math.random()}`,
          type: "coin",
          startX: spEl.left + spEl.width / 2 - 16,
          startY: spEl.top + spEl.height / 2 - 16,
          endX: btn.left + btn.width / 2 - 16,
          endY: btn.top + btn.height / 2 - 16,
        });
      }
      if (tokenEl) {
        newParticles.push({
          id: `t-${Date.now()}-${Math.random()}`,
          type: "token",
          startX: btn.left + btn.width / 2 - 16,
          startY: btn.top + btn.height / 2 - 16,
          endX: tokenEl.left + tokenEl.width / 2 - 16,
          endY: tokenEl.top + tokenEl.height / 2 - 16,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setSpCoins((prev) => prev - cost);
        setSpinTokens((prev) => prev + tokens);
        setParticles((prev) => prev.filter((p) => !newParticles.find((n) => n.id === p.id)));
      }, 650);
    }
  };

  const handleBuyShield = () => {
    const cost = 150;
    if (spCoins < cost) return;
    playSound("claim");
    setSpCoins((prev) => prev - cost);
    setStreak((prev) => ({ ...prev, shields: prev.shields + 1 }));
    setLogs(["Purchased +1 Streak Shield! It will automatically protect your streak if you miss a day."]);
    setTimeout(() => setLogs([]), 4500);
  };

  const handleBuyEnchantment = (type: "common" | "rare") => {
    const cost = type === "common" ? 40 : 80;
    if (spCoins < cost || wheelSlices.length === 0) return;

    playSound("quest");
    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 2000);

    const newSlices = [...wheelSlices];
    const numTargets = type === "common" ? 3 : 2;
    const pool =
      type === "common"
        ? ["Altering I", "Quietness I", "Purity I", "Purity II", "Tail I"]
        : ["Altering II", "Breaking", "Quietness II", "Purity III", "Purity IV", "Respect", "Tail II", "Tail III"];

    let refund = 0;
    const localLogs: string[] = [];

    for (let i = 0; i < numTargets; i++) {
      if (newSlices.length === 0) break;
      const targetIdx = Math.floor(Math.random() * newSlices.length);
      const slice = { ...newSlices[targetIdx] };
      slice.enchantments = slice.enchantments ? [...slice.enchantments] : [];

      const ench = pool[Math.floor(Math.random() * pool.length)];
      const familyMatch = ENCH_TIERS[ench].f;
      const existingIdx = slice.enchantments.findIndex((e) => ENCH_TIERS[e]?.f === familyMatch);

      if (existingIdx !== -1) {
        const existingEnch = slice.enchantments[existingIdx];
        if (existingEnch === ench || ENCH_TIERS[existingEnch].t >= ENCH_TIERS[ench].t) {
          const rf = Math.floor(Math.random() * 6) + 5;
          refund += rf;
          localLogs.push(`Redundant ${ench} on "${slice.text || "Slice"}". Refunded ${rf} SP.`);
        } else {
          slice.enchantments[existingIdx] = ench;
          localLogs.push(`Upgraded to ${ench} on "${slice.text || "Slice"}"!`);
        }
      } else {
        slice.enchantments.push(ench);
        localLogs.push(`Applied ${ench} to "${slice.text || "Slice"}"!`);
      }
      newSlices[targetIdx] = slice;
    }

    setSpCoins((prev) => prev - cost + refund);
    setWheelSlices(newSlices);
    setLogs(localLogs);
    setTimeout(() => setLogs([]), 6000);
  };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pb-24 md:pt-10 space-y-6 relative">
      {/* Flying Particles (Anchored to viewport top-0 left-0 so coordinates are exact) */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 0.6 }}
            animate={{ x: p.endX, y: p.endY, opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="fixed top-0 left-0 z-[150] pointer-events-none"
          >
            {p.type === "coin" ? (
              <Coins className="text-amber-500 bg-amber-100 dark:bg-amber-950 rounded-full p-1.5 shadow-xl border border-amber-300" size={32} />
            ) : (
              <Dices className="text-purple-500 bg-purple-100 dark:bg-purple-950 rounded-full p-1.5 shadow-xl border border-purple-300" size={32} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Enchantment Report Toast */}
      <AnimatePresence>
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-6 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 border border-fuchsia-500/30 max-w-sm"
          >
            <h4 className="font-bold mb-1.5 flex items-center gap-2 text-fuchsia-400 text-sm">
              <Sparkles size={16} /> Arcane Report
            </h4>
            <ul className="text-xs space-y-1 text-slate-200">
              {logs.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enchantment Codex Modal */}
      <AnimatePresence>
        {showCodex && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4"
            onClick={() => setShowCodex(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-fuchsia-600 dark:text-fuchsia-400" size={22} />
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Enchantment Codex</h2>
                </div>
                <button
                  onClick={() => setShowCodex(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Enchantment boxes imbue random slices on your wheel with special triggers that activate whenever that slice wins. Duplicate or lower-tier rolls automatically refund 5–10 SP!
              </p>
              <div className="space-y-2.5">
                {ENCHANTMENT_CODEX.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-black text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-fuchsia-500" /> {item.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300">
                        {item.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{item.effect}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Rewards & Arcane Wheel
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Spend hard-earned SP on Spin Tokens, Streak Shields, and Slice Enchantments.
          </p>
        </div>
        <button
          onClick={() => setShowCodex(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 text-xs font-extrabold flex items-center gap-1.5 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors cursor-pointer"
        >
          <BookOpen size={15} /> Enchantment Codex
        </button>
      </div>

      {/* SHOP DECK */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800 p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spin Token Bundles */}
        <div className="lg:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-indigo-500" size={19} />
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Spin Token Bundles</h2>
            </div>
            <span className="text-xs font-bold text-gray-400">Bulk Discounts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {shopItems.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => handleBuyTokens(e, item.cost, item.tokens)}
                disabled={spCoins < item.cost}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all disabled:opacity-40 cursor-pointer group relative"
              >
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-500 mb-1">
                  {item.label}
                </span>
                <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-black text-base mb-2 font-rpg-num">
                  <Dices size={18} /> x{item.tokens}
                </div>
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs font-extrabold w-full justify-center font-rpg-num">
                  <Coins size={12} /> {item.cost}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enchanting & Streak Shield */}
        <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="text-fuchsia-500" size={19} />
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Arcane Enchanting & Perks</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 font-rpg-num">{wheelSlices.length} Slices Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleBuyEnchantment("common")}
              disabled={spCoins < 40 || wheelSlices.length === 0}
              className={`bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/40 border-2 p-3.5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer text-left flex flex-col justify-between ${
                isGlowing
                  ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  : "border-indigo-200 dark:border-indigo-800"
              }`}
            >
              <div>
                <h3 className="font-black text-indigo-900 dark:text-indigo-200 text-sm">Common Box</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 leading-tight">
                  Enchants 3 random slices (Tier I–II)
                </p>
              </div>
              <span className="mt-3 flex items-center justify-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-extrabold py-1.5 w-full font-rpg-num">
                <Coins size={12} /> 40 SP
              </span>
            </button>

            <button
              onClick={() => handleBuyEnchantment("rare")}
              disabled={spCoins < 80 || wheelSlices.length === 0}
              className={`bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/50 dark:to-pink-950/40 border-2 p-3.5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer text-left flex flex-col justify-between ${
                isGlowing
                  ? "border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.7)]"
                  : "border-fuchsia-200 dark:border-fuchsia-800"
              }`}
            >
              <div>
                <h3 className="font-black text-fuchsia-900 dark:text-fuchsia-200 text-sm">Rare Box</h3>
                <p className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 leading-tight">
                  Enchants 2 slices (Breaking, Respect, III–IV)
                </p>
              </div>
              <span className="mt-3 flex items-center justify-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-extrabold py-1.5 w-full font-rpg-num">
                <Coins size={12} /> 80 SP
              </span>
            </button>

            <button
              onClick={handleBuyShield}
              disabled={spCoins < 150}
              className="bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/40 border-2 border-sky-200 dark:border-sky-800 p-3.5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sky-900 dark:text-sky-200 text-sm flex items-center gap-1">
                    <Shield size={14} className="text-sky-500" /> Streak Shield
                  </h3>
                  <span className="text-[10px] font-extrabold bg-sky-200/70 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-1.5 py-0.5 rounded-full font-rpg-num">
                    Owned: {streak.shields}
                  </span>
                </div>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 leading-tight">
                  Protects your <Flame size={10} className="inline text-orange-500" /> daily streak if you miss a day
                </p>
              </div>
              <span className="mt-3 flex items-center justify-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-extrabold py-1.5 w-full font-rpg-num">
                <Coins size={12} /> 150 SP
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* WHEEL & 4-TAB ARENA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <SpinningWheel isGlowing={isGlowing} />
      </div>
    </div>
  );
}