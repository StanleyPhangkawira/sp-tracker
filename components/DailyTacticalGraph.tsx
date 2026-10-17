"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Crown,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Goal } from "../context/AppContext";
import { DayGraphStats, jsDays } from "./QuestShared";

interface DailyTacticalGraphProps {
  goals: Goal[];
  daysData: DayGraphStats[];
  fullClearDays: number;
  avgPct: number;
  rank: string;
  includeWeeklyInGraph: boolean;
  setIncludeWeeklyInGraph: React.Dispatch<React.SetStateAction<boolean>>;
  onGoalCheck: (e: React.MouseEvent, goal: Goal) => void;
  onChildCheck: (e: React.MouseEvent, goal: Goal, childId: string) => void;
  onClaimGoal: (e: React.MouseEvent, goal: Goal) => void;
  onClaimChild: (e: React.MouseEvent, goal: Goal, childId: string) => void;
}

export default function DailyTacticalGraph({
  goals,
  daysData,
  fullClearDays,
  avgPct,
  rank,
  includeWeeklyInGraph,
  setIncludeWeeklyInGraph,
  onGoalCheck,
  onChildCheck,
  onClaimGoal,
  onClaimChild,
}: DailyTacticalGraphProps) {
  const [showDailyGraph, setShowDailyGraph] = useState(true);
  const [selectedGraphDay, setSelectedGraphDay] = useState<string>(() => {
    const d = jsDays[new Date().getDay()];
    return d || "Monday";
  });

  const selectedDayData = daysData.find((d) => d.day === selectedGraphDay) || daysData[0];

  const svgPolylinePoints = daysData
    .map((d, idx) => {
      const x = (idx / 6) * 560 + 20;
      const y = 110 - (d.pct / 100) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs mb-6 overflow-hidden">
      <div className="p-4 md:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
            <BarChart3 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-wide">
                Mon–Sun Tactical Completion Radar
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-rpg-num">
                Rank {rank} · {avgPct}%
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1 font-rpg-num">
                <Crown size={11} className="text-amber-500" /> {fullClearDays}/7 Full Clears
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Tracks whether you finished all daily tasks (and day-assigned weekly tasks) from Monday to Sunday.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIncludeWeeklyInGraph((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              includeWeeklyInGraph
                ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700"
            }`}
          >
            <Calendar size={13} />
            <span>{includeWeeklyInGraph ? "Daily + Assigned Weekly" : "Daily Quests Only"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDailyGraph((o) => !o)}
            className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 cursor-pointer"
            title={showDailyGraph ? "Collapse Graph" : "Expand Graph"}
          >
            <motion.div animate={{ rotate: showDailyGraph ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronDown size={15} />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showDailyGraph && (
          <motion.div
            key="daily-graph-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 7 Cols: Interactive Mon-Sun Bar + SVG Curve Graph */}
              <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80 relative">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-3">
                  <span className="uppercase tracking-wider">Mon – Sun Completion Graph</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" /> Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> 100% Full Clear
                    </span>
                  </div>
                </div>

                <div className="relative pt-4 pb-1">
                  <svg
                    viewBox="0 0 600 120"
                    className="w-full h-24 absolute top-4 left-0 right-0 pointer-events-none opacity-40 dark:opacity-50"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgPolylinePoints}
                    />
                  </svg>

                  <div className="grid grid-cols-7 gap-2 sm:gap-3 relative z-10 items-end h-40">
                    {daysData.map((d) => {
                      const isSelected = selectedGraphDay === d.day;
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => setSelectedGraphDay(d.day)}
                          className={`group flex flex-col items-center h-full justify-end p-1.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-500 shadow-sm"
                              : d.isToday
                              ? "bg-white/80 dark:bg-slate-900/80 border-indigo-200 dark:border-indigo-800/70"
                              : "border-transparent hover:bg-white/60 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <div className="mb-1 flex flex-col items-center">
                            {d.isFullClear ? (
                              <motion.div
                                initial={{ scale: 0.6 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center shadow-2xs"
                                title="100% Full Clear!"
                              >
                                <Crown size={12} className="fill-amber-400 text-amber-500" />
                              </motion.div>
                            ) : (
                              <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 font-rpg-num">
                                {d.total > 0 ? `${d.pct}%` : "—"}
                              </span>
                            )}
                          </div>

                          <div className="w-full max-w-[34px] h-24 bg-gray-200/80 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 border border-black/5 dark:border-white/5 relative">
                            <motion.div
                              initial={false}
                              animate={{ height: `${d.total > 0 ? Math.max(8, d.pct) : 0}%` }}
                              transition={{ type: "spring", stiffness: 260, damping: 24 }}
                              className={`w-full rounded-lg relative overflow-hidden ${
                                d.isFullClear
                                  ? "bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                                  : d.pct >= 50
                                  ? "bg-gradient-to-t from-indigo-600 to-violet-400"
                                  : "bg-gradient-to-t from-sky-500 to-indigo-400"
                              }`}
                            >
                              {d.isFullClear && (
                                <div className="absolute inset-0 w-full bg-gradient-to-t from-transparent via-white/40 to-transparent animate-rpg-shimmer" />
                              )}
                            </motion.div>
                          </div>

                          <div className="mt-1.5 flex flex-col items-center">
                            <span
                              className={`text-[11px] font-black tracking-wide ${
                                d.isToday
                                  ? "text-indigo-600 dark:text-indigo-400 underline decoration-2 underline-offset-2"
                                  : "text-gray-700 dark:text-slate-200"
                              }`}
                            >
                              {d.short}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 font-rpg-num">
                              {d.done}/{d.total}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Interactive Day Inspector Drawer */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        {selectedDayData.day} Breakdown
                      </span>
                      {selectedDayData.isToday && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          Today
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full font-rpg-num ${
                        selectedDayData.isFullClear
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                          : "bg-gray-200/70 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                      }`}
                    >
                      {selectedDayData.isFullClear
                        ? "★ ALL FINISHED"
                        : `${selectedDayData.done}/${selectedDayData.total} Finished`}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {selectedDayData.items.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-slate-500 italic py-8 text-center">
                        No tasks assigned to {selectedDayData.day}.
                      </p>
                    ) : (
                      selectedDayData.items.map((item) => {
                        const parentGoal = goals.find((g) => g.id === item.goalId);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                disabled={item.isClaimed}
                                onClick={(e) => {
                                  if (!parentGoal) return;
                                  if (item.isMainGoal) onGoalCheck(e, parentGoal);
                                  else onChildCheck(e, parentGoal, item.id);
                                }}
                                className="shrink-0 cursor-pointer disabled:cursor-not-allowed"
                              >
                                {item.isCompleted ? (
                                  <CheckCircle2
                                    size={16}
                                    className={
                                      item.isClaimed
                                        ? "text-emerald-500"
                                        : "text-indigo-600 dark:text-indigo-400"
                                    }
                                  />
                                ) : (
                                  <Circle size={16} className="text-gray-300 dark:text-slate-600" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <div
                                  className={`font-bold truncate ${
                                    item.isCompleted
                                      ? "text-gray-400 dark:text-slate-500 line-through"
                                      : "text-gray-800 dark:text-slate-100"
                                  }`}
                                >
                                  {item.isDaily
                                    ? `${item.goalTitle} ${item.icon}`
                                    : `${item.childTitle}`}
                                </div>
                                {!item.isDaily && (
                                  <div className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold uppercase truncate">
                                    Weekly · {item.goalTitle}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.startTime && (
                                <span className="text-[9px] font-bold text-gray-400 font-rpg-num">
                                  {item.startTime}
                                </span>
                              )}
                              {item.isCompleted && !item.isClaimed && parentGoal ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (item.isMainGoal) onClaimGoal(e, parentGoal);
                                    else onClaimChild(e, parentGoal, item.id);
                                  }}
                                  className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] animate-pulse cursor-pointer font-rpg-num"
                                >
                                  CLAIM +{item.reward}
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-rpg-num">
                                  {item.reward} SP
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-slate-400">
                  <span>
                    Daily: <b className="text-gray-800 dark:text-white font-rpg-num">{selectedDayData.dailyCount}</b>
                    {includeWeeklyInGraph && (
                      <>
                        {" "}
                        · Weekly:{" "}
                        <b className="text-gray-800 dark:text-white font-rpg-num">{selectedDayData.weeklyCount}</b>
                      </>
                    )}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-rpg-num">
                    {selectedDayData.earnedSp} / {selectedDayData.totalSp} SP Earned
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}