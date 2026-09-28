"use client";

import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Plus, Settings2, Trash2, CheckCircle2, Circle, Sun, Moon, LayoutGrid, GripHorizontal, GripVertical, ChevronDown, ChevronUp, LayoutList, Coins, Target } from "lucide-react";
import { useAppContext, Goal } from "../context/AppContext";

type SubTask = Goal["children"][number];

/* ------------------------------------------------------------------ */
/*  DraggableCard: a goal card that you can REALLY pick up and move   */
/*  - Laptop: click and drag anywhere on the card                     */
/*  - Phone : press and hold the card for a moment, OR drag the grip  */
/*            icon (top-right) right away. Normal swiping still       */
/*            scrolls the page.                                       */
/* ------------------------------------------------------------------ */
type DraggableCardProps = {
  id: string;
  disabled: boolean;
  isDragging: boolean;
  className: string;
  onDragBegin: (id: string) => void;
  onDragMove: (id: string, clientX: number, clientY: number) => void;
  onDragFinish: () => void;
  children: React.ReactNode;
};

const LONG_PRESS_MS = 300;

const DraggableCard = React.forwardRef<HTMLDivElement, DraggableCardProps>(function DraggableCard(
  { id, disabled, className, onDragBegin, onDragMove, onDragFinish, children },
  ref
) {
  const controls = useDragControls();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const pressEvent = useRef<PointerEvent | null>(null);
  const armed = useRef(false); // true once a touch long-press has "picked up" the card
  const didDrag = useRef(false);

  // While a card is picked up on a phone, stop the page from scrolling under the finger
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (armed.current && e.cancelable) e.preventDefault();
    };
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, []);

  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); }, []);

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const target = e.target as HTMLElement;
    const onGrip = !!target.closest("[data-card-handle]");
    // Don't start a card-drag when pressing on inputs, buttons, dropdowns or the sub-task list
    if (!onGrip && target.closest("input, select, textarea, button, a, [data-nodrag]")) return;

    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      controls.start(e.nativeEvent);
      return;
    }

    // Touch / pen
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
    // If the finger moves before the long-press fires, the person is scrolling, so cancel
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
      whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.25)" }}
      onDragStart={() => {
        didDrag.current = true;
        onDragBegin(id);
      }}
      onDrag={(_, info) => onDragMove(id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
      onDragEnd={() => {
        armed.current = false;
        onDragFinish();
        setTimeout(() => { didDrag.current = false; }, 60);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(e) => { if (armed.current) e.preventDefault(); }}
      // Stops the "click" that would otherwise fire when you let go after dragging
      onClickCapture={(e) => {
        if (didDrag.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

/* ------------------------------------------------------------------ */
/*  SortableRow: one sub-task row. Drag it by its small grip icon so  */
/*  that swiping on a phone still scrolls the page normally.          */
/* ------------------------------------------------------------------ */
function SortableRow({ value, disabled, className, children }: { value: SubTask; disabled: boolean; className: string; children: React.ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      className={className}
    >
      {!disabled && (
        <div
          onPointerDown={(e) => controls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 -ml-1 shrink-0 self-start"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </Reorder.Item>
  );
}

/* Finds the element that scrolls (the page itself, or a scrollable container around it) */
function findScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let el: HTMLElement | null = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return window;
}

export default function TargetsPage() {
  const { goals, setGoals, setSpCoins } = useAppContext();
  const [openSettings, setOpenSettings] = useState<string | null>(null);

  const [columns, setColumns] = useState(2);
  const [mobileColumns, setMobileColumns] = useState(1);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);
  const [collapsedGoals, setCollapsedGoals] = useState<string[]>([]);

  // --- DRAG STATE ---
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  // Short pause after each swap so cards don't flicker while they slide into place
  const swapLock = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const triggerBigConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
  const triggerSmallConfetti = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    confetti({ particleCount: 50, spread: 60, origin: { x, y }, colors: ['#4ade80', '#eab308'] });
  };
  const triggerGlow = (id: string) => {
    setRecentlyCompleted(prev => [...prev, id]);
    setTimeout(() => setRecentlyCompleted(prev => prev.filter(item => item !== id)), 2000);
  };

  // --- PARENT GOAL DRAG & DROP ---
  // When the card you're holding is over another card, they swap places.
  const reorderUnderPointer = () => {
    const dragId = draggingIdRef.current;
    if (!dragId || swapLock.current) return;
    const { x, y } = pointerRef.current;
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-goal-id]"));
    for (const el of cards) {
      const overId = el.dataset.goalId;
      if (!overId || overId === dragId) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        swapLock.current = true;
        setTimeout(() => { swapLock.current = false; }, 250);
        setGoals(prev => {
          const from = prev.findIndex(g => g.id === dragId);
          const to = prev.findIndex(g => g.id === overId);
          if (from < 0 || to < 0 || from === to) return prev;
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
        break;
      }
    }
  };

  const handleDragBegin = (id: string) => {
    draggingIdRef.current = id;
    setDraggingId(id);
  };
  const handleDragMove = (_id: string, x: number, y: number) => {
    pointerRef.current = { x, y };
    reorderUnderPointer();
  };
  const handleDragFinish = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
    swapLock.current = false;
  };

  // Safety net: whenever a finger/mouse is released anywhere, make sure drag mode is switched off
  useEffect(() => {
    const stop = () => {
      if (draggingIdRef.current) handleDragFinish();
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll when you drag a card near the top or bottom edge of the screen
  useEffect(() => {
    if (!draggingId) return;
    const scroller = findScrollParent(gridRef.current);
    let raf = 0;
    const tick = () => {
      const y = pointerRef.current.y;
      const viewH = scroller === window ? window.innerHeight : (scroller as HTMLElement).getBoundingClientRect().bottom;
      const viewTop = scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const edge = 90;
      let dy = 0;
      if (y < viewTop + edge) dy = -Math.ceil((viewTop + edge - y) / 6);
      else if (y > viewH - edge) dy = Math.ceil((y - (viewH - edge)) / 6);
      if (dy !== 0) {
        if (scroller === window) window.scrollBy(0, dy);
        else (scroller as HTMLElement).scrollTop += dy;
        reorderUnderPointer();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  // --- ACTIONS ---
  const addGoal = () => {
    const id = Date.now().toString();
    setGoals([{ id, title: "", type: "weekly", reward: 0, isCompleted: false, isClaimed: false, children: [] }, ...goals]);
    setEditingGoalId(id);
  };
  const updateGoal = (id: string, updates: Partial<Goal>) => setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const addChildTask = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    const id = Date.now().toString();
    updateGoal(goalId, { children: [...goal.children, { id, title: "", reward: 0, isCompleted: false, isClaimed: false }] });
    setEditingChildId(id);
    if (collapsedGoals.includes(goalId)) setCollapsedGoals(prev => prev.filter(gid => gid !== goalId));
  };

  const addMilestone = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId); if (!goal) return;
    const newMilestones = [...(goal.milestones || []), { id: Date.now().toString(), at: 0, reward: 0, isClaimed: false }].sort((a, b) => a.at - b.at);
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

  const handleGoalCheck = (goal: Goal) => {
    if (goal.children.length === 0 && (goal.type !== 'list' || goal.milestones?.length === 0) && !goal.isClaimed) {
      updateGoal(goal.id, { isCompleted: !goal.isCompleted });
    }
  };
  const handleChildCheck = (goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed) {
      updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isCompleted: !c.isCompleted } : c) });
    }
  };
  const claimChild = (e: React.MouseEvent, goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed) {
      updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isClaimed: true } : c) });
      setSpCoins(prev => prev + (child.reward || 0));
      triggerSmallConfetti(e);
      triggerGlow(child.id);
    }
  };
  const claimMilestone = (e: React.MouseEvent, goal: Goal, milestoneId: string) => {
    const ms = goal.milestones?.find(m => m.id === milestoneId);
    const completedListCount = goal.listItems?.filter(i => goal.listHasCheckboxes === false ? true : i.isCompleted).length || 0;
    if (ms && !ms.isClaimed && completedListCount >= ms.at) {
      updateGoal(goal.id, { milestones: goal.milestones?.map(m => m.id === milestoneId ? { ...m, isClaimed: true } : m) });
      setSpCoins(prev => prev + (ms.reward || 0));
      triggerSmallConfetti(e);
      triggerGlow(ms.id);
    }
  };
  const claimGoal = (e: React.MouseEvent, goal: Goal) => {
    if (!goal.isClaimed) {
      updateGoal(goal.id, { isClaimed: true, isCompleted: true });
      setSpCoins(prev => prev + (goal.reward || 0));
      triggerBigConfetti();
      triggerGlow(goal.id);
    }
  };

  const generateDailyTasks = (goalId: string, frequency: 'once' | 'day-night') => {
    const newChildren = frequency === 'once'
      ? daysOfWeek.map((day, i) => ({ id: `${Date.now()}-${i}`, title: day, reward: 0, isCompleted: false }))
      : daysOfWeek.flatMap((day, i) => [
          { id: `${Date.now()}-${i}-sun`, title: `${day} ☀️`, reward: 0, isCompleted: false },
          { id: `${Date.now()}-${i}-moon`, title: `${day} 🌙`, reward: 0, isCompleted: false }
        ]);
    updateGoal(goalId, { type: 'daily', frequency, children: newChildren, isCompleted: false });
  };

  const desktopColsMap: Record<number, string> = { 1: "md:columns-1", 2: "md:columns-2", 3: "md:columns-3", 4: "md:columns-4", 5: "md:columns-5" };
  const mobileColsMap: Record<number, string> = { 1: "columns-1", 2: "columns-2" };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pb-24 md:pt-10">
      {/* Keeps typing fields selectable even though the cards themselves block text-selection while dragging */}
      <style>{`[data-goal-id] input, [data-goal-id] textarea { -webkit-user-select: text; user-select: text; }`}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Targets & Goals</h1>
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <LayoutGrid size={18} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 w-24">Columns: {columns}</span>
          <input type="range" min="1" max="5" value={columns} onChange={(e) => setColumns(Number(e.target.value))} className="w-24 md:w-32 cursor-pointer accent-blue-600" />
        </div>
        <div className="flex md:hidden items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm self-start">
          <span className="text-xs font-semibold text-gray-700 mr-1">View:</span>
          <button onClick={() => setMobileColumns(1)} className={`p-1.5 rounded-lg transition-colors ${mobileColumns === 1 ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutList size={16} /></button>
          <button onClick={() => setMobileColumns(2)} className={`p-1.5 rounded-lg transition-colors ${mobileColumns === 2 ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <p className="md:hidden text-xs text-gray-400 -mt-3 mb-4">Tip: press and hold a card to move it, or drag the grip icon.</p>

      <div
        ref={gridRef}
        className={`${mobileColsMap[mobileColumns]} ${desktopColsMap[columns]} gap-4 md:gap-6 space-y-4 md:space-y-6 relative`}
      >
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => {
            const hasChildren = goal.type !== 'list' && goal.children.length > 0;
            const hasMilestones = goal.type === 'list' && (goal.milestones?.length || 0) > 0;
            const allChildrenClaimed = hasChildren && goal.children.every(c => c.isClaimed);
            const allMilestonesClaimed = hasMilestones && goal.milestones?.every(m => m.isClaimed);

            const completedListCount = goal.listItems?.filter(i => goal.listHasCheckboxes === false ? true : i.isCompleted).length || 0;

            let progress = 0;
            if (goal.type === 'list') progress = Math.min(100, Math.round((completedListCount / (goal.targetCount || 1)) * 100));
            else if (hasChildren) progress = Math.round((goal.children.filter(c => c.isClaimed).length / goal.children.length) * 100);
            else progress = goal.isClaimed ? 100 : 0;

            const canClaimMain = (!hasChildren && !hasMilestones && goal.isCompleted && !goal.isClaimed) || (allChildrenClaimed && !goal.isClaimed) || (goal.type === 'list' && progress >= 100 && allMilestonesClaimed && !goal.isClaimed);

            return (
              <DraggableCard
                key={goal.id}
                id={goal.id}
                disabled={goal.isClaimed}
                isDragging={draggingId === goal.id}
                onDragBegin={handleDragBegin}
                onDragMove={handleDragMove}
                onDragFinish={handleDragFinish}
                className={`break-inside-avoid w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-5 relative select-none [-webkit-touch-callout:none]
                  ${goal.isClaimed ? 'opacity-75 bg-gray-50/50 cursor-default' : 'md:cursor-grab md:active:cursor-grabbing'}
                  ${recentlyCompleted.includes(goal.id) ? 'ring-2 ring-green-400 shadow-xl z-10' : 'hover:shadow-md'}
                `}
              >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-[140px] w-full">
                      {!hasChildren && !hasMilestones && (
                        <button onClick={() => handleGoalCheck(goal)} disabled={goal.isClaimed} className={`mt-0.5 shrink-0 transition-colors ${goal.isClaimed ? 'cursor-not-allowed' : 'hover:scale-110'}`}>
                          {goal.isClaimed ? <CheckCircle2 size={24} className="text-gray-300 md:w-7 md:h-7" /> : goal.isCompleted ? <CheckCircle2 size={24} className="text-blue-500 md:w-7 md:h-7" /> : <Circle size={24} className="text-gray-300 md:w-7 md:h-7" />}
                        </button>
                      )}
                      {editingGoalId === goal.id ? (
                        <input type="text" placeholder="New Goal" value={goal.title} autoFocus disabled={goal.isClaimed} onChange={(e) => updateGoal(goal.id, { title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setEditingGoalId(null)} onBlur={() => setEditingGoalId(null)} className="font-semibold text-lg md:text-xl bg-transparent outline-none w-full border-b border-blue-400 text-gray-900 mt-0.5 md:mt-0" />
                      ) : (
                        <span onClick={() => !goal.isClaimed && setEditingGoalId(goal.id)} className={`font-semibold text-lg md:text-xl cursor-text line-clamp-2 break-words w-full mt-0.5 md:mt-0 ${goal.isClaimed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {goal.title || "New Goal"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto mt-0.5">
                      {goal.reward > 0 && !goal.isClaimed && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-1 rounded flex items-center gap-1"><Coins size={12} /> {goal.reward}</span>
                      )}
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {canClaimMain && (
                          <button onClick={(e) => claimGoal(e, goal)} className="text-[10px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full whitespace-nowrap animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:scale-105 transition-transform">
                            ✨ CLAIM
                          </button>
                        )}
                        {goal.isClaimed && (<button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>)}
                        {!goal.isClaimed && (<button onClick={() => setOpenSettings(openSettings === goal.id ? null : goal.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full"><Settings2 size={18} /></button>)}
                        {/* Grip handle: on a phone, drag this to move the card instantly */}
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
                          <select value={goal.type} onChange={(e) => updateGoal(goal.id, { type: e.target.value as "weekly" | "daily" | "list" })} className="block w-full mt-1 p-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white">
                            <option value="weekly">Weekly / Custom</option>
                            <option value="daily">Daily</option>
                            <option value="list">List (Progress)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Reward</label>
                          <input type="number" placeholder="0" value={goal.reward === 0 ? '' : goal.reward} onChange={(e) => updateGoal(goal.id, { reward: Number(e.target.value) })} className="block w-full mt-1 p-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400" />
                        </div>

                        {goal.type === 'list' && (
                          <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                            <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Target Count</label>
                            <input type="number" placeholder="70" value={goal.targetCount === 0 ? '' : (goal.targetCount || '')} onChange={(e) => updateGoal(goal.id, { targetCount: Number(e.target.value) })} className="block w-full mt-1 mb-3 p-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400" />

                            <label className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Milestones</label>
                            <div className="space-y-2 mt-1 border-l-2 border-blue-200 pl-3">
                              {goal.milestones?.map(m => (
                                <div key={m.id} className="flex gap-2 items-center">
                                  <span className="text-xs text-gray-700 font-bold">At</span>
                                  <input type="number" placeholder="0" value={m.at === 0 ? '' : m.at} onChange={(e) => updateGoal(goal.id, { milestones: goal.milestones?.map(mx => mx.id === m.id ? { ...mx, at: Number(e.target.value) } : mx).sort((a, b) => a.at - b.at) })} className="w-16 p-1.5 text-xs rounded border border-gray-300 text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500" />
                                  <span className="text-xs text-gray-700 font-bold">SP</span>
                                  <input type="number" placeholder="0" value={m.reward === 0 ? '' : m.reward} onChange={(e) => updateGoal(goal.id, { milestones: goal.milestones?.map(mx => mx.id === m.id ? { ...mx, reward: Number(e.target.value) } : mx) })} className="w-16 p-1.5 text-xs rounded border border-gray-300 text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500" />
                                  <button onClick={() => updateGoal(goal.id, { milestones: goal.milestones?.filter(mx => mx.id !== m.id) })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                              ))}
                              <button onClick={() => addMilestone(goal.id)} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:underline mt-2"><Plus size={12} /> Add Milestone</button>
                            </div>

                            <label className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-700 uppercase mt-4 cursor-pointer">
                              <input type="checkbox" checked={goal.listHasCheckboxes !== false} onChange={(e) => updateGoal(goal.id, { listHasCheckboxes: e.target.checked })} className="accent-blue-600 w-3 h-3 cursor-pointer" />
                              Require Checkboxes
                            </label>
                          </div>
                        )}
                        {goal.type === 'daily' && (
                          <div className="col-span-2 flex flex-col md:flex-row gap-2">
                            <button onClick={() => generateDailyTasks(goal.id, 'once')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-xs md:text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Once a Day</button>
                            <button onClick={() => generateDailyTasks(goal.id, 'day-night')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-xs md:text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-1">Day & Night <Sun size={14} /><Moon size={14} /></button>
                          </div>
                        )}
                        <div className="col-span-2 flex justify-end mt-1">
                          <button onClick={() => deleteGoal(goal.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"><Trash2 size={16} /> Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(hasChildren || goal.type === 'list') && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] md:text-xs text-gray-500 mb-1 font-medium"><span>{progress === 100 ? 'Completed' : 'Progress'}</span><span>{progress}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-400' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div></div>
                      </div>
                      <button onClick={() => setCollapsedGoals(prev => prev.includes(goal.id) ? prev.filter(id => id !== goal.id) : [...prev, goal.id])} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-1 rounded-md shrink-0 border border-gray-100 bg-gray-50">
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
                              <input type="text" placeholder="Add list item (e.g., Learn 'Hola')" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addListItem(goal.id, e.currentTarget.value.trim()); e.currentTarget.value = ''; } }} className="flex-1 p-2 text-sm rounded-lg border border-gray-300 text-gray-900 outline-none focus:border-blue-500 placeholder-gray-400 bg-white" />
                              <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1.5 rounded-md border border-gray-200">{completedListCount} / {goal.targetCount || 10}</span>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                              {goal.listItems?.map(item => (
                                <div key={item.id} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm transition-colors hover:bg-gray-50">
                                  {goal.listHasCheckboxes !== false && (
                                    <button onClick={() => toggleListItem(goal.id, item.id)} className={`mt-0.5 shrink-0 ${item.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-blue-400'}`}>
                                      {item.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </button>
                                  )}
                                  <span className={`text-xs md:text-sm flex-1 break-words line-clamp-2 ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.title}</span>
                                  <button onClick={() => deleteListItem(goal.id, item.id)} className="text-gray-300 hover:text-red-500 p-0.5"><Trash2 size={14} /></button>
                                </div>
                              ))}
                              {(!goal.listItems || goal.listItems.length === 0) && (
                                <p className="text-xs text-gray-400 text-center italic py-2">No items yet. Add one above!</p>
                              )}
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
                                    <span className={`text-xs md:text-sm font-bold ${m.isClaimed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>Reach {m.at}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!m.isClaimed && !isReached && (
                                      <div className="flex items-center bg-yellow-100 px-1.5 py-0.5 rounded shrink-0 gap-1">
                                        <Coins size={10} className="text-yellow-700" />
                                        <span className="text-yellow-700 text-[10px] md:text-xs font-bold">{m.reward}</span>
                                      </div>
                                    )}
                                    {isReached && !m.isClaimed && (
                                      <button onClick={(e) => claimMilestone(e, goal, m.id)} className="shrink-0 text-[9px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)] hover:scale-105 transition-transform">
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

                  {/* Sub-goals List (vertical drag using Framer Motion Reorder, moved by the small grip icon) */}
                  {hasChildren && (
                    <AnimatePresence>
                      {!collapsedGoals.includes(goal.id) && (
                        <Reorder.Group
                          axis="y"
                          as="div"
                          values={goal.children}
                          onReorder={(newChildren) => updateGoal(goal.id, { children: newChildren })}
                          className="overflow-hidden mt-3 md:mt-4 space-y-2 md:space-y-3"
                          data-nodrag
                        >
                          {goal.children.map((child) => (
                            <SortableRow
                              key={child.id}
                              value={child}
                              disabled={!!child.isClaimed}
                              className={`flex items-start gap-2 p-2 rounded-lg transition-colors duration-300 ${recentlyCompleted.includes(child.id) ? 'scale-[1.02] ring-1 ring-green-400 bg-green-50 shadow-sm' : child.isClaimed ? 'bg-gray-100/50 cursor-default' : 'bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
                            >
                              <button onClick={() => handleChildCheck(goal, child.id)} disabled={child.isClaimed} className={`mt-0.5 shrink-0 transition-colors ${child.isClaimed ? 'cursor-not-allowed' : 'hover:scale-110'}`}>
                                {child.isClaimed ? <CheckCircle2 size={18} className="text-gray-300 md:w-5 md:h-5" /> : child.isCompleted ? <CheckCircle2 size={18} className="text-blue-500 md:w-5 md:h-5" /> : <Circle size={18} className="text-gray-300 md:w-5 md:h-5" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                {editingChildId === child.id ? (
                                  <input type="text" placeholder="New Task" autoFocus value={child.title} disabled={child.isClaimed} onKeyDown={(e) => e.key === 'Enter' && setEditingChildId(null)} onBlur={() => setEditingChildId(null)} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, title: e.target.value } : c) })} className="text-xs md:text-sm bg-transparent outline-none w-full border-b border-blue-400 text-gray-900 mt-0.5" />
                                ) : (
                                  <span onClick={() => !child.isClaimed && setEditingChildId(child.id)} className={`text-xs md:text-sm cursor-text line-clamp-2 break-words w-full mt-0.5 ${child.isClaimed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {child.title || "New Task"}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                {!child.isClaimed && !child.isCompleted && (
                                  <div className="flex items-center bg-yellow-100 px-1.5 py-1 rounded transition-opacity shrink-0 gap-0.5">
                                    <Coins size={10} className="text-yellow-700" />
                                    <input type="number" placeholder="0" value={child.reward === 0 ? '' : child.reward} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, reward: Number(e.target.value) } : c) })} className="w-6 md:w-8 bg-transparent text-yellow-700 text-[10px] font-bold outline-none text-center placeholder-yellow-400" />
                                  </div>
                                )}

                                {child.isCompleted && !child.isClaimed && (
                                  <button onClick={(e) => claimChild(e, goal, child.id)} className="shrink-0 text-[9px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)] hover:scale-105 transition-transform">
                                    ✨ CLAIM
                                  </button>
                                )}

                                {!child.isClaimed && (
                                  <button onClick={() => updateGoal(goal.id, { children: goal.children.filter(c => c.id !== child.id) })} className="text-gray-300 hover:text-red-500 transition-opacity shrink-0">
                                    <Trash2 size={14} className="md:w-4 md:h-4" />
                                  </button>
                                )}
                              </div>
                            </SortableRow>
                          ))}
                        </Reorder.Group>
                      )}
                    </AnimatePresence>
                  )}

                  {goal.type !== 'list' && !goal.isClaimed && (
                    <button onClick={() => addChildTask(goal.id)} className="mt-3 md:mt-4 flex items-center gap-1 text-[11px] md:text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors">
                      <Plus size={14} className="md:w-4 md:h-4" /> Add sub-task
                    </button>
                  )}
              </DraggableCard>
            );
          })}
        </AnimatePresence>

        <motion.button layout onClick={addGoal} className="break-inside-avoid w-full border-2 border-dashed border-gray-300 text-gray-400 font-bold p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-h-[100px] md:min-h-[120px]">
          <Plus size={28} className="md:w-8 md:h-8" /> <span className="text-sm md:text-base">Add New Goal</span>
        </motion.button>
      </div>
    </div>
  );
}
