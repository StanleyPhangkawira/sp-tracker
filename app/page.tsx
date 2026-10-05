"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import type { Variants } from "framer-motion";
import { Plus, Settings2, Trash2, CheckCircle2, Circle, Sun, Moon, LayoutGrid, GripHorizontal, GripVertical, ChevronDown, ChevronUp, LayoutList, Coins, Target, Calendar, Map, Star, XOctagon, FoldVertical, UnfoldVertical, MoreHorizontal, X, ChevronLeft, ChevronRight, ArrowRightLeft, Clock, Check, ChevronsLeft, LogOut, EyeOff, Eye, Copy, CheckCheck } from "lucide-react";
import { useAppContext, Goal } from "../context/AppContext";

type SubTask = Goal["children"][number] & {
  startTime?: string;
  endTime?: string;
  assignOrder?: number;
};

const LONG_PRESS_MS = 300;
const jsDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const assignDays = ['Unorganized', ...jsDays];

/* ------------------------------------------------------------------ */
/*  DraggableCard (Main Goals Mode)                                   */
/* ------------------------------------------------------------------ */
type DraggableCardProps = {
  id: string; disabled?: boolean; isDragging: boolean; className: string;
  onDragBegin: (id: string) => void; onDragMove: (id: string, clientX: number, clientY: number) => void; onDragFinish: () => void;
  children: React.ReactNode;
};

const DraggableCard = React.forwardRef<HTMLDivElement, DraggableCardProps>(function DraggableCard(
  { id, disabled, className, onDragBegin, onDragMove, onDragFinish, children }, ref
) {
  const controls = useDragControls();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const pressEvent = useRef<PointerEvent | null>(null);
  const armed = useRef(false); 
  const didDrag = useRef(false);

  useEffect(() => {
    const block = (e: TouchEvent) => { if (armed.current && e.cancelable) e.preventDefault(); };
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, []);

  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); }, []);

  const clearPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); pressTimer.current = null; pressStart.current = null; };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const target = e.target as HTMLElement; const onGrip = !!target.closest("[data-card-handle]");
    if (!onGrip && target.closest("input, select, textarea, button, a, [data-nodrag]")) return;

    if (e.pointerType === "mouse") { if (e.button !== 0) return; controls.start(e.nativeEvent); return; }
    if (onGrip) { armed.current = true; controls.start(e.nativeEvent); return; }
    pressStart.current = { x: e.clientX, y: e.clientY }; pressEvent.current = e.nativeEvent;
    pressTimer.current = setTimeout(() => {
      if (!pressEvent.current) return; armed.current = true; window.getSelection()?.removeAllRanges();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
      controls.start(pressEvent.current);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pressTimer.current && pressStart.current) {
      const dx = Math.abs(e.clientX - pressStart.current.x); const dy = Math.abs(e.clientY - pressStart.current.y);
      if (dx > 8 || dy > 8) clearPress();
    }
  };

  const handlePointerEnd = () => { clearPress(); armed.current = false; };

  return (
    <motion.div ref={ref} data-goal-id={id} layout drag={!disabled} dragListener={false} dragControls={controls} dragSnapToOrigin dragMomentum={false} dragElastic={0}
      whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.25)" }}
      onDragStart={() => { didDrag.current = true; onDragBegin(id); }}
      onDrag={(_, info) => onDragMove(id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
      onDragEnd={() => { armed.current = false; onDragFinish(); setTimeout(() => { didDrag.current = false; }, 60); }}
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}
      onContextMenu={(e) => { if (armed.current) e.preventDefault(); }}
      onClickCapture={(e) => { if (didDrag.current) { e.stopPropagation(); e.preventDefault(); } }}
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }} className={className}
    >
      {children}
    </motion.div>
  );
});

function SortableRow({ value, hideControls, className, children }: { value: SubTask; hideControls?: boolean; className: string; children: React.ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item as="div" value={value} dragListener={false} dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} className={className}>
      <div onPointerDown={(e) => controls.start(e)} className={`touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 -ml-1 shrink-0 self-center transition-opacity duration-200 ${hideControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      {children}
    </Reorder.Item>
  );
}

function findScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let el: HTMLElement | null = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return window;
}

export type AssignItemType = {
  id: string; goalId: string; title: string; goalTitle: string; 
  isDaily: boolean; icon?: string; isFailed?: boolean; isOptional?: boolean;
  isCompleted?: boolean; isClaimed?: boolean;
  startTime?: string; endTime?: string; assignOrder?: number;
  isGoalItself?: boolean;
};

type AssignDrag = {
  item: AssignItemType; sourceDay: string; targetDay: string; targetIndex: number;
  width: number; height: number; grabX: number; grabY: number;
  fresh: boolean; 
};

const ASSIGN_GAP = 12;

const sortAssignItems = (a: { startTime?: string; assignOrder?: number }, b: { startTime?: string; assignOrder?: number }) => {
  if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
  if (a.startTime) return -1;
  if (b.startTime) return 1;
  return (a.assignOrder || 0) - (b.assignOrder || 0);
};

function clampDropIndex(others: AssignItemType[], index: number, dragged: { startTime?: string }) {
  const timed = others.filter(i => i.startTime);
  if (!dragged.startTime) return Math.max(index, timed.length);
  return timed.filter(i => i.startTime! < dragged.startTime!).length;
}

const collapsingVariants: Variants = {
  exit: (instant: boolean) => ({ height: 0, marginBottom: 0, opacity: 0, transition: { duration: instant ? 0 : 0.18, ease: "easeOut" } }),
};

function CollapsingRow({ height, startOpen, children }: { height: number; startOpen?: boolean; children: React.ReactNode }) {
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

function DropSlot({ height, startOpen }: { height: number; startOpen?: boolean }) {
  return (
    <CollapsingRow height={height} startOpen={startOpen}>
      <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60">
        <span className="text-xs font-bold text-blue-400">Drop here</span>
      </div>
    </CollapsingRow>
  );
}

type DropdownOption<T extends string> = { value: T; label: string; disabled?: boolean };

const GOAL_TYPE_OPTIONS: DropdownOption<"weekly" | "daily" | "list">[] = [
  { value: "weekly", label: "Weekly / Custom" },
  { value: "daily", label: "Daily" },
  { value: "list", label: "List (Progress)" },
];

function Dropdown<T extends string>({ value, options, onChange, title, align = "left", className = "", renderTrigger }: {
  value: T; options: DropdownOption<T>[]; onChange: (v: T) => void;
  title?: string; align?: "left" | "right"; className?: string; renderTrigger?: () => React.ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number; minWidth: number; maxHeight: number; flip: boolean } | null>(null);
  const open = pos !== null;
  const close = () => setPos(null);

  const openMenu = () => {
    const r = triggerRef.current!.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const minWidth = Math.max(r.width, 176);
    const estimate = Math.min(options.length * 36 + 8 + (title ? 28 : 0), 256);
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const flip = below < estimate && above > below;
    setPos({
      ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      ...(align === "right" ? { right: Math.max(8, vw - r.right) } : { left: Math.max(8, Math.min(r.left, vw - minWidth - 8)) }),
      minWidth, flip, maxHeight: Math.max(120, Math.min(256, flip ? above : below)),
    });
  };

  useEffect(() => {
    if (!open) return;
    const selected = options.findIndex(o => o.value === value && !o.disabled);
    const target = selected >= 0 ? selected : options.findIndex(o => !o.disabled);
    const raf = requestAnimationFrame(() => itemRefs.current[target]?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) close();
    };
    const onScroll = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); triggerRef.current?.focus(); return; }
    if (e.key === "Tab") { close(); return; }
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0);
    const at = enabled.indexOf(itemRefs.current.findIndex(el => el === document.activeElement));
    let next: number | undefined;
    if (e.key === "ArrowDown") next = enabled[(at + 1) % enabled.length];
    else if (e.key === "ArrowUp") next = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    itemRefs.current[next]?.focus();
  };

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <>
      <button
        ref={triggerRef} type="button" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
        className={renderTrigger
          ? className
          : `flex w-full items-center justify-between gap-2 p-2 text-left text-sm rounded-lg border bg-white text-gray-900 cursor-pointer outline-none transition-colors ${open ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"} ${className}`}
      >
        {renderTrigger ? renderTrigger() : (
          <>
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {pos && (
            <motion.div
              ref={menuRef} data-nodrag role="listbox" onKeyDown={onMenuKeyDown}
              initial={{ opacity: 0, y: pos.flip ? 4 : -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, minWidth: pos.minWidth, maxHeight: pos.maxHeight, transformOrigin: `${pos.flip ? "bottom" : "top"} ${align}` }}
              className="z-[200] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl ring-1 ring-black/5"
            >
              {title && <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</div>}
              {options.map((o, i) => {
                const selected = o.value === value;
                return (
                  <button
                    key={o.value} ref={(el) => { itemRefs.current[i] = el; }} type="button" role="option" aria-selected={selected} disabled={o.disabled}
                    onClick={() => { onChange(o.value); close(); triggerRef.current?.focus(); }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors ${
                      o.disabled ? "text-gray-300 cursor-not-allowed"
                      : selected ? "bg-blue-50 text-blue-600 font-semibold cursor-pointer"
                      : "text-gray-700 cursor-pointer hover:bg-gray-100 focus-visible:bg-gray-100"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {selected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

export default function TargetsPage() {
  const { goals, setGoals, setSpCoins } = useAppContext();
  const [openSettings, setOpenSettings] = useState<string | null>(null);

  const [columns, setColumns] = useState(2);
  const [mobileColumns, setMobileColumns] = useState(1);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [showRewards, setShowRewards] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [hideFinishedAssign, setHideFinishedAssign] = useState(false);
  const [mobileAssignIndex, setMobileAssignIndex] = useState(0);
  const swipeControls = useDragControls();
  const edgeDir = useRef(0);
  const edgeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [enableTimeSetting, setEnableTimeSetting] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);
  const [collapsedGoals, setCollapsedGoals] = useState<string[]>([]);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  // MAIN MODE DRAG STATE
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const swapLock = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // ASSIGN MODE DRAG STATE
  const [assignDrag, setAssignDrag] = useState<AssignDrag | null>(null);
  const assignDragRef = useRef<AssignDrag | null>(null);
  const assignPointer = useRef({ x: 0, y: 0 });
  const assignRafPending = useRef(false);
  const floatingCardRef = useRef<HTMLDivElement | null>(null);

  const triggerBigConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
  const triggerSmallConfetti = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth; const y = e.clientY / window.innerHeight;
    confetti({ particleCount: 50, spread: 60, origin: { x, y }, colors: ['#4ade80', '#eab308'] });
  };
  const triggerGlow = (id: string) => { setRecentlyCompleted(prev => [...prev, id]); setTimeout(() => setRecentlyCompleted(prev => prev.filter(item => item !== id)), 2000); };

  // MAIN MODE REORDER
  const reorderUnderPointer = () => {
    const dragId = draggingIdRef.current; if (!dragId || swapLock.current) return;
    const { x, y } = pointerRef.current;
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-goal-id]"));
    for (const el of cards) {
      const overId = el.dataset.goalId; if (!overId || overId === dragId) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        swapLock.current = true; setTimeout(() => { swapLock.current = false; }, 250);
        setGoals(prev => {
          const from = prev.findIndex(g => g.id === dragId); const to = prev.findIndex(g => g.id === overId);
          if (from < 0 || to < 0 || from === to) return prev;
          const next = [...prev]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
          return next;
        });
        break;
      }
    }
  };

  const handleDragBegin = (id: string) => { draggingIdRef.current = id; setDraggingId(id); };
  const handleDragMove = (_id: string, x: number, y: number) => { pointerRef.current = { x, y }; reorderUnderPointer(); };
  const handleDragFinish = () => { draggingIdRef.current = null; setDraggingId(null); swapLock.current = false; };

  useEffect(() => {
    const stop = () => { if (draggingIdRef.current) handleDragFinish(); };
    window.addEventListener("pointerup", stop); window.addEventListener("pointercancel", stop);
    return () => { window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); };
  }, []);

  useEffect(() => {
    if (!draggingId) return;
    const scroller = findScrollParent(gridRef.current); let raf = 0;
    const tick = () => {
      const y = pointerRef.current.y;
      const viewH = scroller === window ? window.innerHeight : (scroller as HTMLElement).getBoundingClientRect().bottom;
      const viewTop = scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const edge = 90; let dy = 0;
      if (y < viewTop + edge) dy = -Math.ceil((viewTop + edge - y) / 6); else if (y > viewH - edge) dy = Math.ceil((y - (viewH - edge)) / 6);
      if (dy !== 0) { if (scroller === window) window.scrollBy(0, dy); else (scroller as HTMLElement).scrollTop += dy; reorderUnderPointer(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draggingId]);

  // ACTIONS
  const addGoal = () => {
    const id = Date.now().toString();
    setGoals([{ id, title: "", type: "weekly", reward: 0, isCompleted: false, isClaimed: false, children: [] }, ...goals]);
    setEditingGoalId(id);
  };
  const updateGoal = (id: string, updates: any) => setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const addChildTask = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    const id = Date.now().toString();
    updateGoal(goalId, { children: [...goal.children, { id, title: "", reward: 0, isCompleted: false, isClaimed: false, assignedDays: [] }] });
    setEditingChildId(id);
    if (collapsedGoals.includes(goalId)) setCollapsedGoals(prev => prev.filter(gid => gid !== goalId));
  };
  const addMilestone = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    const newMilestones = [...(goal.milestones || []), { id: Date.now().toString(), at: 0, reward: 0, isClaimed: false, isOptional: false }].sort((a, b) => a.at - b.at);
    updateGoal(goalId, { milestones: newMilestones });
  };
  const addListItem = (goalId: string, title: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    const isChecked = goal.listHasCheckboxes === false ? true : false;
    updateGoal(goalId, { listItems: [...(goal.listItems || []), { id: Date.now().toString(), title, isCompleted: isChecked }] });
  };
  const toggleListItem = (goalId: string, itemId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    updateGoal(goalId, { listItems: goal.listItems?.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i) });
  };
  const deleteListItem = (goalId: string, itemId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    updateGoal(goalId, { listItems: goal.listItems?.filter(i => i.id !== itemId) });
  };

  const handleCopyList = (goalId: string, items: {title: string}[]) => {
    const text = items.map(i => i.title).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedListId(goalId);
    setTimeout(() => setCopiedListId(null), 2000);
  };

  const handleGoalCheck = (goal: Goal) => {
    if (goal.children.length === 0 && (goal.type !== 'list' || goal.milestones?.length === 0) && !goal.isClaimed && !goal.isFailed) {
      updateGoal(goal.id, { isCompleted: !goal.isCompleted });
    }
  };
  const handleChildCheck = (goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed && !child.isFailed) {
      updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isCompleted: !c.isCompleted } : c) });
    }
  };
  const claimChild = (e: React.MouseEvent, goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed && !child.isFailed) {
      updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isClaimed: true } : c) });
      setSpCoins(prev => prev + (child.reward || 0)); triggerSmallConfetti(e); triggerGlow(child.id);
    }
  };
  const claimMilestone = (e: React.MouseEvent, goal: Goal, milestoneId: string) => {
    const ms = goal.milestones?.find(m => m.id === milestoneId);
    const completedListCount = goal.listItems?.filter(i => goal.listHasCheckboxes === false ? true : i.isCompleted).length || 0;
    if (ms && !ms.isClaimed && completedListCount >= ms.at) {
      updateGoal(goal.id, { milestones: goal.milestones?.map(m => m.id === milestoneId ? { ...m, isClaimed: true } : m) });
      setSpCoins(prev => prev + (ms.reward || 0)); triggerSmallConfetti(e); triggerGlow(ms.id);
    }
  };
  const claimGoal = (e: React.MouseEvent, goal: Goal) => {
    if (!goal.isClaimed && !goal.isFailed) {
      updateGoal(goal.id, { isClaimed: true, isCompleted: true });
      setSpCoins(prev => prev + (goal.reward || 0)); triggerBigConfetti(); triggerGlow(goal.id);
    }
  };

  const generateDailyTasks = (goalId: string, frequency: 'once' | 'day-night') => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newChildren = frequency === 'once'
      ? days.map((day, i) => ({ id: `${Date.now()}-${i}`, title: day, reward: 0, isCompleted: false, assignedDays: [day] }))
      : days.flatMap((day, i) => [
          { id: `${Date.now()}-${i}-sun`, title: `${day}`, reward: 0, isCompleted: false, assignedDays: [day], startTime: "08:00" },
          { id: `${Date.now()}-${i}-moon`, title: `${day}`, reward: 0, isCompleted: false, assignedDays: [day], startTime: "20:00" }
        ]);
    updateGoal(goalId, { type: 'daily', frequency, children: newChildren, isCompleted: false });
  };

  const toggleCollapseAll = () => {
    if (collapsedGoals.length === goals.length && goals.length > 0) setCollapsedGoals([]);
    else setCollapsedGoals(goals.map(g => g.id));
  };

  // ASSIGN MODE DATA HELPER
  const getAssignItemsForDay = (day: string, source: Goal[] = goals) => {
    let items = source.flatMap(g => {
      if (g.isFailed) return [];
      if (g.type === 'daily') {
        const goalIcon = g.title.includes('☀️') ? '☀️' : g.title.includes('🌙') ? '🌙' : '';
        return g.children.filter(c => day !== 'Unorganized' && c.title.includes(day)).map(c => {
          let icon = goalIcon;
          if (!icon && c.startTime) icon = parseInt(c.startTime) >= 5 && parseInt(c.startTime) < 18 ? '☀️' : '🌙';
          return { ...c, goalId: g.id, goalTitle: g.title, isDaily: true, icon } as AssignItemType;
        });
      }

      const childrenItems = g.children.filter(c => {
        const assigned = c.assignedDays || [];
        return day === 'Unorganized' ? assigned.length === 0 : assigned.includes(day);
      }).map(c => ({ ...c, goalId: g.id, goalTitle: g.title, isDaily: false }) as AssignItemType);

      if (g.children.length === 0 && g.type !== 'list') {
        const assigned = (g as any).assignedDays || [];
        const matchDay = day === 'Unorganized' ? assigned.length === 0 : assigned.includes(day);
        if (matchDay) {
          return [{
            id: g.id,
            goalId: g.id,
            title: g.title || "Untitled Goal",
            goalTitle: "Main Goal",
            isDaily: false,
            isGoalItself: true,
            assignedDays: assigned,
            startTime: (g as any).startTime,
            endTime: (g as any).endTime,
            assignOrder: (g as any).assignOrder,
            isFailed: g.isFailed,
            isOptional: g.isOptional,
            isCompleted: g.isCompleted,
            isClaimed: g.isClaimed
          } as AssignItemType];
        }
      }

      return childrenItems;
    });
    
    if (hideFinishedAssign) {
      items = items.filter(i => !i.isCompleted && !i.isClaimed);
    }
    
    return items.sort(sortAssignItems);
  };

  const updateAssignItemTime = (item: AssignItemType, updates: { startTime?: string; endTime?: string; assignedDays?: string[] }) => {
    const g = goals.find(x => x.id === item.goalId);
    if (!g) return;
    if (item.isGoalItself) {
       updateGoal(g.id, updates);
    } else {
       updateGoal(g.id, { children: g.children.map(c => c.id === item.id ? { ...c, ...updates } : c) });
    }
  };

  // ASSIGN MODE DRAG LOGIC
  const computeAssignTarget = (x: number, y: number) => {
    const drag = assignDragRef.current; if (!drag) return null;

    let nearest: { el: HTMLElement; dist: number } | null = null;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-assign-day]"))) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const dist = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (!nearest || dist < nearest.dist) nearest = { el, dist };
    }
    if (!nearest || nearest.dist > 48) return null;

    const day = nearest.el.dataset.assignDay!;
    if (drag.item.isDaily && day !== drag.sourceDay) return null;

    const list = nearest.el.querySelector<HTMLElement>("[data-assign-list]");
    if (!list) return null;
    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-assign-item]"));

    const localY = y - list.getBoundingClientRect().top;
    let top = 0, index = 0, best = Infinity;
    for (let i = 0; i <= cards.length; i++) {
      const dist = Math.abs(localY - (top + drag.height / 2));
      if (dist < best) { best = dist; index = i; }
      if (i < cards.length) top += cards[i].offsetHeight + ASSIGN_GAP;
    }

    const others = getAssignItemsForDay(day).filter(i => i.id !== drag.item.id);
    return { day, index: clampDropIndex(others, index, drag.item) };
  };

  const beginAssignDrag = (e: React.PointerEvent, item: AssignItemType, day: string) => {
    const card = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-assign-item]");
    if (!card) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);

    if (e.pointerType !== "mouse") { try { document.documentElement.setPointerCapture(e.pointerId); } catch {} }

    const rect = card.getBoundingClientRect();
    assignPointer.current = { x: e.clientX, y: e.clientY };
    const next: AssignDrag = {
      item, sourceDay: day, targetDay: day,
      targetIndex: Math.max(0, getAssignItemsForDay(day).findIndex(i => i.id === item.id)),
      width: rect.width, height: rect.height, grabX: e.clientX - rect.left, grabY: e.clientY - rect.top,
      fresh: true,
    };
    assignDragRef.current = next;
    setAssignDrag(next);
  };

  const placeFloatingCard = () => {
    const el = floatingCardRef.current; const drag = assignDragRef.current;
    if (!el || !drag) return;
    el.style.transform = `translate3d(${assignPointer.current.x - drag.grabX}px, ${assignPointer.current.y - drag.grabY}px, 0) rotate(-2deg) scale(1.03)`;
  };

  const scheduleAssignUpdate = () => {
    if (assignRafPending.current) return;
    assignRafPending.current = true;
    requestAnimationFrame(() => {
      assignRafPending.current = false;
      const current = assignDragRef.current; if (!current) return;
      const hit = computeAssignTarget(assignPointer.current.x, assignPointer.current.y);
      if (!hit || (hit.day === current.targetDay && hit.index === current.targetIndex)) return;
      const next = { ...current, targetDay: hit.day, targetIndex: hit.index, fresh: false };
      assignDragRef.current = next;
      setAssignDrag(next);
    });
  };

  const moveAssignDrag = (x: number, y: number) => {
    if (!assignDragRef.current) return;
    assignPointer.current = { x, y };
    placeFloatingCard();
    updateEdgeSwitch(x);
    scheduleAssignUpdate();
  };

  const updateEdgeSwitch = (x: number) => {
    const drag = assignDragRef.current;
    const mobile = window.innerWidth < 768;
    const dir = !drag || !mobile || drag.item.isDaily ? 0 : x < 40 ? -1 : x > window.innerWidth - 40 ? 1 : 0;
    if (dir === edgeDir.current) return;
    edgeDir.current = dir;
    if (edgeTimer.current) clearInterval(edgeTimer.current);
    edgeTimer.current = dir ? setInterval(() => setMobileAssignIndex(i => Math.min(7, Math.max(0, i + dir))), 700) : null;
  };

  const cancelAssignDrag = () => {
    edgeDir.current = 0;
    if (edgeTimer.current) clearInterval(edgeTimer.current);
    edgeTimer.current = null;
    assignDragRef.current = null;
    setAssignDrag(null);
  };

  useEffect(() => {
    if (!assignDragRef.current) return;
    const t = setTimeout(scheduleAssignUpdate, 350); 
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileAssignIndex]);

  const endAssignDrag = () => {
    const drag = assignDragRef.current;
    cancelAssignDrag();
    if (!drag) return;
    const newDays = drag.targetDay === 'Unorganized' ? [] : [drag.targetDay];

    setGoals(prev => {
      const order = getAssignItemsForDay(drag.targetDay, prev).filter(i => i.id !== drag.item.id);
      order.splice(clampDropIndex(order, drag.targetIndex, drag.item), 0, drag.item);
      const orderMap: Record<string, number> = {};
      order.forEach((it, idx) => { orderMap[it.id] = idx; });

      return prev.map(g => {
        if (g.id === drag.item.id && drag.item.isGoalItself) {
           return { ...g, assignedDays: newDays, assignOrder: orderMap[g.id] };
        }
        return {
          ...g,
          children: g.children.map(c => {
            if (c.id === drag.item.id) return { ...c, assignedDays: newDays, assignOrder: orderMap[c.id] };
            return orderMap[c.id] !== undefined ? { ...c, assignOrder: orderMap[c.id] } : c;
          }),
        };
      });
    });
  };

  useEffect(() => {
    if (!assignDrag) return;
    const onMove = (e: PointerEvent) => moveAssignDrag(e.clientX, e.clientY);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancelAssignDrag(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endAssignDrag);
    window.addEventListener("pointercancel", cancelAssignDrag);
    window.addEventListener("scroll", scheduleAssignUpdate, { passive: true }); 
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endAssignDrag);
      window.removeEventListener("pointercancel", cancelAssignDrag);
      window.removeEventListener("scroll", scheduleAssignUpdate);
      window.removeEventListener("keydown", onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!assignDrag]);

  // -----------------------------------------------------------
  // APP-WIDE PROGRESS & SP CALCULATIONS
  // -----------------------------------------------------------
  let totalMustDoApp = 0; 
  let totalProgressApp = 0; 
  let totalFailedApp = 0;
  let totalSP = 0; 
  let claimedSP = 0;

  goals.forEach(goal => {
    totalSP += goal.reward || 0; 
    if (goal.isClaimed) claimedSP += goal.reward || 0;
    
    goal.children.forEach(c => { totalSP += c.reward || 0; if (c.isClaimed) claimedSP += c.reward || 0; });
    goal.milestones?.forEach(m => { totalSP += m.reward || 0; if (m.isClaimed) claimedSP += m.reward || 0; });

    if (goal.type === 'list') {
       if (!goal.isOptional) {
         totalMustDoApp += 1;
         const completedListCount = goal.listItems?.filter(i => goal.listHasCheckboxes === false ? true : i.isCompleted).length || 0;
         const frac = Math.min(1, completedListCount / (goal.targetCount || 1));
         totalProgressApp += frac;
         if (goal.isFailed) totalFailedApp += 1 - frac;
       }
    } else if (goal.children.length > 0) {
       const mustDo = goal.children.filter(c => !c.isOptional);
       totalMustDoApp += mustDo.length;
       totalProgressApp += mustDo.filter(c => c.isClaimed || c.isCompleted).length;
       totalFailedApp += mustDo.filter(c => c.isFailed && !c.isClaimed && !c.isCompleted).length;
    } else {
       if (!goal.isOptional) {
         totalMustDoApp += 1;
         if (goal.isClaimed || goal.isCompleted) totalProgressApp += 1;
         else if (goal.isFailed) totalFailedApp += 1;
       }
    }
  });

  const overallBluePct = totalMustDoApp === 0 ? 0 : Math.round((totalProgressApp / totalMustDoApp) * 100);
  const overallRedPct = totalMustDoApp === 0 ? 0 : Math.round((totalFailedApp / totalMustDoApp) * 100);

  // -----------------------------------------------------------
  // DAILY SUMMARY DATA
  // -----------------------------------------------------------
  const todayStr = jsDays[new Date().getDay()];
  const todayTasks = goals.flatMap(g => {
    if (g.isFailed) return [];
    if (g.type === 'daily') {
      return g.children.filter(c => c.title.includes(todayStr) && !c.isClaimed && !c.isFailed).map(c => {
         let icon = ''; 
         if (c.title.includes('☀️️') || (c.startTime && parseInt(c.startTime) >= 5 && parseInt(c.startTime) < 18)) icon = '☀️';
         if (c.title.includes('🌙') || (c.startTime && (parseInt(c.startTime) >= 18 || parseInt(c.startTime) < 5))) icon = '🌙';
         return { goalId: g.id, goalTitle: g.title, childTitle: g.title, icon, id: c.id, isDaily: true, startTime: c.startTime, endTime: c.endTime, isOptional: false, isCompleted: c.isCompleted, isMainGoal: false };
      });
    }

    const childrenTasks = g.children.filter(c => c.assignedDays?.includes(todayStr) && !c.isClaimed && !c.isFailed).map(c => ({ goalId: g.id, goalTitle: g.title, childTitle: c.title, icon: '', id: c.id, isDaily: false, startTime: c.startTime, endTime: c.endTime, isOptional: c.isOptional, isCompleted: c.isCompleted, isMainGoal: false }));
    
    if (g.children.length === 0 && g.type !== 'list') {
      if ((g as any).assignedDays?.includes(todayStr) && !g.isClaimed && !g.isFailed) {
          return [{ goalId: g.id, goalTitle: "Main Goal", childTitle: g.title || "Untitled Goal", icon: '', id: g.id, isDaily: false, startTime: (g as any).startTime, endTime: (g as any).endTime, isOptional: g.isOptional, isCompleted: g.isCompleted, isMainGoal: true }];
      }
    }
    
    return childrenTasks;
  });

  todayTasks.sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  const desktopColsMap: Record<number, string> = { 1: "md:columns-1", 2: "md:columns-2", 3: "md:columns-3", 4: "md:columns-4", 5: "md:columns-5" };
  const mobileColsMap: Record<number, string> = { 1: "columns-1", 2: "columns-2" };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pb-24 md:pt-10 overflow-hidden">
      <style>{`
        [data-goal-id] input, [data-goal-id] textarea { -webkit-user-select: text; user-select: text; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="time"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>

      {/* HEADER & OVERALL PROGRESS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Targets & Goals</h1>
          
          <div className="mt-3 flex flex-row items-center gap-4">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="24" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                {overallRedPct > 0 && (
                  <circle cx="32" cy="32" r="24" stroke="#f87171" strokeWidth="6" fill="none"
                    strokeDasharray="150.796"
                    strokeDashoffset={150.796 - ((overallBluePct + overallRedPct) / 100) * 150.796}
                    className="transition-all duration-500" />
                )}
                <circle cx="32" cy="32" r="24" stroke="#3b82f6" strokeWidth="6" fill="none"
                  strokeDasharray="150.796"
                  strokeDashoffset={150.796 - (overallBluePct / 100) * 150.796}
                  strokeLinecap="round"
                  className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-gray-700">{overallBluePct}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-sm font-bold text-gray-500">{totalMustDoApp} Total Action Items</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  {claimedSP} / {totalSP} <Coins size={14} className="text-yellow-600"/>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setIsAssignMode(!isAssignMode)} className={`px-4 py-2 rounded-xl border shadow-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${isAssignMode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>

<Map size={18} />
{isAssignMode ? <><LogOut size={18} /> Exit Assign</> : <> Assign</>}
          </button>

          {isAssignMode && (
            <>
              <button
                onClick={() => setHideFinishedAssign(!hideFinishedAssign)}
                className={`px-3.5 py-2 rounded-xl border shadow-sm font-bold text-xs md:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                  hideFinishedAssign 
                    ? 'bg-blue-100 text-blue-700 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title={hideFinishedAssign ? "Show finished tasks" : "Hide finished tasks"}
              >
                {hideFinishedAssign ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>Done: {hideFinishedAssign ? "Hidden" : "Shown"}</span>
              </button>

              <button
                onClick={() => setEnableTimeSetting(!enableTimeSetting)}
                className={`px-3.5 py-2 rounded-xl border shadow-sm font-bold text-xs md:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                  enableTimeSetting 
                    ? 'bg-lime-500 text-white border-lime-600' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title={enableTimeSetting ? "Hide time inputs" : "Show time inputs"}
              >
                <Clock size={16} />
                <span>Time: {enableTimeSetting ? "Enabled" : "Off"}</span>
              </button>
            </>
          )}
          
          <div className="hidden md:flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm ml-2">
            {!isAssignMode && (
              <>
                <button onClick={toggleCollapseAll} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer rounded-md hover:bg-gray-50" title="Toggle Collapse All">
                  {collapsedGoals.length === goals.length && goals.length > 0 ? <UnfoldVertical size={18} /> : <FoldVertical size={18} />}
                </button>
                <button onClick={() => setShowRewards(!showRewards)} className={`p-1.5 transition-colors cursor-pointer rounded-md ${showRewards ? 'bg-yellow-50 text-yellow-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`} title="Toggle View Rewards">
                  <Coins size={18} />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
              </>
            )}
            <button onClick={() => setShowTime(!showTime)} className={`p-1.5 transition-colors cursor-pointer rounded-md ${showTime ? 'bg-lime-50 text-lime-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`} title="Toggle View Time">
              <Clock size={18} />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <LayoutGrid size={18} className="text-gray-400 ml-1" />
            <span className="text-sm font-semibold text-gray-700 w-20">Cols: {columns}</span>
            <input type="range" min="1" max="5" value={columns} onChange={(e) => setColumns(Number(e.target.value))} className="w-24 cursor-pointer accent-blue-600" />
          </div>
          
          <div className={`${isAssignMode ? "hidden" : "flex md:hidden"} items-center gap-1.5 bg-white px-2 py-2 rounded-xl border border-gray-200 shadow-sm ml-auto`}>
            <button onClick={toggleCollapseAll} className="p-1.5 rounded-lg transition-colors cursor-pointer text-gray-400 hover:bg-gray-50" title="Toggle Collapse All">
              {collapsedGoals.length === goals.length && goals.length > 0 ? <UnfoldVertical size={16} /> : <FoldVertical size={16} />}
            </button>
            <button onClick={() => setShowRewards(!showRewards)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showRewards ? 'bg-yellow-50 text-yellow-600' : 'text-gray-400 hover:bg-gray-50'}`} title="Toggle View Rewards">
              <Coins size={16} />
            </button>
            <button onClick={() => setShowTime(!showTime)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showTime ? 'bg-lime-50 text-lime-600' : 'text-gray-400 hover:bg-gray-50'}`} title="Toggle View Time">
              <Clock size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
            <button onClick={() => setMobileColumns(1)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${mobileColumns === 1 ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutList size={16} /></button>
            <button onClick={() => setMobileColumns(2)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${mobileColumns === 2 ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {/* VIEW RENDERER */}
      {isAssignMode ? (
        <>
          {/* ASSIGN MODE PC VIEW (Pinterest-style masonry) */}
          <div className="hidden md:flex items-start gap-4 md:gap-6 select-none">
            {Array.from({ length: columns }, (_, col) => (
              <div key={col} className="flex-1 min-w-0 flex flex-col gap-4 md:gap-6">
                {assignDays.filter((_, i) => i % columns === col).map(day => {
                  const allItems = getAssignItemsForDay(day);
                  const isTarget = assignDrag?.targetDay === day;
                  const visibleItems = assignDrag ? allItems.filter(i => i.id !== assignDrag.item.id) : allItems;
                  const slot = isTarget && assignDrag ? Math.min(assignDrag.targetIndex, visibleItems.length) : -1;
                  const slotHeight = assignDrag?.height ?? 0;
                  const startOpen = !!assignDrag?.fresh;
                  const showEmptyHint = day !== 'Unorganized' && visibleItems.length === 0 && !isTarget;

                  return (
                    <div
                      key={day}
                      data-assign-day={day}
                      className={`w-full border shadow-sm rounded-2xl p-4 md:p-5 transition-colors duration-200 ${isTarget ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}
                    >
                      <h3 className="font-bold text-gray-800 text-lg mb-3 flex justify-between items-center">
                        {day} <span className="bg-gray-100 text-gray-500 text-sm font-semibold px-2.5 py-0.5 rounded-full">{allItems.length}</span>
                      </h3>

                      <div data-assign-list className="flex flex-col -mb-3">
                        <AnimatePresence initial={false} custom={!assignDrag}>
                          {visibleItems.flatMap((item, idx) => {
                            const isTimed = !!item.startTime;
                            const isDone = item.isCompleted || item.isClaimed;
                            return [
                              idx === slot && <DropSlot key={`slot-${idx}`} height={slotHeight} startOpen={startOpen} />,
                              <div
                                key={item.id}
                                data-assign-item
                                onPointerDown={(e) => {
                                  const target = e.target as HTMLElement;
                                  if (target.closest("input, select, textarea, button, a, [data-nodrag]")) return;
                                  beginAssignDrag(e, item, day);
                                }}
                                className={`mb-3 p-3 rounded-xl border text-sm transition-colors group select-none touch-none cursor-grab active:cursor-grabbing ${
                                  isDone 
                                    ? 'bg-gray-50 border-gray-200 opacity-70' 
                                    : isTimed
                                    ? 'bg-lime-50/90 border-lime-300 hover:border-lime-400 shadow-sm'
                                    : item.isDaily
                                    ? 'bg-blue-50 border-blue-100 hover:border-blue-200'
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                              >
                              <div className="flex items-start gap-2">
                                 <div
                                   onPointerDown={(e) => { e.stopPropagation(); beginAssignDrag(e, item, day); }}
                                   className="shrink-0 mt-0.5 touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
                                   title="Drag to assign"
                                 >
                                   <GripVertical size={16} />
                                 </div>
                                 <div className="flex-1 min-w-0 flex flex-col">
                                   {item.isDaily ? (
                                      <div className={`font-bold text-sm truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.goalTitle} {item.icon}</div>
                                   ) : (
                                      <>
                                        <div className="text-[10px] text-gray-400 font-bold mb-0.5 truncate uppercase tracking-wider">{item.goalTitle}</div>
                                        <div className={`font-semibold text-sm truncate ${item.isFailed ? 'text-red-400 line-through' : isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                          {item.isOptional && <Star size={12} className="inline mr-1 text-yellow-400 mb-0.5" />}
                                          {item.title}
                                        </div>
                                      </>
                                   )}
                                   
                                   {/* Time Display & Editing */}
                                   {isTimed ? (
                                      <div className="mt-2 flex items-center gap-1.5 flex-wrap" onPointerDown={(e) => e.stopPropagation()}>
                                        {showTime && (
                                          <button
                                            type="button"
                                            onClick={() => setEditingTimeId(editingTimeId === item.id ? null : item.id)}
                                            className={`border text-[10px] font-bold rounded px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors ${
                                              isDone ? 'bg-gray-200/80 border-gray-300 text-gray-600' : 'bg-lime-200/80 hover:bg-lime-300 border-lime-300 text-lime-900'
                                            }`}
                                            title="Click to edit or remove time"
                                          >
                                            <Clock size={11} className={isDone ? 'text-gray-500' : 'text-lime-700'} />
                                            <span>{item.startTime} {item.endTime ? `- ${item.endTime}` : ''}</span>
                                          </button>
                                        )}

                                        {editingTimeId === item.id && (
                                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-lime-300 shadow-sm animate-in fade-in z-10" data-nodrag>
                                            <input 
                                              type="time" value={item.startTime || ''} 
                                              onChange={(e) => updateAssignItemTime(item, { startTime: e.target.value })} 
                                              className="bg-gray-50 border border-gray-200 text-gray-700 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-lime-500 cursor-pointer" 
                                            />
                                            <span className="text-gray-400 text-xs">-</span>
                                            <input 
                                              type="time" value={item.endTime || ''} 
                                              onChange={(e) => updateAssignItemTime(item, { endTime: e.target.value })} 
                                              className="bg-gray-50 border border-gray-200 text-gray-700 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-lime-500 cursor-pointer" 
                                            />
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                updateAssignItemTime(item, { startTime: undefined, endTime: undefined });
                                                setEditingTimeId(null);
                                              }} 
                                              title="Remove time (make untimed)"
                                              className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer ml-0.5"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => setEditingTimeId(null)} 
                                              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                              title="Done"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                   ) : (
                                     <div className="mt-1 flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                                       {(enableTimeSetting || editingTimeId === item.id) ? (
                                         <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 animate-in fade-in" data-nodrag>
                                           <Clock size={11} className="text-gray-400 ml-0.5" />
                                           <input 
                                             type="time" value={item.startTime || ''} 
                                             onChange={(e) => updateAssignItemTime(item, { startTime: e.target.value })} 
                                             className="bg-white border border-gray-200 text-gray-700 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-blue-400 cursor-pointer" 
                                           />
                                           <span className="text-gray-400 text-xs">-</span>
                                           <input 
                                             type="time" value={item.endTime || ''} 
                                             onChange={(e) => updateAssignItemTime(item, { endTime: e.target.value })} 
                                             className="bg-white border border-gray-200 text-gray-700 text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-blue-400 cursor-pointer" 
                                           />
                                           {editingTimeId === item.id && (
                                             <button type="button" onClick={() => setEditingTimeId(null)} className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer">
                                               <X size={12} />
                                             </button>
                                           )}
                                         </div>
                                       ) : (
                                         <button 
                                           type="button"
                                           onClick={() => setEditingTimeId(item.id)}
                                           className="text-gray-400 hover:text-lime-700 hover:bg-lime-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                           title="Add time to task"
                                         >
                                           <Clock size={11} />
                                           <span>Add time</span>
                                         </button>
                                       )}
                                     </div>
                                   )}

                                 </div>
                              </div>
                              </div>,
                            ];
                          })}
                          {slot === visibleItems.length && <DropSlot key={`slot-${slot}`} height={slotHeight} startOpen={startOpen} />}
                          {showEmptyHint && (
                            <CollapsingRow key="empty-hint" height={120}>
                              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <p className="text-xs text-gray-400 font-medium">Drop tasks here</p>
                              </div>
                            </CollapsingRow>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Floating drag card (PC). */}
          {assignDrag && (
            <div
              ref={(el) => { floatingCardRef.current = el; if (el) placeFloatingCard(); }}
              className="fixed left-0 top-0 z-[100] pointer-events-none will-change-transform"
              style={{ width: assignDrag.width }}
            >
              <div className={`w-full p-3 rounded-xl border shadow-2xl text-sm ${
                assignDrag.item.startTime
                  ? 'bg-lime-50 border-lime-300 ring-2 ring-lime-400/40'
                  : assignDrag.item.isDaily
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start gap-2">
                  <GripVertical size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-wider">{assignDrag.item.goalTitle}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1 shrink-0">

<Map size={9} />
From {assignDrag.sourceDay}
                      </span>
                    </div>
                    <div className="font-semibold text-sm truncate text-gray-800">{assignDrag.item.title || assignDrag.item.goalTitle}</div>
                    {showTime && assignDrag.item.startTime && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="bg-lime-200/80 border border-lime-300 text-lime-900 text-[10px] font-bold rounded px-1.5 py-0.5 flex items-center gap-1">
                          <Clock size={11} className="text-lime-700" />
                          {assignDrag.item.startTime} {assignDrag.item.endTime ? `- ${assignDrag.item.endTime}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGN MODE MOBILE VIEW (Swipeable Carousel) */}
          <div className="md:hidden flex flex-col w-full overflow-hidden">
             <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-200 mb-6 sticky top-4 z-10">
                <button onClick={() => setMobileAssignIndex(prev => Math.max(0, prev - 1))} className={`p-2 transition-opacity ${mobileAssignIndex === 0 ? 'opacity-30' : 'opacity-100'}`} disabled={mobileAssignIndex === 0}><ChevronLeft/></button>
                <div className="flex flex-col items-center">
                   <h3 className="font-bold text-lg text-gray-800">{assignDays[mobileAssignIndex]}</h3>
                   <div className="flex gap-1 mt-1">
                     {assignDays.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === mobileAssignIndex ? 'bg-blue-600' : 'bg-gray-200'}`}/>)}
                   </div>
                </div>
                <button onClick={() => setMobileAssignIndex(prev => Math.min(7, prev + 1))} className={`p-2 transition-opacity ${mobileAssignIndex === 7 ? 'opacity-30' : 'opacity-100'}`} disabled={mobileAssignIndex === 7}><ChevronRight/></button>
             </div>

             <AnimatePresence mode="wait">
               <motion.div
                 key={mobileAssignIndex}
                 initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.2 }}
                 data-assign-day={assignDays[mobileAssignIndex]}
                 drag="x" dragListener={false} dragControls={swipeControls} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                 onPointerDown={(e) => { if (!(e.target as HTMLElement).closest("input, select, textarea, button, a, [data-nodrag]")) swipeControls.start(e); }}
                 onDragEnd={(e, info) => {
                   if (info.offset.x < -50 && mobileAssignIndex < 7) setMobileAssignIndex(prev => prev + 1);
                   else if (info.offset.x > 50 && mobileAssignIndex > 0) setMobileAssignIndex(prev => prev - 1);
                 }}
                 className="min-h-[50vh] pt-2 touch-pan-y"
               >
                 {(() => {
                   const day = assignDays[mobileAssignIndex];
                   const items = getAssignItemsForDay(day);
                   const visibleItems = assignDrag ? items.filter(i => i.id !== assignDrag.item.id) : items;
                   const isTarget = assignDrag?.targetDay === day;
                   const slot = isTarget && assignDrag ? Math.min(assignDrag.targetIndex, visibleItems.length) : -1;
                   const slotHeight = assignDrag?.height ?? 0;
                   const startOpen = !!assignDrag?.fresh;

                   return (
                     <div data-assign-list className="flex flex-col -mb-3">
                       <AnimatePresence initial={false} custom={!assignDrag}>
                       {visibleItems.flatMap((item, idx) => {
                         const isTimed = !!item.startTime;
                         const isDone = item.isCompleted || item.isClaimed;
                         return [
                           idx === slot && <DropSlot key={`slot-${idx}`} height={slotHeight} startOpen={startOpen} />,
                           <div 
                             key={item.id} 
                             data-assign-item
                             className={`mb-3 p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 shadow-sm transition-colors ${
                               isDone 
                                 ? 'bg-gray-50 border-gray-200 opacity-70'
                                 : isTimed 
                                 ? 'bg-lime-50 border-lime-300' 
                                 : item.isDaily 
                                 ? 'bg-blue-50 border-blue-100' 
                                 : 'bg-white border-gray-200'
                             }`}
                           >
                             <div
                               data-nodrag
                               onPointerDown={(e) => beginAssignDrag(e, item, day)}
                               className="shrink-0 self-center -ml-1.5 p-1.5 touch-none cursor-grab active:cursor-grabbing text-gray-300 active:text-gray-500"
                               title="Hold and drag to move"
                             >
                               <GripVertical size={20} />
                             </div>
                             <div className="flex-1 min-w-0">
                                {item.isDaily ? (
                                   <div className={`font-bold text-base truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.goalTitle} {item.icon}</div>
                                ) : (
                                   <>
                                     <div className="text-[10px] text-gray-400 font-bold mb-0.5 truncate uppercase tracking-wider">{item.goalTitle}</div>
                                     <div className={`font-semibold text-base truncate ${item.isFailed ? 'text-red-400 line-through' : isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                       {item.isOptional && <Star size={12} className="inline mr-1 text-yellow-400 mb-0.5" />}
                                       {item.title}
                                     </div>
                                   </> 
                                )}
                                
                                {/* Mobile Time UI */}
                                {isTimed ? (
                                   <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                     {showTime && (
                                       <span className={`border text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${isDone ? 'bg-gray-200/80 border-gray-300 text-gray-600' : 'bg-lime-200/80 border-lime-300 text-lime-900'}`}>
                                         <Clock size={12} className={isDone ? 'text-gray-500' : 'text-lime-700'} />
                                         {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                                       </span>
                                     )}
                                     <button 
                                       type="button"
                                       onClick={() => setEditingTimeId(editingTimeId === item.id ? null : item.id)}
                                       className="text-xs text-lime-800 underline font-semibold cursor-pointer"
                                     >
                                       {editingTimeId === item.id ? "Close" : "Edit"}
                                     </button>
                                     {editingTimeId === item.id && (
                                       <button 
                                         type="button"
                                         onClick={() => {
                                           updateAssignItemTime(item, { startTime: undefined, endTime: undefined });
                                           setEditingTimeId(null);
                                         }}
                                         className="text-xs text-red-500 font-semibold cursor-pointer flex items-center gap-0.5"
                                       >
                                         <Trash2 size={12}/> Clear
                                       </button>
                                     )}
                                   </div>
                                ) : (
                                   (!enableTimeSetting && editingTimeId !== item.id) && (
                                     <div className="mt-2">
                                       <button 
                                         type="button"
                                         onClick={() => setEditingTimeId(item.id)}
                                         className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 cursor-pointer"
                                       >
                                         <Clock size={12} /> Add time
                                       </button>
                                     </div>
                                   )
                                )}

                                {/* Mobile Time Inputs */}
                                {((!isTimed && enableTimeSetting) || editingTimeId === item.id) && (
                                  <div className="mt-3 flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-gray-200 animate-in fade-in">
                                    <Clock size={14} className="text-gray-400" />
                                    <input 
                                      type="time" value={item.startTime || ''} 
                                      onChange={(e) => updateAssignItemTime(item, { startTime: e.target.value })} 
                                      className="bg-white border border-gray-200 text-gray-700 text-xs rounded px-2 py-1 outline-none w-20 text-center cursor-pointer" 
                                    />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <input 
                                      type="time" value={item.endTime || ''} 
                                      onChange={(e) => updateAssignItemTime(item, { endTime: e.target.value })} 
                                      className="bg-white border border-gray-200 text-gray-700 text-xs rounded px-2 py-1 outline-none w-20 text-center cursor-pointer" 
                                    />
                                    {editingTimeId === item.id && !isTimed && (
                                      <button type="button" onClick={() => setEditingTimeId(null)} className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer">
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                             </div>
                           
                           {!item.isDaily && (
                             <div className="shrink-0 self-center">
                               <Dropdown
                                 title="Move to" align="right" value={day}
                                 options={assignDays.map(d => ({ value: d, label: d, disabled: d === day }))}
                                 onChange={(d) => {
                                   const newDays = d === 'Unorganized' ? [] : [d];
                                   updateAssignItemTime(item, { assignedDays: newDays });
                                 }}
                                 className="bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer outline-none"
                                 renderTrigger={() => <><ArrowRightLeft size={14}/> Move</>}
                               />
                             </div>
                           )}
                         </div>,
                        ];
                      })}
                       {slot === visibleItems.length && <DropSlot key={`slot-${slot}`} height={slotHeight} startOpen={startOpen} />}
                       {day !== 'Unorganized' && visibleItems.length === 0 && !isTarget && (
                          <CollapsingRow key="empty-hint" height={96}>
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 text-gray-400 font-medium text-sm">
                               No tasks for this day
                            </div>
                          </CollapsingRow>
                       )}
                       </AnimatePresence>
                     </div>
                   );
                 })()}
               </motion.div>
             </AnimatePresence>
          </div>
        </>
      ) : (
        // NORMAL GRID VIEW (Masonry)
        <div ref={gridRef} className={`${mobileColsMap[mobileColumns]} ${desktopColsMap[columns]} gap-4 md:gap-6 relative`}>
          
          {/* Pinned Card 1: Today's Summary */}
          <div className="break-inside-avoid inline-block w-full bg-[#f4f8ff] rounded-2xl shadow-sm border border-blue-100 p-4 md:p-5 mb-4 md:mb-6 cursor-default" data-nodrag>
             <h2 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2"><Calendar size={20} className="text-blue-500" /> Today's Summary ({todayStr})</h2>
             {todayTasks.length > 0 ? (
               <ul className="flex flex-col gap-2">
                 {todayTasks.map(t => (
                   <li key={t.id} className="bg-white border border-blue-50 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:bg-blue-50/50 transition-colors">
                     <div className="flex items-center gap-3 min-w-0">
                       <button 
                         onClick={() => {
                            const goal = goals.find(g => g.id === t.goalId);
                            if (!goal) return;
                            if (t.isMainGoal) handleGoalCheck(goal);
                            else handleChildCheck(goal, t.id);
                         }}
                         className="flex items-center shrink-0 transition-transform cursor-pointer hover:scale-110"
                       >
                         {t.isCompleted ? <CheckCircle2 size={22} className="text-blue-500" /> : <Circle size={22} className="text-gray-300 hover:text-blue-400" />}
                       </button>
                       <div className="flex flex-col justify-center min-w-0">
                         {t.isDaily ? (
                            <span className={`text-sm font-bold truncate ${t.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.childTitle} {t.icon}</span>
                         ) : (
                            <>
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">{t.goalTitle}</span>
                              <span className={`text-sm font-semibold truncate ${t.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {t.isOptional && <Star size={12} className="inline mr-1 text-yellow-400 mb-0.5" />}
                                {t.childTitle}
                              </span>
                            </>
                         )}
                       </div>
                     </div>
                     {showTime && t.startTime && (
                       <div className="shrink-0 text-[10px] md:text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1 border border-blue-200">
                         <Clock size={12} /> {t.startTime} {t.endTime && `- ${t.endTime}`}
                       </div>
                     )}
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-sm text-blue-400/80 font-medium italic bg-white p-3 rounded-xl border border-blue-50 text-center shadow-sm">No tasks assigned for today. Enjoy your day!</p>
             )}
          </div>

          {/* Pinned Card 2: Add New Goal */}
          <button 
            onClick={addGoal} 
            className="break-inside-avoid w-full bg-white border-2 border-dashed border-gray-300 text-gray-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer mb-4 md:mb-6" 
            data-nodrag
          >
            <Plus size={20} />
            <span className="text-base leading-none">Add New Goal</span>
          </button>

          {/* Draggable Goal Cards */}
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const hasChildren = goal.type !== 'list' && goal.children.length > 0;
              const hasMilestones = goal.type === 'list' && (goal.milestones?.length || 0) > 0;
              
              const mustDoChildren = hasChildren ? goal.children.filter(c => !c.isOptional) : [];
              const allMandatoryClaimed = hasChildren && (mustDoChildren.length === 0 || mustDoChildren.every(c => c.isClaimed));
              const allMilestonesClaimed = hasMilestones && goal.milestones?.every(m => m.isClaimed);
              const completedListCount = goal.listItems?.filter(i => goal.listHasCheckboxes === false ? true : i.isCompleted).length || 0;

              let bluePct = 0; let redPct = 0;
              if (goal.type === 'list') {
                bluePct = Math.min(100, Math.round((completedListCount / (goal.targetCount || 1)) * 100));
                if (goal.isFailed) redPct = 100 - bluePct;
              } else if (hasChildren) {
                if (mustDoChildren.length > 0) {
                  bluePct = Math.min(100, Math.round((mustDoChildren.filter(c => c.isClaimed).length / mustDoChildren.length) * 100));
                  redPct = Math.min(100, Math.round((mustDoChildren.filter(c => c.isFailed && !c.isClaimed).length / mustDoChildren.length) * 100));
                } else {
                  if (goal.isFailed) redPct = 100; else if (goal.isClaimed) bluePct = 100;
                }
              } else {
                if (goal.isFailed) redPct = 100; else if (goal.isClaimed) bluePct = 100;
              }

              const canClaimMain = (!hasChildren && !hasMilestones && goal.isCompleted && !goal.isClaimed && !goal.isFailed) || 
                                   (hasChildren && allMandatoryClaimed && !goal.isClaimed && !goal.isFailed) || 
                                   (goal.type === 'list' && bluePct >= 100 && allMilestonesClaimed && !goal.isClaimed && !goal.isFailed);

              return (
                <DraggableCard
                  key={goal.id} id={goal.id} disabled={goal.isClaimed} isDragging={draggingId === goal.id}
                  onDragBegin={handleDragBegin} onDragMove={handleDragMove} onDragFinish={handleDragFinish}
                  className={`break-inside-avoid inline-block w-full bg-white rounded-2xl shadow-sm border p-4 md:p-5 relative select-none mb-4 md:mb-6 [-webkit-touch-callout:none]
                    ${goal.isFailed ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}
                    ${goal.isClaimed ? 'opacity-75 bg-gray-50/50 cursor-default' : 'md:cursor-grab md:active:cursor-grabbing'}
                    ${recentlyCompleted.includes(goal.id) ? 'ring-2 ring-green-400 shadow-xl z-10' : 'hover:shadow-md'}
                  `}
                >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-[140px] w-full">
                        {!hasChildren && !hasMilestones && (
                          <button onClick={() => handleGoalCheck(goal)} disabled={goal.isClaimed || goal.isFailed} className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${(goal.isClaimed || goal.isFailed) ? 'cursor-not-allowed' : 'hover:scale-110'}`}>
                            {goal.isClaimed ? <CheckCircle2 size={24} className="text-gray-300 md:w-7 md:h-7" /> : goal.isCompleted ? <CheckCircle2 size={24} className="text-blue-500 md:w-7 md:h-7" /> : <Circle size={24} className={`${goal.isFailed ? 'text-red-300' : 'text-gray-300'} md:w-7 md:h-7`} />}
                          </button>
                        )}
                        <div className="flex-1">
                           {editingGoalId === goal.id ? (
                             <input type="text" placeholder="New Goal" value={goal.title} autoFocus disabled={goal.isClaimed} onChange={(e) => updateGoal(goal.id, { title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setEditingGoalId(null)} onBlur={() => setEditingGoalId(null)} className="font-semibold text-lg md:text-xl bg-transparent outline-none w-full border-b border-blue-400 text-gray-900 mt-0.5 md:mt-0" />
                           ) : (
                             <div className="flex flex-wrap items-center gap-2">
                               <span onClick={() => !goal.isClaimed && setEditingGoalId(goal.id)} className={`font-semibold text-lg md:text-xl cursor-text line-clamp-2 break-words mt-0.5 md:mt-0 ${goal.isClaimed ? 'text-gray-400 line-through' : goal.isFailed ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                                 {goal.isOptional && <Star size={20} className="inline mr-1 text-yellow-400 mb-1" />}
                                 {goal.title || "New Goal"}
                               </span>
                               <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-gray-100 text-gray-500 shrink-0">{goal.type}</span>
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto mt-0.5">
                        {showRewards && goal.reward > 0 && !goal.isClaimed && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-1 rounded flex items-center gap-1"><Coins size={12} /> {goal.reward}</span>
                        )}
                        <div className="flex items-center gap-1.5 md:gap-2">
                          {canClaimMain && (
                            <button onClick={(e) => claimGoal(e, goal)} className="text-[10px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full whitespace-nowrap animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:scale-105 transition-transform cursor-pointer">
                              ✨ CLAIM
                            </button>
                          )}
                          {goal.isClaimed && (<button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={18} /></button>)}
                          {!goal.isClaimed && (<button onClick={() => setOpenSettings(openSettings === goal.id ? null : goal.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer"><Settings2 size={18} /></button>)}
                          {!goal.isClaimed && (
                            <div data-card-handle className="touch-none p-1.5 -mr-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing" title="Drag to move">
                              <GripHorizontal size={18} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Settings Dropdown */}
                    <div className={`grid transition-all duration-300 ease-in-out ${openSettings === goal.id && !goal.isClaimed ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden" data-nodrag>
                        <div className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 grid gap-3 md:gap-4 grid-cols-2">
                          <div>
                            <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Type</label>
                            <Dropdown className="mt-1" value={goal.type} options={GOAL_TYPE_OPTIONS} onChange={(type) => updateGoal(goal.id, { type })} />
                          </div>
                          <div>
                            <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Reward</label>
                            <input type="number" placeholder="0" value={goal.reward === 0 ? '' : goal.reward} onChange={(e) => updateGoal(goal.id, { reward: Number(e.target.value) })} className="block w-full mt-1 p-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400" />
                          </div>

                          <div className="col-span-2 flex gap-4 pt-2 border-t border-gray-200">
                             <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                               <input type="checkbox" checked={!!goal.isOptional} onChange={(e) => updateGoal(goal.id, { isOptional: e.target.checked })} className="accent-yellow-500 w-3.5 h-3.5 cursor-pointer" />
                               Mark as Optional
                             </label>
                             <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                               <input type="checkbox" checked={!!goal.isFailed} onChange={(e) => updateGoal(goal.id, { isFailed: e.target.checked })} className="accent-red-500 w-3.5 h-3.5 cursor-pointer" />
                               Mark as Failed
                             </label>
                          </div>

                          {goal.type === 'list' && (
                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                              <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Target Count</label>
                              <input type="number" placeholder="70" value={goal.targetCount === 0 ? '' : (goal.targetCount || '')} onChange={(e) => updateGoal(goal.id, { targetCount: Number(e.target.value) })} className="block w-full mt-1 mb-3 p-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400" />

                              <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Milestones</label>
                              <div className="space-y-2 mt-1 border-l-2 border-blue-200 pl-3">
                                {goal.milestones?.map(m => (
                                  <div key={m.id} className="flex gap-2 items-center flex-wrap">
                                    <span className="text-xs text-gray-700 font-bold">At</span>
                                    <input type="number" placeholder="0" value={m.at === 0 ? '' : m.at} onChange={(e) => updateGoal(goal.id, { milestones: goal.milestones?.map(mx => mx.id === m.id ? { ...mx, at: Number(e.target.value) } : mx).sort((a, b) => a.at - b.at) })} className="w-12 p-1.5 text-xs rounded border border-gray-300 text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500" />
                                    <span className="text-xs text-gray-700 font-bold">SP</span>
                                    <input type="number" placeholder="0" value={m.reward === 0 ? '' : m.reward} onChange={(e) => updateGoal(goal.id, { milestones: goal.milestones?.map(mx => mx.id === m.id ? { ...mx, reward: Number(e.target.value) } : mx) })} className="w-12 p-1.5 text-xs rounded border border-gray-300 text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500" />
                                    
                                    <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer ml-1">
                                      <input type="checkbox" checked={!!m.isOptional} onChange={(e) => updateGoal(goal.id, { milestones: goal.milestones?.map(mx => mx.id === m.id ? { ...mx, isOptional: e.target.checked } : mx) })} className="accent-yellow-500 w-3 h-3 cursor-pointer" /> Opt
                                    </label>
                                    
                                    <button onClick={() => updateGoal(goal.id, { milestones: goal.milestones?.filter(mx => mx.id !== m.id) })} className="text-red-400 hover:text-red-600 ml-auto cursor-pointer"><Trash2 size={14} /></button>
                                  </div>
                                ))}
                                <button onClick={() => addMilestone(goal.id)} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:underline mt-2 cursor-pointer"><Plus size={12} /> Add Milestone</button>
                              </div>

                              <label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-700 uppercase mt-4 cursor-pointer">
                                <input type="checkbox" checked={goal.listHasCheckboxes !== false} onChange={(e) => updateGoal(goal.id, { listHasCheckboxes: e.target.checked })} className="accent-blue-600 w-3 h-3 cursor-pointer" />
                                Require Checkboxes
                              </label>
                            </div>
                          )}
                          {goal.type === 'daily' && (
                            <div className="col-span-2 flex flex-col md:flex-row gap-2">
                              <button onClick={() => generateDailyTasks(goal.id, 'once')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-xs md:text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 cursor-pointer">Once a Day</button>
                              <button onClick={() => generateDailyTasks(goal.id, 'day-night')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-xs md:text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-1 cursor-pointer">Day & Night <Sun size={14} /><Moon size={14} /></button>
                            </div>
                          )}
                          <div className="col-span-2 flex justify-end mt-1">
                            <button onClick={() => deleteGoal(goal.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer"><Trash2 size={16} /> Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(hasChildren || goal.type === 'list') && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] md:text-xs text-gray-500 mb-1 font-medium"><span>{bluePct === 100 ? 'Completed' : 'Progress'}</span><span>{bluePct}%</span></div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2 overflow-hidden flex">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${bluePct}%` }}></div>
                            <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${redPct}%` }}></div>
                          </div>
                        </div>
                        <button onClick={() => setCollapsedGoals(prev => prev.includes(goal.id) ? prev.filter(id => id !== goal.id) : [...prev, goal.id])} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-1 rounded-md shrink-0 border border-gray-100 bg-gray-50 cursor-pointer">
                          {collapsedGoals.includes(goal.id) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                      </div>
                    )}

                    {/* List UI */}
                    {goal.type === 'list' && (
                      <AnimatePresence>
                        {!collapsedGoals.includes(goal.id) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden" data-nodrag>
                            <div className="mt-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100 shadow-inner">
                              <div className="flex items-center gap-2 mb-3">
                                <input type="text" placeholder="Add list item" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addListItem(goal.id, e.currentTarget.value.trim()); e.currentTarget.value = ''; } }} className="flex-1 p-2 text-sm rounded-lg border border-gray-300 text-gray-900 outline-none focus:border-blue-500 placeholder-gray-400 bg-white" />
                                <button 
                                  onClick={() => handleCopyList(goal.id, goal.listItems || [])}
                                  className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
                                  title="Copy all items to clipboard"
                                >
                                  {copiedListId === goal.id ? <CheckCheck size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1.5 rounded-md border border-gray-200 shrink-0">{completedListCount} / {goal.targetCount || 10}</span>
                              </div>

                              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {goal.listItems?.map(item => (
                                  <div key={item.id} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm transition-colors hover:bg-gray-50">
                                    {goal.listHasCheckboxes !== false && (
                                      <button onClick={() => toggleListItem(goal.id, item.id)} className={`flex items-center h-4 md:h-5 shrink-0 cursor-pointer ${item.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-blue-400'}`}>
                                        {item.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                      </button>
                                    )}
                                    <span className={`text-xs md:text-sm flex-1 break-words line-clamp-2 ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.title}</span>
                                    <button onClick={() => deleteListItem(goal.id, item.id)} className="text-gray-300 hover:text-red-500 p-0.5 cursor-pointer"><Trash2 size={14} /></button>
                                  </div>
                                ))}
                                {(!goal.listItems || goal.listItems.length === 0) && <p className="text-xs text-gray-400 text-center italic py-2">No items yet.</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Milestones List */}
                    {hasMilestones && (
                      <AnimatePresence>
                        {!collapsedGoals.includes(goal.id) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
                              {goal.milestones?.map((m) => {
                                const isReached = completedListCount >= m.at;
                                return (
                                  <div key={m.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-all duration-300 ${recentlyCompleted.includes(m.id) ? 'scale-[1.02] ring-1 ring-green-400 bg-green-50 shadow-sm' : m.isClaimed ? 'bg-gray-100/50' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                      <Target size={16} className={m.isClaimed ? "text-gray-300" : isReached ? "text-green-500" : "text-blue-400"} />
                                      <span className={`text-xs md:text-sm font-bold ${m.isClaimed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {m.isOptional && <Star size={12} className="inline mr-1 text-yellow-400" />} Reach {m.at}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!m.isClaimed && !isReached && showRewards && (
                                        <div className="flex items-center bg-yellow-100 px-1.5 py-0.5 rounded shrink-0 gap-1">
                                          <Coins size={10} className="text-yellow-700" />
                                          <span className="text-yellow-700 text-[10px] md:text-xs font-bold">{m.reward}</span>
                                        </div>
                                      )}
                                      {isReached && !m.isClaimed && (
                                        <button onClick={(e) => claimMilestone(e, goal, m.id)} className="shrink-0 text-[9px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)] hover:scale-105 transition-transform cursor-pointer">
                                          ✨ CLAIM {m.reward}
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
                      <AnimatePresence>
                        {!collapsedGoals.includes(goal.id) && (
                          <Reorder.Group axis="y" as="div" values={goal.children} onReorder={(newChildren) => updateGoal(goal.id, { children: newChildren })} className="overflow-hidden mt-3 md:mt-4 space-y-2 md:space-y-3" data-nodrag>
                            {goal.children.map((child: SubTask) => (
                              <SortableRow
                                key={child.id} value={child} hideControls={expandedChildId === child.id}
                                className={`flex items-center gap-1 md:gap-2 p-1.5 md:p-2 rounded-lg transition-colors duration-300 ${recentlyCompleted.includes(child.id) ? 'scale-[1.02] ring-1 ring-green-400 bg-green-50 shadow-sm' : child.isClaimed ? 'bg-gray-100/50 cursor-default' : child.isFailed ? 'bg-red-50/40 border border-red-100' : 'bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
                              >
                                <button onClick={() => handleChildCheck(goal, child.id)} disabled={child.isClaimed || child.isFailed} className={`flex items-center shrink-0 transition-opacity cursor-pointer ${(child.isClaimed || child.isFailed) ? 'cursor-not-allowed' : 'hover:scale-110'} ${expandedChildId === child.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                  {child.isClaimed ? <CheckCircle2 size={18} className="text-gray-300 md:w-5 md:h-5" /> : child.isCompleted ? <CheckCircle2 size={18} className="text-blue-500 md:w-5 md:h-5" /> : <Circle size={18} className={`${child.isFailed ? 'text-red-300' : 'text-gray-300'} md:w-5 md:h-5`} />}
                                </button>

                                {/* Responsive Content & Actions Wrapper */}
                                <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
                                   
                                   {/* Desktop View */}
                                   <div className="hidden md:flex items-center w-full min-w-0 h-full">
                                      <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                                        {editingChildId === child.id ? (
                                          <input type="text" placeholder="New Task" autoFocus value={child.title} disabled={child.isClaimed} onKeyDown={(e) => e.key === 'Enter' && setEditingChildId(null)} onBlur={() => setEditingChildId(null)} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, title: e.target.value } : c) })} className="text-xs md:text-sm bg-transparent outline-none w-full border-b border-blue-400 text-gray-900" />
                                        ) : (
                                          <span onClick={() => !child.isClaimed && setEditingChildId(child.id)} className={`text-xs md:text-sm cursor-text line-clamp-2 break-words w-full ${child.isClaimed ? 'text-gray-400 line-through' : child.isFailed ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                                            {child.isOptional && <Star size={14} className="inline mr-1 text-yellow-400 mb-0.5" />}
                                            {child.title || "New Task"}
                                          </span>
                                        )}
                                        {/* Desktop Time Display */}
                                        {showTime && child.startTime && (
                                           <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                                             <Clock size={10}/> {child.startTime} {child.endTime ? `- ${child.endTime}` : ''}
                                           </div>
                                        )}
                                      </div>
                                      
                                      <div className="shrink-0 flex items-center h-full relative">
                                        {/* Desktop native row coin display & input */}
                                        {showRewards && !child.isClaimed && !child.isCompleted && expandedChildId !== child.id && (
                                          <div className="flex items-center bg-yellow-100 px-1.5 py-1 rounded gap-0.5 mr-2">
                                            <Coins size={10} className="text-yellow-700" />
                                            <input type="number" placeholder="0" value={child.reward === 0 ? '' : child.reward} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, reward: Number(e.target.value) } : c) })} className="w-8 bg-transparent text-yellow-700 text-[10px] font-bold outline-none text-center placeholder-yellow-400" />
                                          </div>
                                        )}
                                        {showRewards && child.reward > 0 && (child.isClaimed || child.isCompleted) && expandedChildId !== child.id && (
                                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-600 border border-yellow-200 mr-2">
                                             <Coins size={10} /> {child.reward}
                                          </span>
                                        )}
                                        
                                        {/* Desktop absolute right popup menu */}
                                        {expandedChildId === child.id ? (
                                           <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-1.5 bg-white shadow-sm border border-gray-200 rounded-lg p-1 animate-in fade-in zoom-in duration-200 z-20">
                                              {!child.isClaimed && (
                                                <>
                                                  <button onClick={() => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, isOptional: !c.isOptional } : c) })} className={`p-1 hover:bg-gray-100 rounded cursor-pointer transition-colors ${child.isOptional ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400'}`} title="Toggle Optional"><Star size={14} /></button>
                                                  <button onClick={() => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, isFailed: !c.isFailed } : c) })} className={`p-1 hover:bg-gray-100 rounded cursor-pointer transition-colors ${child.isFailed ? 'text-red-500 bg-red-50' : 'text-gray-400'}`} title="Toggle Failed"><XOctagon size={14} /></button>
                                                  <button onClick={() => updateGoal(goal.id, { children: goal.children.filter(c => c.id !== child.id) })} className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded cursor-pointer transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </>
                                              )}
                                              <button onClick={() => setExpandedChildId(null)} className="p-1 text-gray-300 hover:text-gray-600 border-l border-gray-200 ml-1 cursor-pointer"><X size={14}/></button>
                                           </div>
                                        ) : (
                                           <div className="flex items-center gap-2">
                                              {child.isCompleted && !child.isClaimed && !child.isFailed && (
                                                <button onClick={(e) => claimChild(e, goal, child.id)} className="shrink-0 text-[10px] font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)] hover:scale-105 transition-transform cursor-pointer">✨ CLAIM</button>
                                              )}
                                              {!child.isClaimed && (
                                                <button onClick={() => setExpandedChildId(child.id)} className="p-1 text-gray-400 hover:bg-gray-200 rounded cursor-pointer transition-colors"><MoreHorizontal size={16}/></button>
                                              )}
                                           </div>
                                        )}
                                      </div>
                                   </div>

                                   {/* Mobile View */}
                                   <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory items-center w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                      {/* Main Task Face */}
                                      <div className="w-full shrink-0 snap-center flex items-center min-w-0 min-h-[28px]">
                                        <div className="flex-1 min-w-0 flex flex-col">
                                          {editingChildId === child.id ? (
                                            <input type="text" placeholder="New Task" autoFocus value={child.title} disabled={child.isClaimed} onKeyDown={(e) => e.key === 'Enter' && setEditingChildId(null)} onBlur={() => setEditingChildId(null)} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, title: e.target.value } : c) })} className="text-xs bg-transparent outline-none w-full border-b border-blue-400 text-gray-900" />
                                          ) : (
                                            <span onClick={() => !child.isClaimed && setEditingChildId(child.id)} className={`text-xs cursor-text line-clamp-2 break-words w-full ${child.isClaimed ? 'text-gray-400 line-through' : child.isFailed ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                                              {child.isOptional && <Star size={12} className="inline mr-1 text-yellow-400 mb-0.5" />}
                                              {child.title || "New Task"}
                                            </span>
                                          )}
                                          {/* Mobile Time Display */}
                                          {showTime && child.startTime && (
                                             <div className="text-[9px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                                               <Clock size={10}/> {child.startTime} {child.endTime ? `- ${child.endTime}` : ''}
                                             </div>
                                          )}
                                        </div>
                                        
                                        {!child.isClaimed && (
                                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                            {/* Mobile native row coin display & input */}
                                            {showRewards && !child.isCompleted && !child.isFailed && (
                                              <div className="flex items-center bg-yellow-100 px-1.5 py-1 rounded-lg gap-0.5">
                                                <Coins size={12} className="text-yellow-700 shrink-0" />
                                                <input type="number" inputMode="numeric" placeholder="0" value={child.reward === 0 ? '' : child.reward} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, reward: Number(e.target.value) } : c) })} className="w-8 bg-transparent text-yellow-700 text-[11px] font-bold outline-none text-center placeholder-yellow-400" />
                                              </div>
                                            )}
                                            {showRewards && child.isCompleted && child.reward > 0 && !child.isFailed && (
                                              <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${child.isFailed ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-700'}`}>
                                                <Coins size={12} /> {child.reward}
                                              </span>
                                            )}

                                            {child.isCompleted && !child.isFailed && (
                                              <button onClick={(e) => claimChild(e, goal, child.id)} className="text-[10px] font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2.5 py-1 rounded-full animate-pulse cursor-pointer shadow-[0_0_8px_rgba(250,204,21,0.6)]">CLAIM</button>
                                            )}
                                            <ChevronsLeft size={16} className="text-gray-300" aria-label="Swipe left for actions" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Actions Drawer */}
                                      {!child.isClaimed && (
                                        <div className="shrink-0 snap-center flex items-center gap-1.5 pl-3 pr-1">
                                           <button onClick={() => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, isOptional: !c.isOptional } : c) })} className={`h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer ${child.isOptional ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 bg-gray-100'}`}><Star size={14} /></button>
                                           <button onClick={() => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, isFailed: !c.isFailed } : c) })} className={`h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer ${child.isFailed ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-100'}`}><XOctagon size={14} /></button>
                                           <button onClick={() => updateGoal(goal.id, { children: goal.children.filter(c => c.id !== child.id) })} className="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer text-red-400 bg-red-50 active:bg-red-100"><Trash2 size={14} /></button>
                                        </div>
                                      )}
                                   </div>
                                </div>
                              </SortableRow>
                            ))}
                          </Reorder.Group>
                        )}
                      </AnimatePresence>
                    )}

                    {goal.type !== 'list' && !goal.isClaimed && !goal.isFailed && (
                      <button onClick={() => addChildTask(goal.id)} className="mt-3 md:mt-4 flex items-center gap-1 text-[11px] md:text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                        <Plus size={14} className="md:w-4 md:h-4" /> Add sub-task
                      </button>
                    )}
                </DraggableCard>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}