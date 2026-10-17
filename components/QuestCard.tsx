"use client";

import React from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Settings2,
  Trash2,
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  GripHorizontal,
  ChevronDown,
  Coins,
  Target,
  Star,
  XOctagon,
  MoreHorizontal,
  X,
  Clock,
  ChevronsLeft,
  Copy,
  CheckCheck,
  Sparkles,
  Timer,
  FileText,
  Zap,
} from "lucide-react";
import { Goal, GoalPriority } from "../context/AppContext";
import {
  SubTask,
  THEMES,
  ICON_MAP,
  PRIORITY_CONFIG,
  CATEGORIES,
  getDailyTaskIcon,
  AnimatedDropdown,
  DraggableCard,
  SortableRow,
} from "./QuestShared";

interface QuestCardProps {
  goal: Goal;
  draggingId: string | null;
  recentlyCompleted: string[];
  showRewards: boolean;
  showTime: boolean;
  openNotesId: string | null;
  setOpenNotesId: React.Dispatch<React.SetStateAction<string | null>>;
  openSettings: string | null;
  setOpenSettings: React.Dispatch<React.SetStateAction<string | null>>;
  editingGoalId: string | null;
  setEditingGoalId: React.Dispatch<React.SetStateAction<string | null>>;
  editingChildId: string | null;
  setEditingChildId: React.Dispatch<React.SetStateAction<string | null>>;
  collapsedGoals: string[];
  setCollapsedGoals: React.Dispatch<React.SetStateAction<string[]>>;
  expandedChildId: string | null;
  setExpandedChildId: React.Dispatch<React.SetStateAction<string | null>>;
  copiedListId: string | null;
  activeSurge?: { id: number; label: string };
  onDragBegin: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragFinish: () => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onDuplicateGoal: (id: string, resetProgress?: boolean) => void;
  onStartFocus: (title: string, minutes?: number) => void;
  onGoalCheck: (e: React.MouseEvent, goal: Goal) => void;
  onChildCheck: (e: React.MouseEvent, goal: Goal, childId: string) => void;
  onClaimChild: (e: React.MouseEvent, goal: Goal, childId: string) => void;
  onClaimMilestone: (e: React.MouseEvent, goal: Goal, milestoneId: string) => void;
  onClaimListItem: (e: React.MouseEvent, goal: Goal, itemId: string) => void;
  onClaimAllReadyInGoal: (e: React.MouseEvent, goal: Goal) => void;
  onClaimGoal: (e: React.MouseEvent, goal: Goal) => void;
  onAddChildTask: (goalId: string) => void;
  onAddMilestone: (goalId: string) => void;
  onAddListItem: (goalId: string, title: string) => void;
  onToggleListItem: (e: React.MouseEvent, goalId: string, itemId: string) => void;
  onDeleteListItem: (goalId: string, itemId: string) => void;
  onCopyList: (goalId: string, items: { title: string }[]) => void;
  onGenerateDailyTasks: (goalId: string, frequency: "once" | "day-night") => void;
}

const QuestCard = React.forwardRef<HTMLDivElement, QuestCardProps>(function QuestCard({
  goal,
  draggingId,
  recentlyCompleted,
  showRewards,
  showTime,
  openNotesId,
  setOpenNotesId,
  openSettings,
  setOpenSettings,
  editingGoalId,
  setEditingGoalId,
  editingChildId,
  setEditingChildId,
  collapsedGoals,
  setCollapsedGoals,
  expandedChildId,
  setExpandedChildId,
  copiedListId,
  activeSurge,
  onDragBegin,
  onDragMove,
  onDragFinish,
  onUpdateGoal,
  onDeleteGoal,
  onDuplicateGoal,
  onStartFocus,
  onGoalCheck,
  onChildCheck,
  onClaimChild,
  onClaimMilestone,
  onClaimListItem,
  onClaimAllReadyInGoal,
  onClaimGoal,
  onAddChildTask,
  onAddMilestone,
  onAddListItem,
  onToggleListItem,
  onDeleteListItem,
  onCopyList,
  onGenerateDailyTasks,
}, ref) {
  const hasChildren = goal.type !== "list" && goal.children.length > 0;
  const hasMilestones = goal.type === "list" && (goal.milestones?.length || 0) > 0;
  const targetCount = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;

  const mustDoChildren = hasChildren ? goal.children.filter((c) => !c.isOptional) : [];
  const optionalChildren = hasChildren ? goal.children.filter((c) => c.isOptional) : [];
  const allMandatoryClaimed =
    hasChildren && (mustDoChildren.length === 0 || mustDoChildren.every((c) => c.isClaimed));
  const mandatoryMilestones = hasMilestones ? goal.milestones?.filter((m) => !m.isOptional) || [] : [];
  const allMilestonesClaimed = !hasMilestones || mandatoryMilestones.every((m) => m.isClaimed);

  const completedListCount =
    goal.listItems?.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length || 0;

  let claimedPct = 0;
  let readyPct = 0;
  let redPct = 0;

  if (goal.type === "list") {
    const rawPct = Math.min(100, Math.round((completedListCount / targetCount) * 100));
    if (goal.isClaimed) {
      claimedPct = 100;
    } else if (rawPct >= 100 && allMilestonesClaimed) {
      claimedPct = 85;
      readyPct = 15;
    } else {
      claimedPct = rawPct;
    }
    if (goal.isFailed) redPct = 100 - claimedPct;
  } else if (hasChildren) {
    if (mustDoChildren.length > 0) {
      const claimedCount = mustDoChildren.filter((c) => c.isClaimed).length;
      const readyCount = mustDoChildren.filter((c) => c.isCompleted && !c.isClaimed && !c.isFailed).length;
      const failedCount = mustDoChildren.filter((c) => c.isFailed && !c.isClaimed).length;
      claimedPct = Math.min(100, Math.round((claimedCount / mustDoChildren.length) * 100));
      readyPct = Math.min(100 - claimedPct, Math.round((readyCount / mustDoChildren.length) * 100));
      redPct = Math.min(100 - claimedPct - readyPct, Math.round((failedCount / mustDoChildren.length) * 100));
    } else {
      if (goal.isFailed) redPct = 100;
      else if (goal.isClaimed) claimedPct = 100;
    }
  } else {
    if (goal.isFailed) redPct = 100;
    else if (goal.isClaimed) claimedPct = 100;
    else if (goal.isCompleted) readyPct = 100;
  }

  const totalVisualPct = Math.min(100, claimedPct + readyPct);

  let optionalPct = 0;
  if (optionalChildren.length > 0) {
    const optClaimed = optionalChildren.filter((c) => c.isClaimed || c.isCompleted).length;
    optionalPct = Math.round((optClaimed / optionalChildren.length) * 100);
  }

  const unclaimedReadyListItems =
    goal.listItems?.filter((li) => {
      const isDone = goal.listHasCheckboxes === false ? true : li.isCompleted;
      const rw = li.reward ?? goal.listItemReward ?? 0;
      return isDone && !li.isClaimed && rw > 0;
    }).length || 0;

  const readySubTasksCount =
    goal.children.filter((c) => c.isCompleted && !c.isClaimed && !c.isFailed).length +
    (goal.milestones?.filter((m) => !m.isClaimed && completedListCount >= Math.max(1, m.at)).length || 0) +
    unclaimedReadyListItems;

  const canClaimMain =
    (!hasChildren && goal.type !== "list" && goal.isCompleted && !goal.isClaimed && !goal.isFailed) ||
    (hasChildren && allMandatoryClaimed && !goal.isClaimed && !goal.isFailed) ||
    (goal.type === "list" &&
      completedListCount >= targetCount &&
      allMilestonesClaimed &&
      !goal.isClaimed &&
      !goal.isFailed);

  const theme = THEMES[goal.theme || "default"] || THEMES.default;
  const CurrentIcon = goal.icon && ICON_MAP[goal.icon] ? ICON_MAP[goal.icon] : null;
  const prio = PRIORITY_CONFIG[goal.priority || "normal"];
  const PrioIcon = prio.icon;

  return (
    <DraggableCard
      ref={ref}
      id={goal.id}
      disabled={goal.isClaimed}
      isDragging={draggingId === goal.id}
      onDragBegin={onDragBegin}
      onDragMove={onDragMove}
      onDragFinish={onDragFinish}
      className={`w-full rounded-2xl border p-4 md:p-5 relative select-none transition-shadow [-webkit-touch-callout:none] ${
        theme.bg
      } ${goal.isFailed ? "border-red-400 ring-2 ring-red-400" : `${theme.border} ${prio.ring}`} ${
        goal.isClaimed ? "opacity-75 cursor-default" : "md:cursor-grab md:active:cursor-grabbing"
      } ${
        recentlyCompleted.includes(goal.id)
          ? "ring-2 ring-emerald-400 shadow-xl z-10"
          : "hover:shadow-md dark:hover:shadow-slate-900/50"
      }`}
    >
      {/* Top Metadata Pills */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
              goal.type === "weekly"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                : goal.type === "list"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {goal.type}
          </span>
          {goal.category && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/70 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-black/5 dark:border-white/10">
              {goal.category}
            </span>
          )}
          {goal.priority && goal.priority !== "normal" && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 ${prio.badge}`}>
              {PrioIcon && <PrioIcon size={10} />}
              {prio.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {showRewards && goal.reward > 0 && !goal.isClaimed && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200/70 dark:border-amber-800 font-rpg-num">
              <Coins size={11} /> {goal.reward}
            </span>
          )}
          {!goal.isClaimed && (
            <button
              onClick={() => onStartFocus(goal.title || "Quest Focus", goal.estimatedMinutes || 25)}
              className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Start Focus Timer for this Quest"
            >
              <Timer size={15} />
            </button>
          )}
          <button
            onClick={() => onDuplicateGoal(goal.id, true)}
            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Duplicate Quest"
          >
            <Copy size={14} />
          </button>
          {!goal.isClaimed && (
            <button
              onClick={() => setOpenNotesId(openNotesId === goal.id ? null : goal.id)}
              className={`p-1 rounded-lg cursor-pointer transition-colors ${
                goal.notes || openNotesId === goal.id
                  ? "text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-slate-800"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800"
              }`}
              title="Quest Notes"
            >
              <FileText size={15} />
            </button>
          )}
          {goal.isClaimed && (
            <button
              onClick={() => onDeleteGoal(goal.id)}
              className="p-1 text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
              title="Delete Goal"
            >
              <Trash2 size={16} />
            </button>
          )}
          {!goal.isClaimed && (
            <button
              onClick={() => setOpenSettings(openSettings === goal.id ? null : goal.id)}
              className={`p-1 rounded-lg cursor-pointer transition-colors ${
                openSettings === goal.id
                  ? "text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-slate-800"
                  : "text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800"
              }`}
              title="Quest Settings"
            >
              <Settings2 size={16} />
            </button>
          )}
          {!goal.isClaimed && (
            <div
              data-card-handle
              className="touch-none p-1 -mr-1 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing"
              title="Drag to move"
            >
              <GripHorizontal size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Main Title & Claim Buttons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {!hasChildren && goal.type !== "list" && (
            <button
              onClick={(e) => onGoalCheck(e, goal)}
              disabled={goal.isClaimed || goal.isFailed}
              className={`mt-0.5 shrink-0 transition-transform cursor-pointer ${
                goal.isClaimed || goal.isFailed ? "cursor-not-allowed" : "hover:scale-110"
              }`}
            >
              {goal.isClaimed ? (
                <CheckCircle2 size={24} className="text-gray-300 dark:text-slate-600" />
              ) : goal.isCompleted ? (
                <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Circle
                  size={24}
                  className={goal.isFailed ? "text-red-300 dark:text-red-700" : "text-gray-300 dark:text-slate-600"}
                />
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            {editingGoalId === goal.id ? (
              <input
                type="text"
                placeholder="Quest Title..."
                value={goal.title}
                autoFocus
                disabled={goal.isClaimed}
                onChange={(e) => onUpdateGoal(goal.id, { title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && setEditingGoalId(null)}
                onBlur={() => setEditingGoalId(null)}
                className={`font-bold text-base md:text-lg bg-transparent outline-none w-full border-b-2 border-indigo-500 ${theme.text}`}
              />
            ) : (
              <span
                onClick={() => !goal.isClaimed && setEditingGoalId(goal.id)}
                className={`font-bold text-base md:text-lg cursor-text line-clamp-2 break-words flex items-center flex-wrap gap-1 ${
                  goal.isClaimed
                    ? "text-gray-400 dark:text-slate-500 line-through"
                    : goal.isFailed
                    ? "text-red-400 line-through"
                    : theme.text
                }`}
              >
                {goal.isOptional && <Star size={17} className="inline text-amber-400 fill-amber-400" />}
                {CurrentIcon && <CurrentIcon size={18} className="inline opacity-80" />}
                <span>{goal.title || "Untitled Quest"}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {readySubTasksCount > 1 && !goal.isClaimed && (
            <button
              onClick={(e) => onClaimAllReadyInGoal(e, goal)}
              className="text-[10px] font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs transition-transform hover:scale-105 cursor-pointer flex items-center gap-1 font-rpg-num"
              title="Claim all completed items in this quest"
            >
              <Zap size={11} /> Claim ({readySubTasksCount})
            </button>
          )}
          {canClaimMain && (
            <button
              onClick={(e) => onClaimGoal(e, goal)}
              className="text-[10px] md:text-xs font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 px-3 py-1 rounded-full whitespace-nowrap animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:scale-105 transition-transform cursor-pointer"
            >
              CLAIM QUEST
            </button>
          )}
        </div>
      </div>

      {/* Expandable Quest Notes Drawer */}
      <AnimatePresence initial={false}>
        {(openNotesId === goal.id || (goal.notes && !collapsedGoals.includes(goal.id))) && (
          <motion.div
            key="notes-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            data-nodrag
          >
            <div className="pb-2 pt-0.5">
              {openNotesId === goal.id ? (
                <div className="bg-white/85 dark:bg-slate-800/85 p-2.5 rounded-xl border border-indigo-200 dark:border-slate-700">
                  <textarea
                    rows={2}
                    placeholder="Add quest notes, links, or checklist details..."
                    value={goal.notes || ""}
                    onChange={(e) => onUpdateGoal(goal.id, { notes: e.target.value })}
                    className="w-full text-xs text-gray-700 dark:text-slate-200 bg-transparent outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setOpenNotesId(null)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  onClick={() => setOpenNotesId(goal.id)}
                  className="text-xs text-gray-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-black/5 dark:border-white/5 cursor-pointer line-clamp-2"
                >
                  {goal.notes}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Drawer */}
      <AnimatePresence initial={false}>
        {openSettings === goal.id && !goal.isClaimed && (
          <motion.div
            key="settings-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            data-nodrag
          >
            <div className="pt-2 pb-2">
              <div className="p-3.5 bg-white/95 dark:bg-slate-800/95 rounded-2xl border border-gray-200 dark:border-slate-700 grid gap-3 grid-cols-2 shadow-sm">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Type</label>
                  <div className="flex gap-1 bg-gray-200/70 dark:bg-slate-900 p-1 rounded-lg mt-1">
                    {(["weekly", "daily", "list"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onUpdateGoal(goal.id, { type: t })}
                        className={`flex-1 text-[10px] py-1 font-bold rounded-md capitalize transition-colors cursor-pointer ${
                          goal.type === t
                            ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                    Completion Reward (SP)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goal.reward === 0 ? "" : goal.reward}
                    onChange={(e) => onUpdateGoal(goal.id, { reward: Number(e.target.value) })}
                    className="block w-full mt-1 p-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 outline-none focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-slate-900 font-rpg-num"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                    Priority Rank
                  </label>
                  <div className="mt-1">
                    <AnimatedDropdown
                      value={goal.priority || "normal"}
                      options={[
                        { value: "normal", label: "Normal Quest" },
                        { value: "high", label: "High Priority" },
                        { value: "boss", label: "Boss Quest ⚔️" },
                      ]}
                      onChange={(val) => onUpdateGoal(goal.id, { priority: val as GoalPriority })}
                      buttonClassName="w-full p-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                    Life Area
                  </label>
                  <div className="mt-1">
                    <AnimatedDropdown
                      value={goal.category || "Personal"}
                      options={CATEGORIES.filter((c) => c !== "All Areas").map((c) => ({
                        value: c,
                        label: c,
                      }))}
                      onChange={(val) => onUpdateGoal(goal.id, { category: val })}
                      buttonClassName="w-full p-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                    Pastel Card Theme
                  </label>
                  <div className="flex gap-2 mt-1">
                    {Object.keys(THEMES).map((t) => (
                      <button
                        key={t}
                        onClick={() => onUpdateGoal(goal.id, { theme: t })}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                          goal.theme === t || (!goal.theme && t === "default")
                            ? "border-gray-900 dark:border-white scale-110"
                            : "border-transparent"
                        } ${THEMES[t].progress}`}
                        title={t}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Icon</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.keys(ICON_MAP).map((iKey) => {
                      const IconCmp = ICON_MAP[iKey];
                      return (
                        <button
                          key={iKey}
                          onClick={() => onUpdateGoal(goal.id, { icon: goal.icon === iKey ? undefined : iKey })}
                          className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                            goal.icon === iKey
                              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300"
                              : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <IconCmp size={15} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex-wrap">
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!goal.isOptional}
                        onChange={(e) => onUpdateGoal(goal.id, { isOptional: e.target.checked })}
                        className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />{" "}
                      Optional
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!goal.isFailed}
                        onChange={(e) => onUpdateGoal(goal.id, { isFailed: e.target.checked })}
                        className="accent-red-500 w-3.5 h-3.5 cursor-pointer"
                      />{" "}
                      Failed
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDuplicateGoal(goal.id, true)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                      title="Duplicate this quest with fresh unchecked tasks"
                    >
                      <Copy size={12} /> Duplicate Quest
                    </button>
                  </div>
                </div>

                {goal.type === "list" && (
                  <div className="col-span-2 border-t border-gray-200 dark:border-slate-700 pt-3">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                          Target Count
                        </label>
                        <input
                          type="number"
                          placeholder="10"
                          value={goal.targetCount === 0 ? "" : goal.targetCount || 10}
                          onChange={(e) =>
                            onUpdateGoal(goal.id, { targetCount: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="block w-full mt-1 p-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-rpg-num"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                          Per-Item Reward (SP)
                        </label>
                        <input
                          type="number"
                          placeholder="10"
                          value={goal.listItemReward ?? 10}
                          onChange={(e) => {
                            const nextRw = Math.max(0, Number(e.target.value) || 0);
                            onUpdateGoal(goal.id, {
                              listItemReward: nextRw,
                              listItems: goal.listItems?.map((li) =>
                                li.isClaimed ? li : { ...li, reward: nextRw }
                              ),
                            });
                          }}
                          className="block w-full mt-1 p-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-rpg-num"
                        />
                      </div>
                    </div>
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                      Milestones
                    </label>
                    <div className="space-y-2 mt-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-3">
                      {goal.milestones?.map((m) => (
                        <div key={m.id} className="flex gap-2 items-center flex-wrap">
                          <span className="text-xs text-gray-700 dark:text-slate-300 font-bold">At</span>
                          <input
                            type="number"
                            placeholder="1"
                            value={m.at === 0 ? "" : m.at}
                            onChange={(e) =>
                              onUpdateGoal(goal.id, {
                                milestones: goal.milestones
                                  ?.map((mx) =>
                                    mx.id === m.id ? { ...mx, at: Math.max(1, Number(e.target.value) || 1) } : mx
                                  )
                                  .sort((a, b) => a.at - b.at),
                              })
                            }
                            className="w-12 p-1 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-rpg-num"
                          />
                          <span className="text-xs text-gray-700 dark:text-slate-300 font-bold">SP</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={m.reward === 0 ? "" : m.reward}
                            onChange={(e) =>
                              onUpdateGoal(goal.id, {
                                milestones: goal.milestones?.map((mx) =>
                                  mx.id === m.id ? { ...mx, reward: Number(e.target.value) } : mx
                                ),
                              })
                            }
                            className="w-14 p-1 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-rpg-num"
                          />
                          <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!m.isOptional}
                              onChange={(e) =>
                                onUpdateGoal(goal.id, {
                                  milestones: goal.milestones?.map((mx) =>
                                    mx.id === m.id ? { ...mx, isOptional: e.target.checked } : mx
                                  ),
                                })
                              }
                              className="accent-amber-500 w-3 h-3 cursor-pointer"
                            />{" "}
                            Opt
                          </label>
                          <button
                            onClick={() =>
                              onUpdateGoal(goal.id, {
                                milestones: goal.milestones?.filter((mx) => mx.id !== m.id),
                              })
                            }
                            className="text-red-400 hover:text-red-600 ml-auto cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => onAddMilestone(goal.id)}
                        className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center gap-1 hover:underline mt-2 cursor-pointer"
                      >
                        <Plus size={12} /> Add Milestone
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goal.listHasCheckboxes !== false}
                        onChange={(e) => onUpdateGoal(goal.id, { listHasCheckboxes: e.target.checked })}
                        className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      Require Checkboxes
                    </label>
                  </div>
                )}

                {goal.type === "daily" && (
                  <div className="col-span-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => onGenerateDailyTasks(goal.id, "once")}
                      className={`flex-1 border p-2 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                        goal.frequency !== "day-night"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-indigo-500"
                      }`}
                    >
                      Once a Day (Mon–Sun)
                    </button>
                    <button
                      onClick={() => onGenerateDailyTasks(goal.id, "day-night")}
                      className={`flex-1 border p-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        goal.frequency === "day-night"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-indigo-500"
                      }`}
                    >
                      Day & Night <Sun size={13} className="text-amber-400" />
                      <Moon size={13} className="text-indigo-300" />
                    </button>
                  </div>
                )}

                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Quest
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RPG Progress Bar with Subtask Completion Surge Animation */}
      {(hasChildren || goal.type === "list") && (
        <div className="mt-2 flex items-center justify-between gap-3 relative">
          <div className="flex-1 relative">
            <AnimatePresence>
              {activeSurge && (
                <motion.div
                  key={activeSurge.id}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: -18, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute right-0 -top-1 z-30 pointer-events-none bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/30 flex items-center gap-1 font-rpg-num"
                >
                  <Sparkles size={10} className="text-amber-300" />
                  <span>{activeSurge.label}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between text-[10px] md:text-xs text-gray-600 dark:text-slate-300 mb-1 font-bold">
              <span className="flex items-center gap-1">
                {goal.isClaimed ? (
                  "Quest Claimed ✨"
                ) : totalVisualPct === 100 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Ready to Claim!</span>
                ) : (
                  "Quest Progress"
                )}
              </span>
              <span className="font-rpg-num">
                {totalVisualPct}%{readyPct > 0 && !goal.isClaimed ? ` (${claimedPct}% claimed)` : ""}
              </span>
            </div>

            <div
              className={`w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 flex relative overflow-hidden border border-black/5 dark:border-white/5 ${
                activeSurge ? "animate-rpg-surge ring-2 ring-emerald-400/70" : ""
              }`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${claimedPct}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className={`h-full ${theme.progress} relative overflow-hidden`}
              >
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-rpg-shimmer" />
              </motion.div>
              {readyPct > 0 && (
                <motion.div
                  initial={false}
                  animate={{ width: `${readyPct}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 relative overflow-hidden"
                  title="Completed & Ready to Claim"
                >
                  <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-rpg-shimmer" />
                </motion.div>
              )}
              {redPct > 0 && (
                <motion.div
                  initial={false}
                  animate={{ width: `${redPct}%` }}
                  transition={{ duration: 0.35 }}
                  className="h-full bg-red-400"
                />
              )}
              {optionalChildren.length > 0 && optionalPct > 0 && (
                <motion.div
                  initial={false}
                  animate={{ width: `${optionalPct}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-300 to-yellow-500 opacity-85 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                />
              )}
            </div>
          </div>
          <button
            onClick={() =>
              setCollapsedGoals((prev) =>
                prev.includes(goal.id) ? prev.filter((id) => id !== goal.id) : [...prev, goal.id]
              )
            }
            className="text-gray-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors p-1.5 rounded-lg shrink-0 border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-800 cursor-pointer"
            title={collapsedGoals.includes(goal.id) ? "Expand Quest" : "Collapse Quest"}
          >
            <motion.div
              animate={{ rotate: collapsedGoals.includes(goal.id) ? 0 : 180 }}
              transition={{ duration: 0.22 }}
            >
              <ChevronDown size={14} />
            </motion.div>
          </button>
        </div>
      )}

      {/* List UI */}
      {goal.type === "list" && (
        <AnimatePresence initial={false}>
          {!collapsedGoals.includes(goal.id) && (
            <motion.div
              key="list-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              data-nodrag
            >
              <div className="pt-3">
                <div className="bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Add list item & press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          onAddListItem(goal.id, e.currentTarget.value.trim());
                          e.currentTarget.value = "";
                        }
                      }}
                      className="flex-1 p-2 text-xs md:text-sm rounded-lg border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500 bg-white dark:bg-slate-900"
                    />
                    <button
                      onClick={() => onCopyList(goal.id, goal.listItems || [])}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
                      title="Copy all items to clipboard"
                    >
                      {copiedListId === goal.id ? (
                        <CheckCheck size={15} className="text-emerald-500" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                    <span className="text-xs font-extrabold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shrink-0 font-rpg-num">
                      {completedListCount} / {targetCount}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {goal.listItems?.map((item) => {
                      const isItemDone = goal.listHasCheckboxes === false ? true : item.isCompleted;
                      const itemReward = item.reward ?? goal.listItemReward ?? 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            recentlyCompleted.includes(item.id)
                              ? "ring-1 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                              : item.isClaimed
                              ? "bg-white/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800/70 opacity-75"
                              : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          {goal.listHasCheckboxes !== false && (
                            <button
                              onClick={(e) => onToggleListItem(e, goal.id, item.id)}
                              disabled={item.isClaimed}
                              className={`flex items-center h-4 md:h-5 shrink-0 cursor-pointer ${
                                item.isClaimed
                                  ? "text-gray-300 dark:text-slate-600 cursor-not-allowed"
                                  : item.isCompleted
                                  ? "text-emerald-500"
                                  : "text-gray-300 dark:text-slate-600 hover:text-indigo-400"
                              }`}
                            >
                              {item.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </button>
                          )}
                          <span
                            className={`text-xs md:text-sm flex-1 break-words line-clamp-2 ${
                              item.isClaimed || (goal.listHasCheckboxes !== false && item.isCompleted)
                                ? "text-gray-400 dark:text-slate-500 line-through"
                                : "text-gray-700 dark:text-slate-200"
                            }`}
                          >
                            {item.title}
                          </span>

                          {showRewards && itemReward > 0 && !item.isClaimed && !isItemDone && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-0.5 font-rpg-num shrink-0">
                              <Coins size={10} /> {itemReward}
                            </span>
                          )}

                          {isItemDone && !item.isClaimed && itemReward > 0 && (
                            <button
                              onClick={(e) => onClaimListItem(e, goal, item.id)}
                              className="shrink-0 text-[10px] font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 px-2 py-0.5 rounded-full animate-pulse shadow-2xs hover:scale-105 transition-transform cursor-pointer font-rpg-num"
                            >
                              CLAIM {itemReward}
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteListItem(goal.id, item.id)}
                            className="text-gray-300 dark:text-slate-600 hover:text-red-500 p-0.5 cursor-pointer shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                    {(!goal.listItems || goal.listItems.length === 0) && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 text-center italic py-2">
                        No items logged yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Milestones List */}
      {hasMilestones && (
        <AnimatePresence initial={false}>
          {!collapsedGoals.includes(goal.id) && (
            <motion.div
              key="milestones-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-1.5">
                {goal.milestones?.map((m) => {
                  const isReached = completedListCount >= Math.max(1, m.at);
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-all duration-300 ${
                        recentlyCompleted.includes(m.id)
                          ? "scale-[1.02] ring-1 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 shadow-xs"
                          : m.isClaimed
                          ? "bg-white/40 dark:bg-slate-800/40"
                          : "bg-white/90 dark:bg-slate-800/90 border border-gray-100 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Target
                          size={15}
                          className={
                            m.isClaimed
                              ? "text-gray-300 dark:text-slate-600"
                              : isReached
                              ? "text-emerald-500"
                              : "text-indigo-400"
                          }
                        />
                        <span
                          className={`text-xs font-bold ${
                            m.isClaimed
                              ? "text-gray-400 dark:text-slate-500 line-through"
                              : "text-gray-700 dark:text-slate-200"
                          }`}
                        >
                          {m.isOptional && <Star size={12} className="inline mr-1 text-amber-400" />} Reach{" "}
                          <span className="font-rpg-num">{m.at}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!m.isClaimed && !isReached && showRewards && (
                          <div className="flex items-center bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full shrink-0 gap-1 font-rpg-num">
                            <Coins size={10} className="text-amber-700 dark:text-amber-300" />
                            <span className="text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                              {m.reward}
                            </span>
                          </div>
                        )}
                        {isReached && !m.isClaimed && (
                          <button
                            onClick={(e) => onClaimMilestone(e, goal, m.id)}
                            className="shrink-0 text-[10px] font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 px-2.5 py-1 rounded-full animate-pulse shadow-xs hover:scale-105 transition-transform cursor-pointer font-rpg-num"
                          >
                            CLAIM {m.reward}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Sub-goals List */}
      {hasChildren && (
        <AnimatePresence initial={false}>
          {!collapsedGoals.includes(goal.id) && (
            <motion.div
              key="subtasks-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              data-nodrag
            >
              <Reorder.Group
                axis="y"
                as="div"
                values={goal.children}
                onReorder={(newChildren) => onUpdateGoal(goal.id, { children: newChildren })}
                className="pt-3 space-y-2"
              >
                {goal.children.map((child: SubTask) => {
                  const dailyEmoji = goal.type === "daily" ? getDailyTaskIcon(child, goal.title) : "";
                  return (
                    <SortableRow
                      key={child.id}
                      value={child}
                      hideControls={expandedChildId === child.id}
                      className={`flex items-center gap-1.5 md:gap-2 p-2 rounded-xl transition-colors duration-300 ${
                        recentlyCompleted.includes(child.id)
                          ? "scale-[1.02] ring-1 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 shadow-xs"
                          : child.isClaimed
                          ? "bg-white/40 dark:bg-slate-800/40 cursor-default"
                          : child.isFailed
                          ? "bg-red-50/50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60"
                          : "bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-800 border border-black/5 dark:border-white/5"
                      }`}
                    >
                      <button
                        onClick={(e) => onChildCheck(e, goal, child.id)}
                        disabled={child.isClaimed || child.isFailed}
                        className={`flex items-center shrink-0 transition-transform cursor-pointer ${
                          child.isClaimed || child.isFailed ? "cursor-not-allowed" : "hover:scale-110"
                        } ${expandedChildId === child.id ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                      >
                        {child.isClaimed ? (
                          <CheckCircle2 size={18} className="text-gray-300 dark:text-slate-600" />
                        ) : child.isCompleted ? (
                          <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Circle
                            size={18}
                            className={
                              child.isFailed
                                ? "text-red-300 dark:text-red-700"
                                : "text-gray-300 dark:text-slate-600"
                            }
                          />
                        )}
                      </button>

                      <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
                        {/* Desktop View */}
                        <div className="hidden md:flex items-center w-full min-w-0 h-full">
                          <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                            {editingChildId === child.id ? (
                              <input
                                type="text"
                                placeholder="New Sub-task"
                                autoFocus
                                value={child.title}
                                disabled={child.isClaimed}
                                onKeyDown={(e) => e.key === "Enter" && setEditingChildId(null)}
                                onBlur={() => setEditingChildId(null)}
                                onChange={(e) =>
                                  onUpdateGoal(goal.id, {
                                    children: goal.children.map((c) =>
                                      c.id === child.id ? { ...c, title: e.target.value } : c
                                    ),
                                  })
                                }
                                className="text-xs md:text-sm bg-transparent outline-none w-full border-b border-indigo-400 text-gray-900 dark:text-white"
                              />
                            ) : (
                              <span
                                onClick={() => !child.isClaimed && setEditingChildId(child.id)}
                                className={`text-xs md:text-sm font-medium cursor-text line-clamp-2 break-words w-full ${
                                  child.isClaimed
                                    ? "text-gray-400 dark:text-slate-500 line-through"
                                    : child.isFailed
                                    ? "text-red-400 line-through"
                                    : "text-gray-900 dark:text-slate-100"
                                }`}
                              >
                                {child.isOptional && (
                                  <Star size={13} className="inline mr-1 text-amber-400 fill-amber-400 mb-0.5" />
                                )}
                                {child.title || "New Sub-task"} {dailyEmoji}
                              </span>
                            )}

                            {showTime && child.startTime && (
                              <div className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1 font-rpg-num">
                                <Clock size={10} /> {child.startTime} {child.endTime ? `- ${child.endTime}` : ""}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center h-full relative">
                            {showRewards && !child.isClaimed && !child.isCompleted && expandedChildId !== child.id && (
                              <div className="flex items-center bg-amber-100/90 dark:bg-amber-950 px-1.5 py-0.5 rounded-lg gap-0.5 mr-1.5 font-rpg-num">
                                <Coins size={10} className="text-amber-700 dark:text-amber-300" />
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={child.reward === 0 ? "" : child.reward}
                                  onChange={(e) =>
                                    onUpdateGoal(goal.id, {
                                      children: goal.children.map((c) =>
                                        c.id === child.id ? { ...c, reward: Number(e.target.value) } : c
                                      ),
                                    })
                                  }
                                  className="w-8 bg-transparent text-amber-800 dark:text-amber-300 text-[10px] font-bold outline-none text-center"
                                />
                              </div>
                            )}
                            {showRewards &&
                              child.reward > 0 &&
                              (child.isClaimed || child.isCompleted) &&
                              expandedChildId !== child.id && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mr-1.5 font-rpg-num">
                                  <Coins size={10} /> {child.reward}
                                </span>
                              )}

                            {expandedChildId === child.id ? (
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 shadow-xs border border-gray-200 dark:border-slate-700 rounded-lg p-1 z-20">
                                {!child.isClaimed && (
                                  <>
                                    <button
                                      onClick={() =>
                                        onUpdateGoal(goal.id, {
                                          children: goal.children.map((c) =>
                                            c.id === child.id ? { ...c, isOptional: !c.isOptional } : c
                                          ),
                                        })
                                      }
                                      className={`p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer ${
                                        child.isOptional
                                          ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60"
                                          : "text-gray-400"
                                      }`}
                                      title="Toggle Optional"
                                    >
                                      <Star size={13} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        onUpdateGoal(goal.id, {
                                          children: goal.children.map((c) =>
                                            c.id === child.id ? { ...c, isFailed: !c.isFailed } : c
                                          ),
                                        })
                                      }
                                      className={`p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer ${
                                        child.isFailed ? "text-red-500 bg-red-50 dark:bg-red-950/60" : "text-gray-400"
                                      }`}
                                      title="Toggle Failed"
                                    >
                                      <XOctagon size={13} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        onUpdateGoal(goal.id, {
                                          children: goal.children.filter((c) => c.id !== child.id),
                                        })
                                      }
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setExpandedChildId(null)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white border-l border-gray-200 dark:border-slate-700 ml-0.5 cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {child.isCompleted && !child.isClaimed && !child.isFailed && (
                                  <button
                                    onClick={(e) => onClaimChild(e, goal, child.id)}
                                    className="shrink-0 text-[10px] font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    CLAIM
                                  </button>
                                )}
                                {!child.isClaimed && (
                                  <button
                                    onClick={() => setExpandedChildId(child.id)}
                                    className="p-1 text-gray-400 hover:bg-gray-200/60 dark:hover:bg-slate-700/60 rounded cursor-pointer"
                                  >
                                    <MoreHorizontal size={15} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          <div className="w-full shrink-0 snap-center flex items-center min-w-0 min-h-[28px]">
                            <div className="flex-1 min-w-0 flex flex-col">
                              {editingChildId === child.id ? (
                                <input
                                  type="text"
                                  placeholder="New Sub-task"
                                  autoFocus
                                  value={child.title}
                                  disabled={child.isClaimed}
                                  onKeyDown={(e) => e.key === "Enter" && setEditingChildId(null)}
                                  onBlur={() => setEditingChildId(null)}
                                  onChange={(e) =>
                                    onUpdateGoal(goal.id, {
                                      children: goal.children.map((c) =>
                                        c.id === child.id ? { ...c, title: e.target.value } : c
                                      ),
                                    })
                                  }
                                  className="text-xs bg-transparent outline-none w-full border-b border-indigo-400 text-gray-900 dark:text-white"
                                />
                              ) : (
                                <span
                                  onClick={() => !child.isClaimed && setEditingChildId(child.id)}
                                  className={`text-xs cursor-text line-clamp-2 break-words w-full ${
                                    child.isClaimed
                                      ? "text-gray-400 dark:text-slate-500 line-through"
                                      : child.isFailed
                                      ? "text-red-400 line-through"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {child.isOptional && (
                                    <Star size={12} className="inline mr-1 text-amber-400 mb-0.5" />
                                  )}
                                  {child.title || "New Sub-task"} {dailyEmoji}
                                </span>
                              )}

                              {showTime && child.startTime && (
                                <div className="text-[9px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1 font-rpg-num">
                                  <Clock size={10} /> {child.startTime} {child.endTime ? `- ${child.endTime}` : ""}
                                </div>
                              )}
                            </div>

                            {!child.isClaimed && (
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                {showRewards && !child.isCompleted && !child.isFailed && (
                                  <div className="flex items-center bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-lg gap-0.5 font-rpg-num">
                                    <Coins size={11} className="text-amber-700 dark:text-amber-300 shrink-0" />
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      placeholder="0"
                                      value={child.reward === 0 ? "" : child.reward}
                                      onChange={(e) =>
                                        onUpdateGoal(goal.id, {
                                          children: goal.children.map((c) =>
                                            c.id === child.id ? { ...c, reward: Number(e.target.value) } : c
                                          ),
                                        })
                                      }
                                      className="w-7 bg-transparent text-amber-800 dark:text-amber-300 text-[11px] font-bold outline-none text-center"
                                    />
                                  </div>
                                )}
                                {child.isCompleted && !child.isFailed && (
                                  <button
                                    onClick={(e) => onClaimChild(e, goal, child.id)}
                                    className="text-[10px] font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 px-2.5 py-1 rounded-full animate-pulse cursor-pointer"
                                  >
                                    CLAIM
                                  </button>
                                )}
                                <ChevronsLeft size={14} className="text-gray-300 dark:text-slate-600" />
                              </div>
                            )}
                          </div>

                          {!child.isClaimed && (
                            <div className="shrink-0 snap-center flex items-center gap-1.5 pl-3 pr-1">
                              <button
                                onClick={() =>
                                  onUpdateGoal(goal.id, {
                                    children: goal.children.map((c) =>
                                      c.id === child.id ? { ...c, isOptional: !c.isOptional } : c
                                    ),
                                  })
                                }
                                className={`h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer ${
                                  child.isOptional
                                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60"
                                    : "text-gray-400 bg-gray-100 dark:bg-slate-800"
                                }`}
                              >
                                <Star size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateGoal(goal.id, {
                                    children: goal.children.map((c) =>
                                      c.id === child.id ? { ...c, isFailed: !c.isFailed } : c
                                    ),
                                  })
                                }
                                className={`h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer ${
                                  child.isFailed
                                    ? "text-red-500 bg-red-50 dark:bg-red-950/60"
                                    : "text-gray-400 bg-gray-100 dark:bg-slate-800"
                                }`}
                              >
                                <XOctagon size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateGoal(goal.id, {
                                    children: goal.children.filter((c) => c.id !== child.id),
                                  })
                                }
                                className="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer text-red-400 bg-red-50 dark:bg-red-950/60"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </SortableRow>
                  );
                })}
              </Reorder.Group>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {goal.type !== "list" && !goal.isClaimed && !goal.isFailed && (
        <button
          onClick={() => onAddChildTask(goal.id)}
          className="mt-3 flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add sub-task
        </button>
      )}
    </DraggableCard>
  );
});

export default QuestCard;