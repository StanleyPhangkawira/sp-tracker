"use client";

import React from "react";
import {
  Calendar,
  Gift,
  Crown,
  CheckCircle2,
  Circle,
  Star,
  Clock,
  Timer,
} from "lucide-react";
import { Goal } from "../context/AppContext";
import { DayTaskItem } from "./QuestShared";

interface TodayActiveQuestsCardProps {
  isCleanView?: boolean;
  todayStr: string;
  todayTasks: DayTaskItem[];
  todayMandatoryDone: number;
  todayMandatoryCount: number;
  isTodayFullClear: boolean;
  isDailyBountyClaimed: boolean;
  showTime: boolean;
  goals: Goal[];
  onClaimDailyBounty: (e: React.MouseEvent) => void;
  onGoalCheck: (e: React.MouseEvent, goal: Goal) => void;
  onChildCheck: (e: React.MouseEvent, goal: Goal, childId: string) => void;
  onClaimGoal: (e: React.MouseEvent, goal: Goal) => void;
  onClaimChild: (e: React.MouseEvent, goal: Goal, childId: string) => void;
  onStartFocus: (title: string, minutes?: number) => void;
}

export default function TodayActiveQuestsCard({
  isCleanView = false,
  todayStr,
  todayTasks,
  todayMandatoryDone,
  todayMandatoryCount,
  isTodayFullClear,
  isDailyBountyClaimed,
  showTime,
  goals,
  onClaimDailyBounty,
  onGoalCheck,
  onChildCheck,
  onClaimGoal,
  onClaimChild,
  onStartFocus,
}: TodayActiveQuestsCardProps) {
  return (
    <div
      className={`w-full bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white dark:from-slate-900 dark:via-indigo-950/35 dark:to-slate-900 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/60 p-4 md:p-5 cursor-default ${
        isCleanView ? "max-w-2xl mx-auto shadow-xl" : ""
      }`}
      data-nodrag
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2 className="text-base md:text-lg font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
          <Calendar size={19} className="text-indigo-600 dark:text-indigo-400" /> Today&apos;s Active Quests (
          {todayStr})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-rpg-num">
            {todayMandatoryDone}/{todayMandatoryCount} Clear
          </span>
          {isTodayFullClear && !isDailyBountyClaimed && (
            <button
              onClick={onClaimDailyBounty}
              className="text-[11px] font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 px-3 py-1 rounded-full animate-bounce shadow-md flex items-center gap-1 cursor-pointer font-rpg-num"
            >
              <Gift size={13} /> Claim Daily Bounty (+75 SP)
            </button>
          )}
          {isTodayFullClear && isDailyBountyClaimed && (
            <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Crown size={12} className="text-amber-500" /> Bounty Claimed
            </span>
          )}
        </div>
      </div>

      {todayTasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {todayTasks.map((t) => {
            const parentGoal = goals.find((g) => g.id === t.goalId);
            return (
              <li
                key={t.id}
                className="bg-white dark:bg-slate-800/90 border border-indigo-100/80 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={(e) => {
                      if (!parentGoal) return;
                      if (t.isMainGoal) onGoalCheck(e, parentGoal);
                      else onChildCheck(e, parentGoal, t.id);
                    }}
                    className="flex items-center shrink-0 transition-transform cursor-pointer hover:scale-110"
                  >
                    {t.isCompleted ? (
                      <CheckCircle2 size={21} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Circle size={21} className="text-gray-300 dark:text-slate-600 hover:text-indigo-400" />
                    )}
                  </button>
                  <div className="flex flex-col justify-center min-w-0">
                    {t.isDaily ? (
                      <span
                        className={`text-sm font-bold truncate ${
                          t.isCompleted
                            ? "text-gray-400 dark:text-slate-500 line-through"
                            : "text-gray-800 dark:text-white"
                        }`}
                      >
                        {t.childTitle} {t.icon}
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-wider truncate">
                          {t.goalTitle}
                        </span>
                        <span
                          className={`text-sm font-semibold truncate ${
                            t.isCompleted
                              ? "text-gray-400 dark:text-slate-500 line-through"
                              : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {t.isOptional && <Star size={12} className="inline mr-1 text-amber-400 mb-0.5" />}
                          {t.childTitle}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {t.isCompleted && !t.isClaimed && parentGoal && (
                    <button
                      onClick={(e) => {
                        if (t.isMainGoal) onClaimGoal(e, parentGoal);
                        else onClaimChild(e, parentGoal, t.id);
                      }}
                      className="text-[10px] font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 px-2.5 py-1 rounded-full animate-pulse cursor-pointer font-rpg-num"
                    >
                      CLAIM +{t.reward}
                    </button>
                  )}
                  {showTime && t.startTime && (
                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950 px-2 py-1 rounded-md flex items-center gap-1 font-rpg-num">
                      <Clock size={11} /> {t.startTime} {t.endTime && `- ${t.endTime}`}
                    </div>
                  )}
                  <button
                    onClick={() => onStartFocus(t.childTitle, 25)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer"
                    title="Start 25m Focus Session"
                  >
                    <Timer size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs md:text-sm text-indigo-500/80 dark:text-indigo-300/70 font-medium italic bg-white/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-indigo-50 dark:border-slate-800 text-center">
          All clear for {todayStr}! Every scheduled quest for today has been claimed.
        </p>
      )}
    </div>
  );
}