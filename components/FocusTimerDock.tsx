"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Timer, X, Pause, Play, RotateCcw } from "lucide-react";

export interface FloatingRewardPopup {
  id: string;
  x: number;
  y: number;
  sp: number;
  label?: string;
}

export interface FocusSessionState {
  title: string;
  durationSec: number;
  endTimeMs: number | null;
  remainingSec: number;
  isRunning: boolean;
}

interface FocusTimerDockProps {
  rewardPopups: FloatingRewardPopup[];
  focusSession: FocusSessionState | null;
  setFocusSession: React.Dispatch<React.SetStateAction<FocusSessionState | null>>;
  onToggleFocusPause: () => void;
  onStartFocus: (title: string, minutes: number) => void;
}

export default function FocusTimerDock({
  rewardPopups,
  focusSession,
  setFocusSession,
  onToggleFocusPause,
  onStartFocus,
}: FocusTimerDockProps) {
  return (
    <>
      {/* FLOATING +SP REWARD POPUPS (Anchored to top-0 left-0 so coordinates match exact button position) */}
      <AnimatePresence>
        {rewardPopups.map((pop) => (
          <motion.div
            key={pop.id}
            initial={{ opacity: 1, x: pop.x - 45, y: pop.y - 24, scale: 0.8 }}
            animate={{ opacity: 0, x: pop.x - 45, y: pop.y - 105, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeOut" }}
            className="fixed top-0 left-0 z-[170] pointer-events-none bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 border border-white font-rpg-num"
          >
            <Coins size={13} />
            <span>+{pop.sp} SP</span>
            {pop.label && <span className="text-[9px] uppercase tracking-wider opacity-85">· {pop.label}</span>}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* FLOATING FOCUS / POMODORO TIMER DOCK */}
      <AnimatePresence>
        {focusSession && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-[95] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 w-72"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Timer size={16} className="text-indigo-400 shrink-0 animate-pulse" />
                <span className="text-xs font-bold truncate">{focusSession.title}</span>
              </div>
              <button
                onClick={() => setFocusSession(null)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex items-center justify-between my-2">
              <span className="text-3xl font-black font-rpg-num tracking-tight text-indigo-300">
                {String(Math.floor(focusSession.remainingSec / 60)).padStart(2, "0")}:
                {String(focusSession.remainingSec % 60).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleFocusPause}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {focusSession.isRunning ? (
                    <>
                      <Pause size={13} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={13} /> {focusSession.remainingSec === 0 ? "Restart" : "Resume"}
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    setFocusSession({
                      ...focusSession,
                      remainingSec: focusSession.durationSec,
                      endTimeMs: null,
                      isRunning: false,
                    })
                  }
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
              <div className="flex gap-1.5 font-rpg-num">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => onStartFocus(focusSession.title, m)}
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      focusSession.durationSec === m * 60
                        ? "bg-indigo-500/40 text-indigo-200"
                        : "hover:text-white"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <span className="text-amber-300 font-bold font-rpg-num">+25 SP on finish</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}