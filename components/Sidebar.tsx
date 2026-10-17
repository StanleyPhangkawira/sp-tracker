"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Target,
  Gift,
  Coins,
  Dices,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Settings,
  Eye,
  Volume2,
  VolumeX,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAppContext, getLevelInfo } from "../context/AppContext";

const Sparkles = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
);
const Sun = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const Moon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const X = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const Flame = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
const Shield = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);
const RefreshCw = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);

type PendingCycleType = "daily" | "weekly" | "all" | "factory";

const CYCLE_ACTION_INFO: Record<
  PendingCycleType,
  { title: string; subtitle: string; badgeClass: string; btnClass: string }
> = {
  daily: {
    title: "Reset Daily Quests Only",
    subtitle: "All Daily quests will be unchecked for a fresh day. Your SP Coins, Spin Tokens, Weekly/List progress, and Streak remain untouched.",
    badgeClass: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  weekly: {
    title: "Start New Week (Daily + Weekly)",
    subtitle: "All Daily and Weekly quests will be unchecked for a fresh week. Your SP Coins, Spin Tokens, List quests, and Streak remain untouched.",
    badgeClass: "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  all: {
    title: "Uncheck All Quests (Keep Resources)",
    subtitle: "All Daily, Weekly, and List quests will be unchecked while preserving all your SP Coins, Spin Tokens, Inventory, and Time Bank.",
    badgeClass: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  factory: {
    title: "Full Factory Reset (Zero Resources)",
    subtitle: "WARNING: This resets SP Coins and Spin Tokens to 0, clears Inventory and Time Allowances, and unchecks all quests.",
    badgeClass: "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const {
    spCoins,
    spinTokens,
    lifetimeXp,
    streak,
    darkMode,
    setDarkMode,
    cleanMode,
    setCleanMode,
    soundEnabled,
    setSoundEnabled,
    playSound,
    startNewCycle,
    resetApp,
    logout,
  } = useAppContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingCycle, setPendingCycle] = useState<PendingCycleType | null>(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const mobileQuickMenuRef = useRef<HTMLDivElement>(null);
  const [spPulse, setSpPulse] = useState(false);
  const [tokenPulse, setTokenPulse] = useState(false);

  // In Clean Mode, sidebar automatically collapses to show icons only
  const effectiveCollapsed = cleanMode || isCollapsed;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setQuickMenuOpen(false);
      }
      if (mobileQuickMenuRef.current && !mobileQuickMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    setSpPulse(true);
    const t = setTimeout(() => setSpPulse(false), 550);
    return () => clearTimeout(t);
  }, [spCoins]);

  useEffect(() => {
    setTokenPulse(true);
    const t = setTimeout(() => setTokenPulse(false), 550);
    return () => clearTimeout(t);
  }, [spinTokens]);

  const levelInfo = getLevelInfo(lifetimeXp);
  const bonusPct = streak.enableMultiplier ? Math.min(25, streak.current * 5) : 0;

  const handleConfirmCycle = () => {
    if (!pendingCycle) return;
    playSound("quest");
    if (pendingCycle === "factory") {
      resetApp();
    } else {
      startNewCycle(pendingCycle);
    }
    setPendingCycle(null);
    setShowResetModal(false);
  };

  const closeResetModal = () => {
    setPendingCycle(null);
    setShowResetModal(false);
  };

  return (
    <>
      {/* SMART CYCLE / RESET MODAL WITH CONFIRMATION STEP */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4"
            onClick={closeResetModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-wide">
                    {pendingCycle ? "Confirm Cycle Reset" : "Cycle & Reset Manager"}
                  </h3>
                </div>
                <button
                  onClick={closeResetModal}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {pendingCycle ? (
                  <motion.div
                    key="confirm-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4 pt-1"
                  >
                    <div className={`p-4 rounded-2xl border ${CYCLE_ACTION_INFO[pendingCycle].badgeClass}`}>
                      <div className="flex items-center gap-2 font-black text-sm mb-1.5">
                        <AlertTriangle size={17} className="shrink-0" />
                        <span>{CYCLE_ACTION_INFO[pendingCycle].title}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        {CYCLE_ACTION_INFO[pendingCycle].subtitle}
                      </p>
                    </div>

                    <p className="text-xs font-bold text-gray-600 dark:text-slate-300 text-center">
                      Are you sure you want to proceed with this cycle reset?
                    </p>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        onClick={() => setPendingCycle(null)}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleConfirmCycle}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${CYCLE_ACTION_INFO[pendingCycle].btnClass}`}
                      >
                        <Check size={15} /> Confirm Reset
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="select-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-2.5"
                  >
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Start a fresh day or week while keeping your SP Coins, Spin Tokens, Inventory, XP, and Streak intact—or perform a full resource reset.
                    </p>

                    <button
                      onClick={() => setPendingCycle("daily")}
                      className="w-full text-left p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                        ☀️ Reset Daily Quests Only
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Unchecks all Daily goals for a fresh day. Keeps SP, Tokens, Weekly/List progress & Streak.
                      </div>
                    </button>

                    <button
                      onClick={() => setPendingCycle("weekly")}
                      className="w-full text-left p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-sm text-indigo-800 dark:text-indigo-300">
                        📅 Start New Week (Daily + Weekly)
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                        Unchecks all Daily and Weekly goals for the new week. Keeps SP, Tokens, List goals & Streak.
                      </div>
                    </button>

                    <button
                      onClick={() => setPendingCycle("all")}
                      className="w-full text-left p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-sm text-amber-800 dark:text-amber-300">
                        🔄 Uncheck All Quests (Keep Resources)
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Unchecks Daily, Weekly, and List goals while keeping all your SP, Tokens, Inventory, and Time.
                      </div>
                    </button>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                      <button
                        onClick={() => setPendingCycle("factory")}
                        className="w-full text-left p-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                      >
                        <div className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <RotateCcw size={14} /> Full Factory Reset (Zero Resources)
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">
                          Resets SP, Tokens, Inventory, Time Allowances, and unchecks all goals.
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className={`fixed bottom-0 left-0 right-0 md:hidden z-50 flex items-center justify-between px-3 py-2.5 transition-all ${
          cleanMode
            ? "bg-black/40 backdrop-blur-md border-t border-white/10 text-white"
            : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`relative group flex flex-col items-center gap-0.5 ${
              cleanMode
                ? "text-white"
                : pathname === "/"
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <Target size={19} />
            {!cleanMode && <span className="text-[10px]">Quests</span>}
          </Link>
          <Link
            href="/rewards"
            className={`relative group flex flex-col items-center gap-0.5 ${
              cleanMode
                ? "text-white"
                : pathname === "/rewards"
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <Gift size={19} />
            {!cleanMode && <span className="text-[10px]">Rewards</span>}
          </Link>
          <Link
            href="/finance"
            className={`relative group flex flex-col items-center gap-0.5 ${
              cleanMode
                ? "text-white"
                : pathname === "/finance"
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <Wallet size={19} />
            {!cleanMode && <span className="text-[10px]">Finance</span>}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            id="sp-resource-mobile"
            data-sp-badge
            animate={spPulse ? { scale: [1, 1.16, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={
              cleanMode
                ? "flex items-center gap-1 text-white text-xs font-extrabold font-rpg-num"
                : "flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg text-xs font-extrabold border border-amber-200 dark:border-amber-800 font-rpg-num"
            }
          >
            <Coins size={14} className={cleanMode ? "text-white" : "text-amber-600 dark:text-amber-400"} />
            {!cleanMode && <span>{spCoins.toLocaleString()}</span>}
          </motion.div>
          <motion.div
            id="token-resource-mobile"
            data-token-badge
            animate={tokenPulse ? { scale: [1, 1.16, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={
              cleanMode
                ? "flex items-center gap-1 text-white text-xs font-extrabold font-rpg-num"
                : "flex items-center gap-1 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-lg text-xs font-extrabold border border-purple-200 dark:border-purple-800 font-rpg-num"
            }
          >
            <Dices size={14} className={cleanMode ? "text-white" : "text-purple-600 dark:text-purple-400"} />
            {!cleanMode && <span>{spinTokens}</span>}
          </motion.div>

          {/* Packed Mobile Quick Menu Button */}
          <div ref={mobileQuickMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={
                cleanMode
                  ? "p-1.5 text-white cursor-pointer"
                  : "p-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 cursor-pointer"
              }
              title="Quick Controls"
            >
              <SlidersHorizontal size={15} />
            </button>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-gray-800 dark:text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCleanMode(!cleanMode);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Eye size={14} className="text-indigo-500" /> Clear View
                    </span>
                    <span className="text-[10px] font-black font-rpg-num">{cleanMode ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {darkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-500" />}
                      {darkMode ? "Light Mode" : "Dark Mode"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 size={14} className="text-indigo-500" /> : <VolumeX size={14} className="text-gray-400" />}
                      SFX
                    </span>
                    <span className="text-[10px] font-black font-rpg-num">{soundEnabled ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingCycle(null);
                      setShowResetModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw size={14} /> Cycle
                    </span>
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-purple-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={14} className="text-purple-500" /> Advanced Settings
                    </span>
                    <ChevronRight size={13} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* DESKTOP SIDEBAR */}
      <nav
        className={`relative transition-all duration-300 ease-in-out z-50 flex-col items-center md:items-start min-h-screen p-3.5 ${
          cleanMode
            ? "w-20 bg-transparent border-r border-transparent"
            : `${effectiveCollapsed ? "w-20" : "w-64"} bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800`
        } hidden md:flex select-none`}
      >
        {/* Collapse Toggle (hidden in Clear View) */}
        {!cleanMode && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full p-1 shadow-sm hover:scale-110 z-50 cursor-pointer text-gray-600 dark:text-slate-300 transition-transform"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Brand Header */}
        <div
          className={`relative group flex items-center gap-2.5 mb-5 mt-2 transition-all ${
            effectiveCollapsed ? "justify-center w-full" : "px-1"
          }`}
        >
          {cleanMode ? (
            <>
              <div className="w-10 h-10 flex items-center justify-center text-white font-black text-base drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] shrink-0 font-rpg-crest cursor-default">
                SP
              </div>
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="font-black uppercase tracking-wider">SP Tracker</div>
                <div className="text-[10px] text-indigo-300 uppercase tracking-widest mt-0.5">RPG Quest HUD</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/25 shrink-0 font-rpg-crest">
                SP
              </div>
              {!effectiveCollapsed && (
                <div className="flex flex-col">
                  <span className="font-black text-base text-gray-900 dark:text-white tracking-wider uppercase leading-none">
                    SP Tracker
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 tracking-widest uppercase">
                    RPG Quest HUD
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* RPG PLAYER LEVEL & STREAK */}
        {cleanMode ? (
          <div className="w-full flex flex-col items-center gap-2 mb-5">
            {/* Level Icon in Clear View (White, no box, detail on hover) */}
            <div className="relative group flex items-center justify-center p-2.5 text-white hover:scale-110 transition-transform cursor-default">
              <Sparkles size={20} className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
              <div className="absolute left-full ml-3 w-56 p-3 bg-slate-900/95 text-white rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="flex items-center justify-between text-xs font-black mb-1">
                  <span className="text-amber-300 font-rpg-num">Lv. {levelInfo.level}</span>
                  <span className="text-indigo-200">{levelInfo.rankTitle}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 h-full"
                    style={{ width: `${levelInfo.progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-rpg-num">
                  <span>{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP</span>
                  <span>{levelInfo.progressPct}%</span>
                </div>
              </div>
            </div>

            {/* Streak Icon in Clear View (White, no box, detail on hover) */}
            <div className="relative group flex items-center justify-center p-2.5 text-white hover:scale-110 transition-transform cursor-default">
              <Flame size={20} className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="font-black text-orange-300 font-rpg-num">
                  {streak.current} Day Streak {bonusPct > 0 ? `(+${bonusPct}% SP)` : ""}
                </div>
                <div className="text-[10px] text-sky-300 font-rpg-num mt-0.5">
                  {streak.shields} Streak Shield{streak.shields === 1 ? "" : "s"} Owned
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`w-full rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white p-3 mb-5 shadow-md border border-indigo-500/30 ${
              effectiveCollapsed ? "flex flex-col items-center gap-1.5" : ""
            }`}
          >
            {effectiveCollapsed ? (
              <>
                <div
                  className="text-[10px] font-black bg-indigo-500/30 border border-indigo-400/40 px-2 py-0.5 rounded-full text-indigo-200 font-rpg-num"
                  title={`Level ${levelInfo.level} · ${levelInfo.rankTitle} (${levelInfo.currentLevelXp}/${levelInfo.nextLevelXp} XP)`}
                >
                  Lv.{levelInfo.level}
                </div>
                <div
                  className="flex items-center gap-0.5 text-orange-400 text-xs font-black font-rpg-num"
                  title={`${streak.current} Day Streak (+${bonusPct}% SP)`}
                >
                  <Flame size={13} className="fill-orange-400" />
                  <span>{streak.current}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/40 px-2 py-0.5 rounded-full text-indigo-200 flex items-center gap-1 font-rpg-num">
                    <Sparkles size={10} className="text-amber-300" /> Lv. {levelInfo.level}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-200 truncate max-w-[125px]">
                    {levelInfo.rankTitle}
                  </span>
                </div>
                <div className="w-full bg-slate-800/90 rounded-full h-2.5 overflow-hidden my-1.5 border border-white/10 relative">
                  <div
                    className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 h-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${levelInfo.progressPct}%` }}
                  >
                    <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-rpg-shimmer" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold font-rpg-num">
                  <span>
                    {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                  </span>
                  <span>{levelInfo.progressPct}%</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-extrabold text-orange-300" title="Daily Streak">
                    <Flame size={14} className="text-orange-400 fill-orange-400" />
                    <span className="font-rpg-num">{streak.current}d Streak</span>
                    {bonusPct > 0 && (
                      <span className="text-[9px] bg-orange-500/30 text-orange-200 px-1.5 py-0.5 rounded-full font-rpg-num">
                        +{bonusPct}% SP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-sky-300 font-rpg-num" title="Streak Shields Owned">
                    <Shield size={12} className="text-sky-400 fill-sky-400/30" />
                    <span>{streak.shields}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Links (White with no box in Clear View + Detail Tooltip on Hover) */}
        <div className="flex flex-col w-full gap-1.5">
          <Link
            href="/"
            className={`relative group flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              cleanMode
                ? "text-white hover:text-white/80 hover:scale-110 bg-transparent border-none shadow-none justify-center"
                : pathname === "/"
                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-indigo-200/60 dark:border-indigo-800/60"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/60"
            } ${effectiveCollapsed ? "justify-center" : ""}`}
          >
            <Target
              size={20}
              className={cleanMode ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] shrink-0" : "shrink-0"}
            />
            {!effectiveCollapsed && !cleanMode && <span className="text-sm whitespace-nowrap">Quests & Targets</span>}
            {(effectiveCollapsed || cleanMode) && (
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div>Quests & Targets</div>
                <div className="text-[10px] text-slate-400 font-medium">Main Quest Board & Schedule</div>
              </div>
            )}
          </Link>

          <Link
            href="/rewards"
            className={`relative group flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              cleanMode
                ? "text-white hover:text-white/80 hover:scale-110 bg-transparent border-none shadow-none justify-center"
                : pathname === "/rewards"
                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-indigo-200/60 dark:border-indigo-800/60"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/60"
            } ${effectiveCollapsed ? "justify-center" : ""}`}
          >
            <Gift
              size={20}
              className={cleanMode ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] shrink-0" : "shrink-0"}
            />
            {!effectiveCollapsed && !cleanMode && <span className="text-sm whitespace-nowrap">Rewards & Wheel</span>}
            {(effectiveCollapsed || cleanMode) && (
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div>Rewards & Wheel</div>
                <div className="text-[10px] text-slate-400 font-medium">Spin Wheel, Inventory & Time Bank</div>
              </div>
            )}
          </Link>

          <Link
            href="/finance"
            className={`relative group flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              cleanMode
                ? "text-white hover:text-white/80 hover:scale-110 bg-transparent border-none shadow-none justify-center"
                : pathname === "/finance"
                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-indigo-200/60 dark:border-indigo-800/60"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/60"
            } ${effectiveCollapsed ? "justify-center" : ""}`}
          >
            <Wallet
              size={20}
              className={cleanMode ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] shrink-0" : "shrink-0"}
            />
            {!effectiveCollapsed && !cleanMode && (
              <span className="text-sm whitespace-nowrap flex items-center gap-1.5">
                Finance{" "}
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-extrabold">
                  PRO
                </span>
              </span>
            )}
            {(effectiveCollapsed || cleanMode) && (
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div>Finance Command (PRO)</div>
                <div className="text-[10px] text-slate-400 font-medium">Accounts, Budgets & Ledger</div>
              </div>
            )}
          </Link>
        </div>

        {/* Bottom Resource & Packed Utility Controls */}
        <div className="mt-auto w-full flex flex-col gap-2 pt-4">
          {/* SP Resource (White icon with no box in Clear View + Hover Detail) */}
          <motion.div
            id="sp-resource"
            data-sp-badge
            animate={spPulse ? { scale: [1, 1.09, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={
              cleanMode
                ? "relative group flex items-center justify-center p-2.5 text-white bg-transparent border-none shadow-none cursor-default hover:scale-110 transition-transform"
                : `relative group flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-100/90 dark:from-amber-950/70 dark:to-yellow-900/40 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl font-black shadow-xs justify-center border border-amber-200 dark:border-amber-800/70 font-rpg-num ${
                    effectiveCollapsed ? "flex-col text-[10px] py-2 px-1" : "text-sm"
                  }`
            }
          >
            <Coins
              size={cleanMode ? 20 : 16}
              className={
                cleanMode
                  ? "shrink-0 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  : "shrink-0 text-amber-600 dark:text-amber-400"
              }
            />
            {!cleanMode && (
              <span className="truncate">
                {effectiveCollapsed ? spCoins.toLocaleString() : `${spCoins.toLocaleString()} SP`}
              </span>
            )}
            {(effectiveCollapsed || cleanMode) && (
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="text-amber-300 font-black font-rpg-num">{spCoins.toLocaleString()} SP Coins</div>
                <div className="text-[10px] text-slate-400">Available Quest Currency</div>
              </div>
            )}
          </motion.div>

          {/* Spin Tokens Resource (White icon with no box in Clear View + Hover Detail) */}
          <motion.div
            id="token-resource"
            data-token-badge
            animate={tokenPulse ? { scale: [1, 1.09, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={
              cleanMode
                ? "relative group flex items-center justify-center p-2.5 text-white bg-transparent border-none shadow-none cursor-default hover:scale-110 transition-transform"
                : `relative group flex items-center gap-2 bg-gradient-to-r from-purple-50 to-fuchsia-100/90 dark:from-purple-950/70 dark:to-fuchsia-900/40 text-purple-800 dark:text-purple-300 p-2.5 rounded-xl font-black shadow-xs justify-center border border-purple-200 dark:border-purple-800/70 font-rpg-num ${
                    effectiveCollapsed ? "flex-col text-[10px] py-2 px-1" : "text-sm"
                  }`
            }
          >
            <Dices
              size={cleanMode ? 20 : 16}
              className={
                cleanMode
                  ? "shrink-0 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  : "shrink-0 text-purple-600 dark:text-purple-400"
              }
            />
            {!cleanMode && (
              <span className="truncate">{effectiveCollapsed ? spinTokens : `${spinTokens} Tokens`}</span>
            )}
            {(effectiveCollapsed || cleanMode) && (
              <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900/95 text-white text-xs font-bold rounded-xl border border-white/20 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="text-purple-300 font-black font-rpg-num">{spinTokens} Spin Tokens</div>
                <div className="text-[10px] text-slate-400">Wheel of Fortune Spins</div>
              </div>
            )}
          </motion.div>

          {/* PACKED BOTTOM MENU BUTTON (Shows Clear View, Light/Dark, SFX, Cycle, Advanced Settings on Hover) */}
          <div
            ref={quickMenuRef}
            className="relative w-full pt-1"
            onMouseEnter={() => setQuickMenuOpen(true)}
            onMouseLeave={() => setQuickMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setQuickMenuOpen((prev) => !prev)}
              className={
                cleanMode
                  ? "w-full flex items-center justify-center p-2.5 text-white bg-transparent border-none shadow-none hover:scale-110 transition-transform cursor-pointer"
                  : "w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              }
            >
              <SlidersHorizontal
                size={cleanMode ? 20 : 16}
                className={
                  cleanMode
                    ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] shrink-0"
                    : "text-indigo-600 dark:text-indigo-400 shrink-0"
                }
              />
              {!effectiveCollapsed && !cleanMode && <span>Controls</span>}
            </button>

            <AnimatePresence>
              {quickMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className={`absolute bottom-0 ${
                    effectiveCollapsed || cleanMode ? "left-full pl-2" : "left-0 bottom-full pb-2"
                  } z-50`}
                >
                  <div className="w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 text-gray-800 dark:text-white">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                      <span>Quick Controls</span>
                      <SlidersHorizontal size={12} />
                    </div>

                    {/* 1. Clear View */}
                    <button
                      type="button"
                      onClick={() => {
                        setCleanMode(!cleanMode);
                        setQuickMenuOpen(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Eye size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Clear View</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black font-rpg-num ${
                          cleanMode
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                        }`}
                      >
                        {cleanMode ? "ON" : "OFF"}
                      </span>
                    </button>

                    {/* 2. Light / Dark Mode Switch */}
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {darkMode ? (
                          <Sun size={15} className="text-amber-400" />
                        ) : (
                          <Moon size={15} className="text-indigo-600" />
                        )}
                        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">{darkMode ? "Light" : "Dark"}</span>
                    </button>

                    {/* 3. SFX Toggle */}
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {soundEnabled ? (
                          <Volume2 size={15} className="text-indigo-500" />
                        ) : (
                          <VolumeX size={15} className="text-gray-400" />
                        )}
                        <span>SFX</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black font-rpg-num ${
                          soundEnabled
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                        }`}
                      >
                        {soundEnabled ? "ON" : "OFF"}
                      </span>
                    </button>

                    {/* 4. Cycle Reset */}
                    <button
                      type="button"
                      onClick={() => {
                        setPendingCycle(null);
                        setShowResetModal(true);
                        setQuickMenuOpen(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw size={15} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Cycle</span>
                      </div>
                      <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-black">
                        RESET
                      </span>
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-slate-800 my-0.5" />

                    {/* 5. Advanced Settings */}
                    <Link
                      href="/settings"
                      onClick={() => setQuickMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={15} className="text-purple-600 dark:text-purple-400" />
                        <span>Advanced Settings</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </>
  );
}