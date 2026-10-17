"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ChevronDown,
  GripVertical,
  PenTool,
  Palette,
  Mic,
  Sparkles,
  Home,
  Briefcase,
  Book,
  Heart,
  Swords,
} from "lucide-react";
import { Goal, GoalPriority, StickyNoteItem } from "../context/AppContext";

export type SubTask = Goal["children"][number];

export const LONG_PRESS_MS = 300;
export const ASSIGN_GAP = 12;
export const jsDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const assignDays = ["Unorganized", ...jsDays];

export const ICON_MAP: Record<string, React.ElementType> = {
  writing: PenTool,
  drawing: Palette,
  recording: Mic,
  skincare: Sparkles,
  cleaning: Home,
  work: Briefcase,
  study: Book,
  health: Heart,
};

export const CATEGORIES = ["All Areas", "Creative", "Health", "Work", "Study", "Home", "Personal"];

export const PRIORITY_CONFIG: Record<
  GoalPriority,
  { label: string; badge: string; ring: string; icon?: React.ElementType }
> = {
  normal: {
    label: "Normal",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    ring: "",
  },
  high: {
    label: "High Priority",
    badge:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    ring: "ring-1 ring-amber-300/60 dark:ring-amber-500/40",
  },
  boss: {
    label: "Boss Quest",
    badge:
      "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    ring: "ring-2 ring-rose-400/50 dark:ring-rose-500/50",
    icon: Swords,
  },
};

export const THEMES: Record<string, { bg: string; border: string; text: string; progress: string }> = {
  default: {
    bg: "bg-white dark:bg-slate-900",
    border: "border-gray-200/80 dark:border-slate-800 shadow-xs",
    text: "text-gray-800 dark:text-slate-100",
    progress: "bg-indigo-500",
  },
  sky: {
    bg: "bg-sky-100/90 dark:bg-sky-950/60",
    border: "border-sky-200/60 dark:border-sky-800/60",
    text: "text-sky-950 dark:text-sky-100",
    progress: "bg-sky-500",
  },
  mint: {
    bg: "bg-teal-100/90 dark:bg-teal-950/60",
    border: "border-teal-200/60 dark:border-teal-800/60",
    text: "text-teal-950 dark:text-teal-100",
    progress: "bg-teal-500",
  },
  lavender: {
    bg: "bg-indigo-100/90 dark:bg-indigo-950/60",
    border: "border-indigo-200/60 dark:border-indigo-800/60",
    text: "text-indigo-950 dark:text-indigo-100",
    progress: "bg-indigo-500",
  },
  peach: {
    bg: "bg-orange-100/90 dark:bg-orange-950/60",
    border: "border-orange-200/60 dark:border-orange-800/60",
    text: "text-orange-950 dark:text-orange-100",
    progress: "bg-orange-500",
  },
  lemon: {
    bg: "bg-yellow-100/90 dark:bg-yellow-950/50",
    border: "border-yellow-200/60 dark:border-yellow-800/60",
    text: "text-yellow-950 dark:text-yellow-100",
    progress: "bg-amber-500",
  },
  pink: {
    bg: "bg-fuchsia-100/90 dark:bg-fuchsia-950/60",
    border: "border-fuchsia-200/60 dark:border-fuchsia-800/60",
    text: "text-fuchsia-950 dark:text-fuchsia-100",
    progress: "bg-fuchsia-500",
  },
};

export const STICKY_COLORS: Record<
  StickyNoteItem["color"],
  { bg: string; border: string; text: string; pill: string; dot: string }
> = {
  amber: {
    bg: "bg-amber-50/95 dark:bg-amber-950/90",
    border: "border-amber-300 dark:border-amber-700/80",
    text: "text-amber-950 dark:text-amber-100",
    pill: "bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200",
    dot: "bg-amber-400",
  },
  mint: {
    bg: "bg-emerald-50/95 dark:bg-emerald-950/90",
    border: "border-emerald-300 dark:border-emerald-700/80",
    text: "text-emerald-950 dark:text-emerald-100",
    pill: "bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200",
    dot: "bg-emerald-400",
  },
  rose: {
    bg: "bg-rose-50/95 dark:bg-rose-950/90",
    border: "border-rose-300 dark:border-rose-700/80",
    text: "text-rose-950 dark:text-rose-100",
    pill: "bg-rose-200/80 dark:bg-rose-900/70 text-rose-900 dark:text-rose-200",
    dot: "bg-rose-400",
  },
  sky: {
    bg: "bg-sky-50/95 dark:bg-sky-950/90",
    border: "border-sky-300 dark:border-sky-700/80",
    text: "text-sky-950 dark:text-sky-100",
    pill: "bg-sky-200/80 dark:bg-sky-900/70 text-sky-900 dark:text-sky-200",
    dot: "bg-sky-400",
  },
  violet: {
    bg: "bg-violet-50/95 dark:bg-violet-950/90",
    border: "border-violet-300 dark:border-violet-700/80",
    text: "text-violet-950 dark:text-violet-100",
    pill: "bg-violet-200/80 dark:bg-violet-900/70 text-violet-900 dark:text-violet-200",
    dot: "bg-violet-400",
  },
};

export const TIME_PRESETS = [
  { label: "🌅 08:00", start: "08:00", end: "08:45" },
  { label: "☀️ 10:00", start: "10:00", end: "11:00" },
  { label: "🍱 13:00", start: "13:00", end: "14:00" },
  { label: "⚡ 16:00", start: "16:00", end: "17:00" },
  { label: "🌙 20:30", start: "20:30", end: "21:15" },
];

export const DURATION_CHIPS = [
  { label: "+30m", mins: 30 },
  { label: "+45m", mins: 45 },
  { label: "+1h", mins: 60 },
  { label: "+2h", mins: 120 },
];

export type AssignItemType = {
  id: string;
  goalId: string;
  title: string;
  goalTitle: string;
  isDaily: boolean;
  icon?: string;
  isFailed?: boolean;
  isOptional?: boolean;
  isCompleted?: boolean;
  isClaimed?: boolean;
  startTime?: string;
  endTime?: string;
  assignOrder?: number;
  isGoalItself?: boolean;
};

export type AssignDrag = {
  item: AssignItemType;
  sourceDay: string;
  targetDay: string;
  targetIndex: number;
  width: number;
  height: number;
  grabX: number;
  grabY: number;
  fresh: boolean;
};

export interface DayTaskItem {
  goalId: string;
  goalTitle: string;
  childTitle: string;
  dayLabel: string;
  icon: string;
  id: string;
  reward: number;
  isDaily: boolean;
  startTime?: string;
  endTime?: string;
  isOptional: boolean;
  isCompleted: boolean;
  isClaimed: boolean;
  isMainGoal: boolean;
}

export interface DayGraphStats {
  day: string;
  short: string;
  items: DayTaskItem[];
  total: number;
  done: number;
  claimed: number;
  dailyCount: number;
  weeklyCount: number;
  pct: number;
  claimedPct: number;
  isFullClear: boolean;
  totalSp: number;
  earnedSp: number;
  isToday: boolean;
}

export function getDailyTaskIcon(child: SubTask, goalTitle?: string): string {
  if (child.timeSlot === "day" || child.id.endsWith("-sun") || child.title.includes("☀️")) return "☀️";
  if (child.timeSlot === "night" || child.id.endsWith("-moon") || child.title.includes("🌙")) return "🌙";
  if (child.startTime) {
    const hour = parseInt(child.startTime.split(":")[0], 10);
    if (!isNaN(hour)) return hour >= 5 && hour < 18 ? "☀️" : "🌙";
  }
  if (goalTitle?.includes("☀️")) return "☀️";
  if (goalTitle?.includes("🌙")) return "🌙";
  return "";
}

export function addMinutesToTimeStr(timeStr: string, minutesToAdd: number): string {
  const base = timeStr || "09:00";
  const [hStr, mStr] = base.split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const total = (((h * 60 + m + minutesToAdd) % 1440) + 1440) % 1440;
  const nh = String(Math.floor(total / 60)).padStart(2, "0");
  const nm = String(total % 60).padStart(2, "0");
  return `${nh}:${nm}`;
}

export function findScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let el: HTMLElement | null = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return window;
}

export const sortAssignItems = (
  a: { startTime?: string; assignOrder?: number },
  b: { startTime?: string; assignOrder?: number }
) => {
  if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
  if (a.startTime) return -1;
  if (b.startTime) return 1;
  return (a.assignOrder || 0) - (b.assignOrder || 0);
};

export function clampDropIndex(
  others: AssignItemType[],
  index: number,
  dragged: { startTime?: string }
) {
  const timed = others.filter((i) => i.startTime);
  if (!dragged.startTime) return Math.max(index, timed.length);
  return timed.filter((i) => i.startTime! < dragged.startTime!).length;
}

export function AnimatedDropdown({
  value,
  options,
  onChange,
  buttonClassName = "",
  menuClassName = "",
  prefixIcon,
}: {
  value: string;
  options: { value: string; label: string; badge?: string }[];
  onChange: (val: string) => void;
  buttonClassName?: string;
  menuClassName?: string;
  prefixIcon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onOutside);
    return () => window.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative" data-nodrag>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 cursor-pointer transition-all ${buttonClassName}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {prefixIcon}
          <span className="truncate">{current?.label ?? value}</span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute left-0 top-full mt-1.5 min-w-[160px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar ${menuClassName}`}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  opt.value === value
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/80"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                      opt.value === value
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type DraggableCardProps = {
  id: string;
  disabled?: boolean;
  isDragging: boolean;
  className: string;
  onDragBegin: (id: string) => void;
  onDragMove: (id: string, clientX: number, clientY: number) => void;
  onDragFinish: () => void;
  children: React.ReactNode;
};

export const DraggableCard = React.forwardRef<HTMLDivElement, DraggableCardProps>(function DraggableCard(
  { id, disabled, className, onDragBegin, onDragMove, onDragFinish, children },
  ref
) {
  const controls = useDragControls();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const pressEvent = useRef<PointerEvent | null>(null);
  const armed = useRef(false);
  const didDrag = useRef(false);

  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (armed.current && e.cancelable) e.preventDefault();
    };
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, []);

  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    []
  );

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    const onGrip = !!target.closest("[data-card-handle]");
    if (!onGrip && target.closest("input, select, textarea, button, a, [data-nodrag]")) return;
    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      controls.start(e.nativeEvent);
      return;
    }
    if (onGrip) {
      armed.current = true;
      controls.start(e.nativeEvent);
      return;
    }
    pressStart.current = { x: e.clientX, y: e.clientY };
    pressEvent.current = e.nativeEvent;

    pressTimer.current = setTimeout(() => {
      if (!pressEvent.current) return;
      armed.current = true;
      window.getSelection()?.removeAllRanges();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
      controls.start(pressEvent.current);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pressTimer.current && pressStart.current) {
      const dx = Math.abs(e.clientX - pressStart.current.x);
      const dy = Math.abs(e.clientY - pressStart.current.y);
      if (dx > 8 || dy > 8) clearPress();
    }
  };

  const handlePointerEnd = () => {
    clearPress();
    armed.current = false;
  };

  return (
    <motion.div
      ref={ref}
      data-goal-id={id}
      layout
      drag={!disabled}
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.25)" }}
      onDragStart={() => {
        didDrag.current = true;
        onDragBegin(id);
      }}
      onDrag={(_, info) => onDragMove(id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
      onDragEnd={() => {
        armed.current = false;
        onDragFinish();
        setTimeout(() => {
          didDrag.current = false;
        }, 60);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(e) => {
        if (armed.current) e.preventDefault();
      }}
      onClickCapture={(e) => {
        if (didDrag.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export function SortableRow({
  value,
  hideControls,
  className,
  children,
}: {
  value: SubTask;
  hideControls?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.02,
        zIndex: 50,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      className={className}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className={`touch-none cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 p-1 -ml-1 shrink-0 self-center transition-opacity duration-200 ${
          hideControls ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </Reorder.Item>
  );
}

const collapsingVariants: Variants = {
  exit: (instant: boolean) => ({
    height: 0,
    marginBottom: 0,
    opacity: 0,
    transition: { duration: instant ? 0 : 0.18, ease: "easeOut" },
  }),
};

export function CollapsingRow({
  height,
  startOpen,
  children,
}: {
  height: number;
  startOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={collapsingVariants}
      initial={startOpen ? false : { height: 0, marginBottom: 0, opacity: 0 }}
      animate={{ height, marginBottom: ASSIGN_GAP, opacity: 1 }}
      exit="exit"
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="shrink-0 overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

export function DropSlot({ height, startOpen }: { height: number; startOpen?: boolean }) {
  return (
    <CollapsingRow height={height} startOpen={startOpen}>
      <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/40">
        <span className="text-xs font-bold text-indigo-400">Drop here</span>
      </div>
    </CollapsingRow>
  );
}