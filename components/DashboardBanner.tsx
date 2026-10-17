"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flame,
  Coins,
  Zap,
  Pin,
  StickyNote,
  Plus,
  Trash2,
  EyeOff,
  Eye
} from "lucide-react";
import { useAppContext, getLevelInfo, StickyNoteItem } from "../context/AppContext";
import { STICKY_COLORS } from "./QuestShared";

interface DashboardBannerProps {
  isAssignMode: boolean;
  overallBluePct: number;
  overallRedPct: number;
  totalMustDoApp: number;
  claimedSP: number;
  totalSP: number;
  readyToClaimSP: number;
  currentQuote: string;
  onGlobalClaimAll: (e: React.MouseEvent) => void;
}

export default function DashboardBanner({
  isAssignMode,
  overallBluePct,
  overallRedPct,
  totalMustDoApp,
  claimedSP,
  totalSP,
  readyToClaimSP,
  currentQuote,
  onGlobalClaimAll,
}: DashboardBannerProps) {
  const {
    goals,
    lifetimeXp,
    streak,
    bannerImage,
    cleanMode,
    setCleanMode,
    stickyNotes,
    setStickyNotes,
    playSound,
  } = useAppContext();

  // Sticky Note auto-peek on load for 2.6s, hover to peek, click to toggle/pin
  const [stickyAutoPeek, setStickyAutoPeek] = useState(true);
  const [stickyHovered, setStickyHovered] = useState(false);
  const [stickyPinned, setStickyPinned] = useState(false);
  const [activeStickyIdx, setActiveStickyIdx] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStickyAutoPeek(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  const isStickyVisible = stickyAutoPeek || stickyHovered || stickyPinned;
  const currentSticky = stickyNotes[activeStickyIdx] || stickyNotes[0] || {
    id: "sn-default",
    title: "Quick Scroll",
    content: "",
    color: "amber" as const,
    updatedAt: "",
  };
  const stickyTheme = STICKY_COLORS[currentSticky.color || "amber"] || STICKY_COLORS.amber;

  const updateCurrentSticky = (updates: Partial<StickyNoteItem>) => {
    setStickyNotes((prev) => {
      if (prev.length === 0) {
        return [{ ...currentSticky, ...updates, updatedAt: new Date().toISOString() }];
      }
      return prev.map((item, idx) =>
        idx === activeStickyIdx ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
    });
  };

  const addNewStickyTab = () => {
    const colors: StickyNoteItem["color"][] = ["amber", "mint", "rose", "sky", "violet"];
    const nextColor = colors[stickyNotes.length % colors.length];
    const newNote: StickyNoteItem = {
      id: `sn-${Date.now()}`,
      title: `Scroll #${stickyNotes.length + 1}`,
      content: "",
      color: nextColor,
      updatedAt: new Date().toISOString(),
    };
    setStickyNotes((prev) => [...prev, newNote]);
    setActiveStickyIdx(stickyNotes.length);
  };

  const deleteStickyTab = (idx: number) => {
    if (stickyNotes.length <= 1) {
      updateCurrentSticky({ content: "", title: "Quick Scroll" });
      return;
    }
    setStickyNotes((prev) => prev.filter((_, i) => i !== idx));
    setActiveStickyIdx((prev) => Math.max(0, prev - 1));
  };

  const levelInfo = getLevelInfo(lifetimeXp);
  const bonusPct = streak.enableMultiplier ? Math.min(25, streak.current * 5) : 0;

  const renderBannerActions = () => (
    <div className="flex items-center gap-2 self-start ml-auto shrink-0 relative z-30" data-nodrag>
      <button
        type="button"
        onClick={() => {
          playSound("click");
          setCleanMode(true);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border shadow-md transition-all cursor-pointer bg-white/90 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80 hover:scale-105"
        title="Enter Clear View"
      >
        <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
        <span>Clear View</span>
      </button>
      {renderBannerStickyNote()}
    </div>
  );

  const renderBannerStickyNote = () => (
    <div
      className="relative z-30 flex flex-col items-end self-start ml-auto shrink-0"
      onMouseEnter={() => setStickyHovered(true)}
      onMouseLeave={() => setStickyHovered(false)}
      data-nodrag
    >
      <button
        type="button"
        onClick={() => {
          playSound("click");
          setStickyAutoPeek(false);
          setStickyPinned((p) => !p);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border shadow-md transition-all cursor-pointer ${
          stickyPinned
            ? "bg-amber-400 text-amber-950 border-amber-300 ring-2 ring-amber-300/60 scale-105"
            : isStickyVisible
            ? "bg-amber-100/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
            : "bg-white/90 dark:bg-slate-900/90 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80 hover:scale-105"
        }`}
        title="Hover to peek Sticky Note · Click to toggle/pin"
      >
        <StickyNote size={14} className="text-amber-600 dark:text-amber-400" />
        <span>Sticky Note</span>
        <Pin
          size={12}
          className={`transition-transform ${
            stickyPinned ? "rotate-45 text-amber-950 fill-amber-950" : "opacity-60"
          }`}
        />
      </button>

      <AnimatePresence>
        {isStickyVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`absolute top-full right-0 mt-2 w-72 sm:w-80 rounded-2xl border-2 p-3.5 shadow-2xl backdrop-blur-md z-50 ${stickyTheme.bg} ${stickyTheme.border} ${stickyTheme.text}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                {stickyNotes.map((sn, idx) => (
                  <button
                    key={sn.id}
                    type="button"
                    onClick={() => setActiveStickyIdx(idx)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer truncate max-w-[90px] ${
                      idx === activeStickyIdx
                        ? `${stickyTheme.pill} shadow-2xs`
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addNewStickyTab}
                  className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  title="New Sticky Note Tab"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(Object.keys(STICKY_COLORS) as StickyNoteItem["color"][]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateCurrentSticky({ color: c })}
                    className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${
                      STICKY_COLORS[c].dot
                    } ${
                      currentSticky.color === c
                        ? "scale-125 border-gray-900 dark:border-white"
                        : "border-transparent opacity-75"
                    }`}
                    title={`Color: ${c}`}
                  />
                ))}
                {stickyNotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteStickyTab(activeStickyIdx)}
                    className="p-1 opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer ml-0.5"
                    title="Delete Note Tab"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={currentSticky.title}
              onChange={(e) => updateCurrentSticky({ title: e.target.value })}
              placeholder="Sticky Note Title..."
              className="w-full font-black text-xs md:text-sm bg-transparent outline-none mb-1.5 placeholder:opacity-50"
            />
            <textarea
              rows={4}
              value={currentSticky.content}
              onChange={(e) => updateCurrentSticky({ content: e.target.value })}
              placeholder="Jot down quick reminders, boss strategies, or daily intentions..."
              className="w-full text-xs leading-relaxed bg-white/40 dark:bg-black/20 rounded-xl p-2.5 outline-none resize-none border border-black/5 dark:border-white/10 custom-scrollbar font-medium"
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-75 font-bold">
              <span>
                {stickyAutoPeek
                  ? "Auto-peeking on load..."
                  : stickyPinned
                  ? "📌 Pinned Open"
                  : "Hovering · Click button to pin"}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateCurrentSticky({
                    content: currentSticky.content ? currentSticky.content + "\n• " : "• ",
                  })
                }
                className="underline hover:opacity-100 cursor-pointer"
              >
                + Bullet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Clear View Banner (Minimalist Banner Image + Exit Clear View + Sticky Note)
  if (cleanMode) {
    return (
      <div className="relative w-full h-56 md:h-72 rounded-3xl overflow-visible shadow-xl border border-gray-200 dark:border-slate-800 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex flex-col justify-between p-5">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt="Clear View Banner"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(217,70,239,0.25),transparent_50%)]" />
          )}
        </div>
        <div className="relative z-20 flex items-start justify-between gap-3 w-full">
          <button
            onClick={() => setCleanMode(false)}
            className="px-3.5 py-1.5 rounded-xl bg-black/55 hover:bg-black/75 text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 border border-white/15 cursor-pointer transition-all shadow-md"
          >
            <EyeOff size={14} className="text-teal-300" />
            <span>Exit Clear View</span>
          </button>
          {renderBannerActions()}
        </div>
      </div>
    );
  }

  // Custom Image Banner with RPG HUD Overlay
  if (bannerImage && !isAssignMode) {
    return (
      <div className="relative w-full min-h-[220px] md:min-h-[250px] rounded-3xl overflow-visible mb-6 shadow-lg border border-gray-200 dark:border-slate-800 flex flex-col justify-between p-5 md:p-7 bg-slate-900">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <img
            src={bannerImage}
            alt="Dashboard Banner"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/25 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-20 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 sm:gap-7">
            <div className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 shrink-0 flex items-center justify-center drop-shadow-md">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="9" fill="none" />
                {overallRedPct > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f87171"
                    strokeWidth="9"
                    fill="none"
                    strokeDasharray="251.327"
                    strokeDashoffset={251.327 - ((overallBluePct + overallRedPct) / 100) * 251.327}
                    className="transition-all duration-500"
                  />
                )}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#6366f1"
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray="251.327"
                  strokeDashoffset={251.327 - (overallBluePct / 100) * 251.327}
                  strokeLinecap="round"
                  className="transition-all duration-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl md:text-2xl font-black text-white drop-shadow-md font-rpg-num">
                  {overallBluePct}%
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-300 drop-shadow">
                  Complete
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-600/90 text-white flex items-center gap-1.5 shadow-md backdrop-blur-xs border border-indigo-400/30 font-rpg-num">
                  <Sparkles size={12} className="text-amber-300" /> Lv. {levelInfo.level} · {levelInfo.rankTitle}
                </span>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-orange-500/25 text-orange-200 flex items-center gap-1.5 border border-orange-400/40 backdrop-blur-xs shadow-xs font-rpg-num">
                  <Flame size={13} className="fill-orange-400 text-orange-400" /> {streak.current}d Streak
                  {bonusPct > 0 && ` (+${bonusPct}% SP)`}
                </span>
              </div>

              <div className="text-sm md:text-base font-bold text-white drop-shadow-md">
                {totalMustDoApp} Mandatory Action Items Across {goals.length} Quests
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs md:text-sm font-black text-amber-200 bg-amber-500/25 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-amber-400/40 backdrop-blur-xs shadow-xs font-rpg-num">
                  <Coins size={15} className="text-amber-300" />
                  {claimedSP.toLocaleString()} / {totalSP.toLocaleString()} SP Claimed
                </span>

                {readyToClaimSP > 0 && (
                  <button
                    onClick={onGlobalClaimAll}
                    className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce cursor-pointer border border-emerald-300/40 font-rpg-num"
                  >
                    <Zap size={14} /> Claim All Ready (+{readyToClaimSP} SP)
                  </button>
                )}
              </div>
            </div>
          </div>

          {renderBannerActions()}
        </div>

        {currentQuote && (
          <div className="relative z-10 mt-3 flex items-center gap-2 text-white/95 drop-shadow-md bg-black/40 backdrop-blur-xs px-3.5 py-1.5 rounded-xl w-fit border border-white/10">
            <Sparkles size={14} className="text-amber-300 shrink-0" />
            <p className="text-xs md:text-sm font-semibold italic">&ldquo;{currentQuote}&rdquo;</p>
          </div>
        )}
      </div>
    );
  }

  // Standard HUD Banner
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-slate-800 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative w-22 h-22 md:w-28 md:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xs" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="9"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              {overallRedPct > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f87171"
                  strokeWidth="9"
                  fill="none"
                  strokeDasharray="251.327"
                  strokeDashoffset={251.327 - ((overallBluePct + overallRedPct) / 100) * 251.327}
                  className="transition-all duration-500"
                />
              )}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#4f46e5"
                strokeWidth="9"
                fill="none"
                strokeDasharray="251.327"
                strokeDashoffset={251.327 - (overallBluePct / 100) * 251.327}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white font-rpg-num">
                {overallBluePct}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Complete</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-600 text-white flex items-center gap-1.5 shadow-2xs font-rpg-num">
                <Sparkles size={12} /> Lv. {levelInfo.level} · {levelInfo.rankTitle}
              </span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center gap-1.5 border border-orange-200 dark:border-orange-800 font-rpg-num">
                <Flame size={13} className="fill-orange-500 text-orange-500" /> {streak.current}d Streak
                {bonusPct > 0 && ` (+${bonusPct}% SP)`}
              </span>
            </div>

            <div className="text-sm md:text-base font-bold text-gray-700 dark:text-slate-200">
              {totalMustDoApp} Mandatory Action Items Across {goals.length} Quests
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs md:text-sm font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 font-rpg-num">
                <Coins size={15} className="text-amber-600 dark:text-amber-400" />
                {claimedSP.toLocaleString()} / {totalSP.toLocaleString()} SP Claimed
              </span>

              {readyToClaimSP > 0 && (
                <button
                  onClick={onGlobalClaimAll}
                  className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 animate-bounce cursor-pointer font-rpg-num"
                >
                  <Zap size={14} /> Claim All Ready (+{readyToClaimSP} SP)
                </button>
              )}
            </div>
          </div>
        </div>

        {renderBannerActions()}
      </div>

      {currentQuote && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-gray-600 dark:text-slate-300 text-xs md:text-sm font-medium italic">
          <Sparkles size={14} className="text-amber-500 shrink-0" />
          <p>&ldquo;{currentQuote}&rdquo;</p>
        </div>
      )}
    </div>
  );
}