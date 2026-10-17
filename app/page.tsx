"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Copy, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, EyeOff, CheckCircle2, Circle, Target } from "lucide-react";
import {
  useAppContext,
  getLocalDateString,
  buildDefaultDailyChildren,
  MON_TO_SUN,
  Goal,
} from "../context/AppContext";
import {
  ASSIGN_GAP,
  jsDays,
  AssignItemType,
  AssignDrag,
  DayTaskItem,
  getDailyTaskIcon,
  findScrollParent,
  sortAssignItems,
  clampDropIndex,
} from "../components/QuestShared";
import DashboardBanner from "../components/DashboardBanner";
import DailyTacticalGraph from "../components/DailyTacticalGraph";
import TodayActiveQuestsCard from "../components/TodayActiveQuestsCard";
import QuestToolbar from "../components/QuestToolbar";
import QuestCard from "../components/QuestCard";
import AssignScheduleView from "../components/AssignScheduleView";
import FocusTimerDock, {
  FloatingRewardPopup,
  FocusSessionState,
} from "../components/FocusTimerDock";

function MasonrySpanSync({ onSync }: { onSync: () => void }) {
  useLayoutEffect(() => {
    onSync();
  });
  return null;
}

export function TargetsPage() {
  const {
    goals,
    setGoals,
    awardSpAndXp,
    duplicateGoal,
    playSound,
    quotes,
    cleanMode,
    setCleanMode,
    clearViewImage,
    clearViewShowSidebar,
    setClearViewShowSidebar,
    dailyBountyClaimedDate,
    setDailyBountyClaimedDate,
  } = useAppContext();

  const [openSettings, setOpenSettings] = useState<string | null>(null);
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [columns, setColumns] = useState(2);
  const [mobileColumns, setMobileColumns] = useState(1);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [showRewards, setShowRewards] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [hideFinishedAssign, setHideFinishedAssign] = useState(false);
  const [mobileAssignIndex, setMobileAssignIndex] = useState(0);

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
  const [rewardPopups, setRewardPopups] = useState<FloatingRewardPopup[]>([]);
  const [progressSurges, setProgressSurges] = useState<Record<string, { id: number; label: string }>>({});

  // Daily Graph scope toggle
  const [includeWeeklyInGraph, setIncludeWeeklyInGraph] = useState(true);

  // References for full-view snap skip-scroll
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const questsSectionRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const scrollToQuests = () => {
    questsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToHero = () => {
    heroSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (isAssignMode || cleanMode) return;

    const handleWheel = (e: WheelEvent) => {
      // 1. Only ignore typing inputs and modals (removed .custom-scrollbar & [data-nodrag])
      const target = e.target as HTMLElement | null;
      if (target?.closest("textarea, input, select, [role='dialog']")) {
        return;
      }

      // 2. Prevent spam while a smooth scroll is currently animating
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      const questsEl = questsSectionRef.current;
      if (!questsEl) return;

      const questsTop = questsEl.getBoundingClientRect().top;

      // When in Hero view (Quests is below the viewport) and scrolling DOWN once -> trigger button action
      if (questsTop > 60 && e.deltaY > 5) {
        e.preventDefault();
        isScrollingRef.current = true;
        scrollToQuests();
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
      // When at the top of Quests view and scrolling UP once -> smooth scroll back to Hero
      else if (questsTop >= -40 && questsTop <= 80 && e.deltaY < -5) {
        e.preventDefault();
        isScrollingRef.current = true;
        scrollToHero();
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isAssignMode, cleanMode]);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<"All" | "weekly" | "daily" | "list">("All");
  const [activeCategory, setActiveCategory] = useState<string>("All Areas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDuplicateMenu, setShowDuplicateMenu] = useState(false);

  // Keyboard shortcuts (Alt+C Clean Mode, Alt+A Assign Mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setCleanMode((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAssignMode((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setClearViewShowSidebar((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCleanMode, setClearViewShowSidebar]);

  // Focus / Pomodoro Timer State
  const [focusSession, setFocusSession] = useState<FocusSessionState | null>(null);

  useEffect(() => {
    if (!focusSession?.isRunning || !focusSession.endTimeMs) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((focusSession.endTimeMs! - Date.now()) / 1000));
      if (rem <= 0) {
        clearInterval(interval);
        const bonus = awardSpAndXp(25, true);
        confetti({ particleCount: 90, spread: 70, origin: { x: 0.85, y: 0.85 } });
        setFocusSession((prev) =>
          prev ? { ...prev, isRunning: false, remainingSec: 0, endTimeMs: null } : null
        );
        spawnRewardPopup(window.innerWidth - 160, window.innerHeight - 120, bonus, "FOCUS CLEAR!");
      } else {
        setFocusSession((prev) => (prev ? { ...prev, remainingSec: rem } : null));
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSession?.isRunning, focusSession?.endTimeMs]);

  const startFocusForTask = (title: string, minutes = 25) => {
    playSound("click");
    const sec = minutes * 60;
    setFocusSession({
      title,
      durationSec: sec,
      remainingSec: sec,
      endTimeMs: Date.now() + sec * 1000,
      isRunning: true,
    });
  };

  const toggleFocusPause = () => {
    if (!focusSession) return;
    playSound("click");
    if (focusSession.isRunning) {
      setFocusSession({
        ...focusSession,
        isRunning: false,
        endTimeMs: null,
      });
    } else {
      const sec = focusSession.remainingSec > 0 ? focusSession.remainingSec : focusSession.durationSec;
      setFocusSession({
        ...focusSession,
        remainingSec: sec,
        endTimeMs: Date.now() + sec * 1000,
        isRunning: true,
      });
    }
  };

  const currentQuote = useMemo(() => {
    if (!quotes || quotes.length === 0) return "Small daily improvements over time lead to stunning results.";
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [quotes]);

  // Main Mode Drag State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const swapLock = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const syncMasonrySpans = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    const rowGap = isDesktop ? 24 : 16;
    const children = Array.from(grid.children) as HTMLElement[];
    for (const el of children) {
      if (el.style.position === "absolute" || window.getComputedStyle(el).position === "absolute") {
        continue;
      }
      const h = el.offsetHeight;
      if (h > 0) {
        const nextSpan = `span ${Math.ceil(h + rowGap)}`;
        if (el.style.gridRowEnd !== nextSpan) {
          el.style.gridRowEnd = nextSpan;
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isAssignMode || cleanMode) return;
    const grid = gridRef.current;
    if (!grid) return;

    syncMasonrySpans();

    const ro = new ResizeObserver(() => {
      syncMasonrySpans();
    });

    const observeChildren = () => {
      ro.disconnect();
      Array.from(grid.children).forEach((child) => {
        ro.observe(child);
      });
    };

    observeChildren();

    const mo = new MutationObserver(() => {
      observeChildren();
      syncMasonrySpans();
    });
    mo.observe(grid, { childList: true });

    const onResize = () => syncMasonrySpans();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [isAssignMode, cleanMode, columns, mobileColumns, syncMasonrySpans]);

  // Assign Mode Drag State
  const [assignDrag, setAssignDrag] = useState<AssignDrag | null>(null);
  const assignDragRef = useRef<AssignDrag | null>(null);
  const assignPointer = useRef({ x: 0, y: 0 });
  const assignRafPending = useRef(false);
  const floatingCardRef = useRef<HTMLDivElement | null>(null);

  const getEventCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const target = e.currentTarget as HTMLElement | null;
    if (target && typeof target.getBoundingClientRect === "function") {
      const r = target.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    return { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 };
  };

  const spawnRewardPopup = (x: number, y: number, sp: number, label?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setRewardPopups((prev) => [...prev, { id, x, y, sp, label }]);
    setTimeout(() => {
      setRewardPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1250);
  };

  const spawnRewardPopupFromEvent = (e: React.MouseEvent, sp: number, label?: string) => {
    const { x, y } = getEventCoords(e);
    spawnRewardPopup(x, y, sp, label);
  };

  const triggerConfettiAtEvent = (e: React.MouseEvent, isBig = false) => {
    const { x, y } = getEventCoords(e);
    const ox = Math.min(0.95, Math.max(0.05, x / window.innerWidth));
    const oy = Math.min(0.95, Math.max(0.05, y / window.innerHeight));
    confetti({
      particleCount: isBig ? 130 : 45,
      spread: isBig ? 85 : 55,
      origin: { x: ox, y: oy },
      colors: ["#4ade80", "#facc15", "#818cf8", "#f472b6", "#38bdf8"],
    });
  };

  const triggerGlow = (id: string) => {
    setRecentlyCompleted((prev) => [...prev, id]);
    setTimeout(() => setRecentlyCompleted((prev) => prev.filter((item) => item !== id)), 1800);
  };

  const triggerProgressSurge = (goalId: string, label = "⚔️ EXP SURGE!") => {
    const surgeId = Date.now() + Math.random();
    setProgressSurges((prev) => ({ ...prev, [goalId]: { id: surgeId, label } }));
    setTimeout(() => {
      setProgressSurges((prev) => {
        if (prev[goalId]?.id !== surgeId) return prev;
        const copy = { ...prev };
        delete copy[goalId];
        return copy;
      });
    }, 1350);
  };

  // Main Mode Reorder
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
        setTimeout(() => {
          swapLock.current = false;
        }, 250);
        setGoals((prev) => {
          const from = prev.findIndex((g) => g.id === dragId);
          const to = prev.findIndex((g) => g.id === overId);
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
  }, []);

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

  // Quest Actions
  const addGoal = (initialType: "weekly" | "daily" | "list" = "weekly") => {
    playSound("click");
    const id = Date.now().toString();
    const isDaily = initialType === "daily";
    const isList = initialType === "list";
    setGoals([
      {
        id,
        title: "",
        type: initialType,
        frequency: isDaily ? "once" : undefined,
        reward: isDaily ? 100 : isList ? 150 : 50,
        isCompleted: false,
        isClaimed: false,
        children: isDaily ? buildDefaultDailyChildren("once", 10) : [],
        targetCount: isList ? 10 : undefined,
        listHasCheckboxes: isList ? true : undefined,
        listItemReward: isList ? 10 : undefined,
        listItems: isList ? [] : undefined,
        milestones: isList ? [] : undefined,
        theme: isDaily ? "mint" : isList ? "sky" : "default",
        priority: "normal",
        category: activeCategory !== "All Areas" ? activeCategory : "Personal",
      },
      ...goals,
    ]);
    setEditingGoalId(id);
  };

  const handleDuplicateGoal = (goalId: string, resetProgress = true) => {
    const cloned = duplicateGoal(goalId, resetProgress);
    if (cloned) {
      triggerGlow(cloned.id);
      setShowDuplicateMenu(false);
    }
  };

  const updateGoal = (id: string, updates: Partial<Goal>) =>
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next: Goal = { ...g, ...updates };
        if (updates.type === "daily" && g.type !== "daily") {
          const hasAllDays = MON_TO_SUN.every((d) =>
            next.children.some((c) => c.assignedDays?.includes(d) || c.title === d)
          );
          if (!hasAllDays || next.children.length === 0) {
            const freq = next.frequency || "once";
            next.frequency = freq;
            next.children = buildDefaultDailyChildren(freq, 10);
            next.isCompleted = false;
          }
        }
        if (updates.type === "list" && g.type !== "list") {
          if (!next.targetCount || next.targetCount <= 0) next.targetCount = 10;
          if (next.listItemReward === undefined) next.listItemReward = 10;
          if (next.listHasCheckboxes === undefined) next.listHasCheckboxes = true;
        }
        return next;
      })
    );

  const deleteGoal = (id: string) => {
    playSound("click");
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addChildTask = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    playSound("click");
    const id = Date.now().toString();
    updateGoal(goalId, {
      children: [
        ...goal.children,
        { id, title: "", reward: 10, isCompleted: false, isClaimed: false, assignedDays: [] },
      ],
    });
    setEditingChildId(id);
    if (collapsedGoals.includes(goalId)) setCollapsedGoals((prev) => prev.filter((gid) => gid !== goalId));
  };

  const addMilestone = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    playSound("click");
    const target = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
    const maxAt = goal.milestones?.reduce((m, x) => Math.max(m, x.at), 0) || 0;
    const nextAt = Math.min(target, Math.max(1, maxAt + 2));
    const newMilestones = [
      ...(goal.milestones || []),
      { id: Date.now().toString(), at: nextAt, reward: 25, isClaimed: false, isOptional: false },
    ].sort((a, b) => a.at - b.at);
    updateGoal(goalId, { milestones: newMilestones });
  };

  const addListItem = (goalId: string, title: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    playSound("check");
    const isChecked = goal.listHasCheckboxes === false ? true : false;
    const itemReward = goal.listItemReward ?? 10;
    const nextItems = [
      ...(goal.listItems || []),
      { id: Date.now().toString(), title, isCompleted: isChecked, reward: itemReward, isClaimed: false },
    ];
    const target = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
    const completedCount = nextItems.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length;
    updateGoal(goalId, {
      listItems: nextItems,
      isCompleted: completedCount >= target,
    });
    if (isChecked) {
      triggerProgressSurge(goalId, `📜 +1 Entry (${completedCount}/${target})`);
    }
  };

  const toggleListItem = (e: React.MouseEvent, goalId: string, itemId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const targetItem = goal.listItems?.find((i) => i.id === itemId);
    if (!targetItem || targetItem.isClaimed) return;
    const nextCompleted = !targetItem.isCompleted;
    const nextItems =
      goal.listItems?.map((i) => (i.id === itemId ? { ...i, isCompleted: nextCompleted } : i)) || [];
    const target = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
    const completedCount = nextItems.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length;

    updateGoal(goalId, {
      listItems: nextItems,
      isCompleted: completedCount >= target,
    });

    if (nextCompleted) {
      playSound("check");
      triggerProgressSurge(goalId, `⚔️ +1 List Item (${completedCount}/${target})`);
      const { x, y } = getEventCoords(e);
      confetti({
        particleCount: 18,
        spread: 40,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#38bdf8", "#818cf8", "#34d399"],
      });
    } else {
      playSound("click");
    }
  };

  const claimListItem = (e: React.MouseEvent, goal: Goal, itemId: string) => {
    const item = goal.listItems?.find((i) => i.id === itemId);
    if (!item || item.isClaimed) return;
    const isDone = goal.listHasCheckboxes === false ? true : item.isCompleted;
    const rewardAmt = item.reward ?? goal.listItemReward ?? 0;
    if (!isDone || rewardAmt <= 0) return;

    updateGoal(goal.id, {
      listItems: goal.listItems?.map((i) => (i.id === itemId ? { ...i, isClaimed: true } : i)),
    });
    const gained = awardSpAndXp(rewardAmt);
    triggerConfettiAtEvent(e, false);
    triggerGlow(item.id);
    triggerProgressSurge(goal.id, `+${gained} SP · Item Claimed!`);
    spawnRewardPopupFromEvent(e, gained, "ITEM REWARD");
  };

  const deleteListItem = (goalId: string, itemId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const nextItems = goal.listItems?.filter((i) => i.id !== itemId) || [];
    const target = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
    const completedCount = nextItems.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length;
    updateGoal(goalId, {
      listItems: nextItems,
      isCompleted: goal.isClaimed ? true : completedCount >= target,
    });
  };

  const handleCopyList = (goalId: string, items: { title: string }[]) => {
    const text = items.map((i) => i.title).join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedListId(goalId);
    setTimeout(() => setCopiedListId(null), 2000);
  };

  const handleGoalCheck = (e: React.MouseEvent, goal: Goal) => {
    if (goal.children.length === 0 && goal.type !== "list" && !goal.isClaimed && !goal.isFailed) {
      const next = !goal.isCompleted;
      updateGoal(goal.id, { isCompleted: next });
      if (next) {
        playSound("check");
        const { x, y } = getEventCoords(e);
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        });
      } else {
        playSound("click");
      }
    }
  };

  const handleChildCheck = (e: React.MouseEvent, goal: Goal, childId: string) => {
    const child = goal.children.find((c) => c.id === childId);
    if (child && !child.isClaimed && !child.isFailed) {
      const nextCompleted = !child.isCompleted;
      const nextChildren = goal.children.map((c) =>
        c.id === childId ? { ...c, isCompleted: nextCompleted } : c
      );
      updateGoal(goal.id, { children: nextChildren });

      if (nextCompleted) {
        playSound("check");
        const mustDo = nextChildren.filter((c) => !c.isOptional);
        const doneCount = mustDo.filter((c) => c.isCompleted || c.isClaimed).length;
        const pct = mustDo.length > 0 ? Math.round((doneCount / mustDo.length) * 100) : 100;
        triggerProgressSurge(
          goal.id,
          pct === 100 ? "🔥 100% READY TO CLAIM!" : `⚡ +1 SUBTASK (${pct}%)`
        );
        const { x, y } = getEventCoords(e);
        confetti({
          particleCount: 22,
          spread: 45,
          origin: { x: x / window.innerWidth, y: y / window.innerHeight },
          colors: ["#4ade80", "#818cf8", "#facc15"],
        });
      } else {
        playSound("click");
      }
    }
  };

  const claimChild = (e: React.MouseEvent, goal: Goal, childId: string) => {
    const child = goal.children.find((c) => c.id === childId);
    if (child && !child.isClaimed && !child.isFailed) {
      updateGoal(goal.id, {
        children: goal.children.map((c) => (c.id === childId ? { ...c, isClaimed: true, isCompleted: true } : c)),
      });
      const gained = awardSpAndXp(child.reward || 0);
      triggerConfettiAtEvent(e, false);
      triggerGlow(child.id);
      triggerProgressSurge(goal.id, `+${gained} SP · XP SURGE!`);
      spawnRewardPopupFromEvent(e, gained);
    }
  };

  const claimMilestone = (e: React.MouseEvent, goal: Goal, milestoneId: string) => {
    const ms = goal.milestones?.find((m) => m.id === milestoneId);
    const completedListCount =
      goal.listItems?.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length || 0;
    if (ms && !ms.isClaimed && completedListCount >= Math.max(1, ms.at)) {
      updateGoal(goal.id, {
        milestones: goal.milestones?.map((m) => (m.id === milestoneId ? { ...m, isClaimed: true } : m)),
      });
      const gained = awardSpAndXp(ms.reward || 0);
      triggerConfettiAtEvent(e, false);
      triggerGlow(ms.id);
      triggerProgressSurge(goal.id, `+${gained} SP · MILESTONE!`);
      spawnRewardPopupFromEvent(e, gained, "MILESTONE!");
    }
  };

  const claimAllReadyInGoal = (e: React.MouseEvent, goal: Goal) => {
    let baseSum = 0;
    const nextChildren = goal.children.map((c) => {
      if (c.isCompleted && !c.isClaimed && !c.isFailed) {
        baseSum += c.reward || 0;
        return { ...c, isClaimed: true };
      }
      return c;
    });
    const completedListCount =
      goal.listItems?.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length || 0;
    const nextListItems = goal.listItems?.map((li) => {
      const isDone = goal.listHasCheckboxes === false ? true : li.isCompleted;
      const rw = li.reward ?? goal.listItemReward ?? 0;
      if (isDone && !li.isClaimed && rw > 0) {
        baseSum += rw;
        return { ...li, isClaimed: true };
      }
      return li;
    });
    const nextMilestones = goal.milestones?.map((m) => {
      if (!m.isClaimed && completedListCount >= Math.max(1, m.at)) {
        baseSum += m.reward || 0;
        return { ...m, isClaimed: true };
      }
      return m;
    });
    updateGoal(goal.id, { children: nextChildren, milestones: nextMilestones, listItems: nextListItems });
    if (baseSum > 0) {
      const gained = awardSpAndXp(baseSum);
      triggerConfettiAtEvent(e, false);
      triggerGlow(goal.id);
      triggerProgressSurge(goal.id, `⚡ COMBO CLAIM +${gained} SP!`);
      spawnRewardPopupFromEvent(e, gained, "COMBO CLAIM!");
    }
  };

  const claimGoal = (e: React.MouseEvent, goal: Goal) => {
    if (!goal.isClaimed && !goal.isFailed) {
      playSound("quest");
      updateGoal(goal.id, { isClaimed: true, isCompleted: true });
      const gained = awardSpAndXp(goal.reward || 0);
      triggerConfettiAtEvent(e, true);
      triggerGlow(goal.id);
      triggerProgressSurge(goal.id, `👑 QUEST CLEAR +${gained} SP!`);
      spawnRewardPopupFromEvent(e, gained, "QUEST COMPLETE!");
    }
  };

  const generateDailyTasks = (goalId: string, frequency: "once" | "day-night") => {
    playSound("click");
    const newChildren = buildDefaultDailyChildren(frequency, 10);
    updateGoal(goalId, { type: "daily", frequency, children: newChildren, isCompleted: false });
  };

  const toggleCollapseAll = () => {
    playSound("click");
    if (collapsedGoals.length === goals.length && goals.length > 0) setCollapsedGoals([]);
    else setCollapsedGoals(goals.map((g) => g.id));
  };

  // Assign Mode Data & Drag Logic
  const getAssignItemsForDay = (day: string, source: Goal[] = goals) => {
    let items = source.flatMap((g) => {
      if (g.isFailed) return [];
      if (g.type === "daily") {
        return g.children
          .filter((c) => day !== "Unorganized" && (c.assignedDays?.includes(day) || c.title.includes(day)))
          .map((c) => {
            const icon = getDailyTaskIcon(c, g.title);
            return { ...c, goalId: g.id, goalTitle: g.title, isDaily: true, icon } as AssignItemType;
          });
      }
      const childrenItems = g.children
        .filter((c) => {
          const assigned = c.assignedDays || [];
          return day === "Unorganized" ? assigned.length === 0 : assigned.includes(day);
        })
        .map((c) => ({ ...c, goalId: g.id, goalTitle: g.title, isDaily: false } as AssignItemType));

      if (g.children.length === 0 && g.type !== "list") {
        const assigned = g.assignedDays || [];
        const matchDay = day === "Unorganized" ? assigned.length === 0 : assigned.includes(day);
        if (matchDay) {
          return [
            {
              id: g.id,
              goalId: g.id,
              title: g.title || "Untitled Goal",
              goalTitle: "Main Quest",
              isDaily: false,
              isGoalItself: true,
              startTime: g.startTime,
              endTime: g.endTime,
              assignOrder: g.assignOrder,
              isFailed: g.isFailed,
              isOptional: g.isOptional,
              isCompleted: g.isCompleted,
              isClaimed: g.isClaimed,
            } as AssignItemType,
          ];
        }
      }
      return childrenItems;
    });

    if (hideFinishedAssign) {
      items = items.filter((i) => !i.isCompleted && !i.isClaimed);
    }

    return items.sort(sortAssignItems);
  };

  const updateAssignItemTime = (
    item: AssignItemType,
    updates: { startTime?: string; endTime?: string; assignedDays?: string[] }
  ) => {
    const g = goals.find((x) => x.id === item.goalId);
    if (!g) return;
    if (item.isGoalItself) {
      updateGoal(g.id, updates);
    } else {
      updateGoal(g.id, {
        children: g.children.map((c) => (c.id === item.id ? { ...c, ...updates } : c)),
      });
    }
  };

  const computeAssignTarget = (x: number, y: number) => {
    const drag = assignDragRef.current;
    if (!drag) return null;
    let nearest: { el: HTMLElement; dist: number } | null = null;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-assign-day]"))) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const dist = Math.hypot(
        Math.max(r.left - x, 0, x - r.right),
        Math.max(r.top - y, 0, y - r.bottom)
      );
      if (!nearest || dist < nearest.dist) nearest = { el, dist };
    }
    if (!nearest || nearest.dist > 48) return null;
    const day = nearest.el.dataset.assignDay!;
    if (drag.item.isDaily && day !== drag.sourceDay) return null;

    const list = nearest.el.querySelector<HTMLElement>("[data-assign-list]");
    if (!list) return null;
    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-assign-item]"));
    const localY = y - list.getBoundingClientRect().top;
    let top = 0,
      index = 0,
      best = Infinity;
    for (let i = 0; i <= cards.length; i++) {
      const dist = Math.abs(localY - (top + drag.height / 2));
      if (dist < best) {
        best = dist;
        index = i;
      }
      if (i < cards.length) top += cards[i].offsetHeight + ASSIGN_GAP;
    }
    const others = getAssignItemsForDay(day).filter((i) => i.id !== drag.item.id);
    return { day, index: clampDropIndex(others, index, drag.item) };
  };

  const beginAssignDrag = (e: React.PointerEvent, item: AssignItemType, day: string) => {
    const card = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-assign-item]");
    if (!card) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
    if (e.pointerType !== "mouse") {
      try {
        document.documentElement.setPointerCapture(e.pointerId);
      } catch {}
    }

    const rect = card.getBoundingClientRect();
    assignPointer.current = { x: e.clientX, y: e.clientY };
    const next: AssignDrag = {
      item,
      sourceDay: day,
      targetDay: day,
      targetIndex: Math.max(
        0,
        getAssignItemsForDay(day).findIndex((i) => i.id === item.id)
      ),
      width: rect.width,
      height: rect.height,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      fresh: true,
    };
    assignDragRef.current = next;
    setAssignDrag(next);
  };

  const placeFloatingCard = () => {
    const el = floatingCardRef.current;
    const drag = assignDragRef.current;
    if (!el || !drag) return;
    el.style.transform = `translate3d(${assignPointer.current.x - drag.grabX}px, ${
      assignPointer.current.y - drag.grabY
    }px, 0) rotate(-2deg) scale(1.03)`;
  };

  const scheduleAssignUpdate = () => {
    if (assignRafPending.current) return;
    assignRafPending.current = true;
    requestAnimationFrame(() => {
      assignRafPending.current = false;
      const current = assignDragRef.current;
      if (!current) return;
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
    const dir =
      !drag || !mobile || drag.item.isDaily
        ? 0
        : x < 40
        ? -1
        : x > window.innerWidth - 40
        ? 1
        : 0;
    if (dir === edgeDir.current) return;
    edgeDir.current = dir;
    if (edgeTimer.current) clearInterval(edgeTimer.current);
    edgeTimer.current = dir
      ? setInterval(() => setMobileAssignIndex((i) => Math.min(7, Math.max(0, i + dir))), 700)
      : null;
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
    const newDays = drag.targetDay === "Unorganized" ? [] : [drag.targetDay];

    setGoals((prev) => {
      const order = getAssignItemsForDay(drag.targetDay, prev).filter((i) => i.id !== drag.item.id);
      order.splice(clampDropIndex(order, drag.targetIndex, drag.item), 0, drag.item);
      const orderMap: Record<string, number> = {};
      order.forEach((it, idx) => {
        orderMap[it.id] = idx;
      });

      return prev.map((g) => {
        if (g.id === drag.item.id && drag.item.isGoalItself) {
          return { ...g, assignedDays: newDays, assignOrder: orderMap[g.id] };
        }
        return {
          ...g,
          children: g.children.map((c) => {
            if (c.id === drag.item.id)
              return { ...c, assignedDays: newDays, assignOrder: orderMap[c.id] };
            return orderMap[c.id] !== undefined ? { ...c, assignOrder: orderMap[c.id] } : c;
          }),
        };
      });
    });
  };

  useEffect(() => {
    if (!assignDrag) return;
    const onMove = (e: PointerEvent) => moveAssignDrag(e.clientX, e.clientY);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelAssignDrag();
    };
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

  // App-wide Progress & SP Calculations
  let totalMustDoApp = 0;
  let totalProgressApp = 0;
  let totalFailedApp = 0;
  let totalSP = 0;
  let claimedSP = 0;
  let readyToClaimSP = 0;

  goals.forEach((goal) => {
    const targetCount = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
    const completedListCount =
      goal.listItems?.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted)).length || 0;
    const hasChildren = goal.type !== "list" && goal.children.length > 0;
    const hasMilestones = goal.type === "list" && (goal.milestones?.length || 0) > 0;
    const mandatoryChildren = hasChildren ? goal.children.filter((c) => !c.isOptional) : [];
    const allMandatoryChildrenClaimed =
      hasChildren && (mandatoryChildren.length === 0 || mandatoryChildren.every((c) => c.isClaimed));
    const mandatoryMilestones = hasMilestones ? goal.milestones?.filter((m) => !m.isOptional) || [] : [];
    const allMandatoryMilestonesClaimed =
      !hasMilestones || mandatoryMilestones.every((m) => m.isClaimed);

    totalSP += goal.reward || 0;
    if (goal.isClaimed) {
      claimedSP += goal.reward || 0;
    } else if (!goal.isFailed) {
      const mainReady =
        (!hasChildren && goal.type !== "list" && goal.isCompleted) ||
        (hasChildren && allMandatoryChildrenClaimed) ||
        (goal.type === "list" && completedListCount >= targetCount && allMandatoryMilestonesClaimed);
      if (mainReady) {
        readyToClaimSP += goal.reward || 0;
      }
    }

    goal.children.forEach((c) => {
      totalSP += c.reward || 0;
      if (c.isClaimed) claimedSP += c.reward || 0;
      else if (c.isCompleted && !c.isFailed) readyToClaimSP += c.reward || 0;
    });

    goal.listItems?.forEach((li) => {
      const rw = li.reward ?? goal.listItemReward ?? 0;
      if (rw > 0) {
        totalSP += rw;
        const isDone = goal.listHasCheckboxes === false ? true : li.isCompleted;
        if (li.isClaimed) claimedSP += rw;
        else if (isDone && !goal.isFailed) readyToClaimSP += rw;
      }
    });

    goal.milestones?.forEach((m) => {
      totalSP += m.reward || 0;
      if (m.isClaimed) claimedSP += m.reward || 0;
      else if (completedListCount >= Math.max(1, m.at)) readyToClaimSP += m.reward || 0;
    });

    if (goal.type === "list") {
      if (!goal.isOptional) {
        totalMustDoApp += 1;
        const frac = Math.min(1, completedListCount / targetCount);
        totalProgressApp += goal.isClaimed ? 1 : frac;
        if (goal.isFailed) totalFailedApp += 1 - frac;
      }
    } else if (goal.children.length > 0) {
      const mustDo = goal.children.filter((c) => !c.isOptional);
      totalMustDoApp += mustDo.length;
      totalProgressApp += mustDo.filter((c) => c.isClaimed || c.isCompleted).length;
      totalFailedApp += mustDo.filter((c) => c.isFailed && !c.isClaimed && !c.isCompleted).length;
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

  const handleGlobalClaimAll = (e: React.MouseEvent) => {
    let baseSum = 0;
    setGoals((prev) =>
      prev.map((goal) => {
        const targetCount = goal.targetCount && goal.targetCount > 0 ? goal.targetCount : 10;
        const nextChildren = goal.children.map((c) => {
          if (c.isCompleted && !c.isClaimed && !c.isFailed) {
            baseSum += c.reward || 0;
            return { ...c, isClaimed: true };
          }
          return c;
        });
        const completedListCount =
          goal.listItems?.filter((i) => (goal.listHasCheckboxes === false ? true : i.isCompleted))
            .length || 0;
        const nextListItems = goal.listItems?.map((li) => {
          const isDone = goal.listHasCheckboxes === false ? true : li.isCompleted;
          const rw = li.reward ?? goal.listItemReward ?? 0;
          if (isDone && !li.isClaimed && rw > 0) {
            baseSum += rw;
            return { ...li, isClaimed: true };
          }
          return li;
        });
        const nextMilestones = goal.milestones?.map((m) => {
          if (!m.isClaimed && completedListCount >= Math.max(1, m.at)) {
            baseSum += m.reward || 0;
            return { ...m, isClaimed: true };
          }
          return m;
        });

        const hasChildren = goal.type !== "list" && nextChildren.length > 0;
        const hasMilestones = goal.type === "list" && (nextMilestones?.length || 0) > 0;
        const mandatoryChildren = hasChildren ? nextChildren.filter((c) => !c.isOptional) : [];
        const allMandatoryChildrenClaimed =
          hasChildren && (mandatoryChildren.length === 0 || mandatoryChildren.every((c) => c.isClaimed));
        const mandatoryMilestones = hasMilestones
          ? nextMilestones?.filter((m) => !m.isOptional) || []
          : [];
        const allMandatoryMilestonesClaimed =
          !hasMilestones || mandatoryMilestones.every((m) => m.isClaimed);

        let nextClaimed = goal.isClaimed;
        if (!goal.isClaimed && !goal.isFailed) {
          const canClaimGoalNow =
            (!hasChildren && goal.type !== "list" && goal.isCompleted) ||
            (hasChildren && allMandatoryChildrenClaimed) ||
            (goal.type === "list" && completedListCount >= targetCount && allMandatoryMilestonesClaimed);
          if (canClaimGoalNow) {
            baseSum += goal.reward || 0;
            nextClaimed = true;
          }
        }
        return {
          ...goal,
          isClaimed: nextClaimed,
          isCompleted: nextClaimed ? true : goal.isCompleted,
          children: nextChildren,
          milestones: nextMilestones,
          listItems: nextListItems,
        };
      })
    );
    if (baseSum > 0) {
      const gained = awardSpAndXp(baseSum);
      triggerConfettiAtEvent(e, true);
      spawnRewardPopupFromEvent(e, gained, "ALL CLAIMED!");
    }
  };

  // Tasks for Day Helper
  const getTasksForDay = (dayName: string, includeWeekly = true): DayTaskItem[] => {
    const list = goals.flatMap((g) => {
      if (g.isFailed) return [];
      if (g.type === "daily") {
        return g.children
          .filter((c) => (c.assignedDays?.includes(dayName) || c.title.includes(dayName)) && !c.isFailed)
          .map((c) => {
            const icon = getDailyTaskIcon(c, g.title);
            return {
              goalId: g.id,
              goalTitle: g.title || "Daily Quest",
              childTitle: g.title || c.title,
              dayLabel: c.title,
              icon,
              id: c.id,
              reward: c.reward || 10,
              isDaily: true,
              startTime: c.startTime,
              endTime: c.endTime,
              isOptional: !!c.isOptional,
              isCompleted: c.isCompleted || !!c.isClaimed,
              isClaimed: !!c.isClaimed,
              isMainGoal: false,
            };
          });
      }

      if (!includeWeekly) return [];

      const childrenTasks = g.children
        .filter((c) => c.assignedDays?.includes(dayName) && !c.isFailed)
        .map((c) => ({
          goalId: g.id,
          goalTitle: g.title || "Weekly Quest",
          childTitle: c.title || "Sub-task",
          dayLabel: dayName,
          icon: "",
          id: c.id,
          reward: c.reward || 10,
          isDaily: false,
          startTime: c.startTime,
          endTime: c.endTime,
          isOptional: !!c.isOptional,
          isCompleted: c.isCompleted || !!c.isClaimed,
          isClaimed: !!c.isClaimed,
          isMainGoal: false,
        }));

      if (g.children.length === 0 && g.type !== "list") {
        if (g.assignedDays?.includes(dayName) && !g.isFailed) {
          return [
            {
              goalId: g.id,
              goalTitle: "Main Quest",
              childTitle: g.title || "Untitled Quest",
              dayLabel: dayName,
              icon: "",
              id: g.id,
              reward: g.reward || 50,
              isDaily: false,
              startTime: g.startTime,
              endTime: g.endTime,
              isOptional: !!g.isOptional,
              isCompleted: g.isCompleted || !!g.isClaimed,
              isClaimed: !!g.isClaimed,
              isMainGoal: true,
            },
          ];
        }
      }

      return childrenTasks;
    });

    list.sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return 0;
    });

    return list;
  };

  // Today's Summary Data
  const todayStr = jsDays[new Date().getDay()];
  const todayIsoDate = getLocalDateString();
  const todayAllTasks = getTasksForDay(todayStr, true);
  const todayTasks = todayAllTasks.filter((t) => !t.isClaimed);
  const todayMandatoryCount = todayAllTasks.filter((t) => !t.isOptional).length;
  const todayMandatoryDone = todayAllTasks.filter((t) => !t.isOptional && t.isCompleted).length;
  const isTodayFullClear = todayMandatoryCount > 0 && todayMandatoryDone === todayMandatoryCount;
  const isDailyBountyClaimed = dailyBountyClaimedDate === todayIsoDate;

  const handleClaimDailyBounty = (e: React.MouseEvent) => {
    if (!isTodayFullClear || isDailyBountyClaimed) return;
    playSound("levelup");
    setDailyBountyClaimedDate(todayIsoDate);
    const gained = awardSpAndXp(75, true);
    triggerConfettiAtEvent(e, true);
    spawnRewardPopupFromEvent(e, gained, "DAILY FULL CLEAR!");
  };

  // Mon-Sun Graph Stats
  const weeklyGraphStats = useMemo(() => {
    const daysData = MON_TO_SUN.map((day) => {
      const items = getTasksForDay(day, includeWeeklyInGraph);
      const mandatory = items.filter((i) => !i.isOptional);
      const total = mandatory.length;
      const done = mandatory.filter((i) => i.isCompleted).length;
      const claimed = mandatory.filter((i) => i.isClaimed).length;
      const dailyCount = items.filter((i) => i.isDaily).length;
      const weeklyCount = items.filter((i) => !i.isDaily).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const claimedPct = total > 0 ? Math.round((claimed / total) * 100) : 0;
      const isFullClear = total > 0 && done === total;
      const totalSp = items.reduce((acc, i) => acc + (i.reward || 0), 0);
      const earnedSp = items.filter((i) => i.isCompleted).reduce((acc, i) => acc + (i.reward || 0), 0);
      return {
        day,
        short: day.slice(0, 3),
        items,
        total,
        done,
        claimed,
        dailyCount,
        weeklyCount,
        pct,
        claimedPct,
        isFullClear,
        totalSp,
        earnedSp,
        isToday: day === todayStr,
      };
    });

    const fullClearDays = daysData.filter((d) => d.isFullClear).length;
    const totalWeekTasks = daysData.reduce((acc, d) => acc + d.total, 0);
    const totalWeekDone = daysData.reduce((acc, d) => acc + d.done, 0);
    const avgPct = totalWeekTasks > 0 ? Math.round((totalWeekDone / totalWeekTasks) * 100) : 0;
    const rank =
      avgPct >= 95
        ? "S+"
        : avgPct >= 85
        ? "S"
        : avgPct >= 70
        ? "A"
        : avgPct >= 50
        ? "B"
        : avgPct >= 25
        ? "C"
        : "D";

    return { daysData, fullClearDays, totalWeekTasks, totalWeekDone, avgPct, rank };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, includeWeeklyInGraph, todayStr]);

  const filteredGoals = goals.filter((g) => {
    const matchesType = activeFilter === "All" || g.type.toLowerCase() === activeFilter.toLowerCase();
    const matchesCategory =
      activeCategory === "All Areas" || (g.category || "Personal") === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.children.some((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.notes && g.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesCategory && matchesSearch;
  });

  const mobileGridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
  };
  const desktopGridColsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };

  const defaultClearBg =
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop";

  return (
    <div className="px-4 md:px-8 max-w-[1440px] mx-auto pb-28 relative">
      <style>{`
        [data-goal-id] input, [data-goal-id] textarea { -webkit-user-select: text; user-select: text; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="time"]::-webkit-calendar-picker-indicator { cursor: pointer; }
        [data-masonry-grid] > *:not([style*="position: absolute"]) { height: auto; align-self: start; }
      `}</style>

      <FocusTimerDock
        rewardPopups={rewardPopups}
        focusSession={focusSession}
        setFocusSession={setFocusSession}
        onToggleFocusPause={toggleFocusPause}
        onStartFocus={startFocusForTask}
      />

      {cleanMode ? (
        /* CLEAR VIEW (Full-Screen Image + Centered Today's Active Quests + 1-Column Right Sidebar with No Settings) */
        <motion.div
          key="clear-view-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 overflow-hidden flex flex-col p-4 md:p-6 md:pl-24"
        >
          {/* Full-Screen Wallpaper (Distinct from Banner) */}
          <img
            src={clearViewImage || defaultClearBg}
            alt="Clear View Wallpaper"
            className="fixed inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
          />
          {/* Atmospheric Dark Overlay */}
          {/* <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-0 pointer-events-none" /> */}

          {/* Top Bar with Exit Clear View Button */}
          <div className="relative z-10 flex items-center justify-between pb-3 w-full">
            <div className="flex items-center gap-2">
              <span className="font-black text-base md:text-lg text-white tracking-widest uppercase flex items-center gap-2 font-rpg-crest drop-shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping inline-block" />
                Clear View
              </span>
              <span className="text-[10px] font-bold text-teal-300 bg-teal-950/70 border border-teal-500/40 px-2 py-0.5 rounded-full backdrop-blur-md">
                Zen Focus Mode
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCleanMode(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 text-xs font-black shadow-xl cursor-pointer hover:scale-105 transition-all"
              title="Exit Clear View (Alt+C)"
            >
              <EyeOff size={15} />
              <span>Exit Clear View</span>
            </button>
          </div>

          {/* Main Layout: Today's Active Quest in Middle Center + Other Quests in 1-Col Right Sidebar */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 w-full flex-1 min-h-0 overflow-hidden">
            {/* Middle Center: Today's Active Quests */}
            <div className="flex-1 w-full flex items-center justify-center h-full overflow-y-auto custom-scrollbar px-2 transition-all duration-300">
              <div className={`w-full my-auto transition-all duration-300 ${clearViewShowSidebar ? "max-w-2xl" : "max-w-3xl"}`}>
                <TodayActiveQuestsCard
                  isCleanView={true}
                  todayStr={todayStr}
                  todayTasks={todayTasks}
                  todayMandatoryDone={todayMandatoryDone}
                  todayMandatoryCount={todayMandatoryCount}
                  isTodayFullClear={isTodayFullClear}
                  isDailyBountyClaimed={isDailyBountyClaimed}
                  showTime={showTime}
                  goals={goals}
                  onClaimDailyBounty={handleClaimDailyBounty}
                  onGoalCheck={handleGoalCheck}
                  onChildCheck={handleChildCheck}
                  onClaimGoal={claimGoal}
                  onClaimChild={claimChild}
                  onStartFocus={startFocusForTask}
                />
              </div>
            </div>

            {/* Right Sidebar: Other Quests (One Column, No Settings) */}
            <AnimatePresence>
              {clearViewShowSidebar && (
                <motion.div
                  key="clear-view-right-sidebar"
                  initial={{ opacity: 0, x: 40, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 40, width: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full lg:w-96 shrink-0 h-full overflow-hidden flex flex-col"
                >
                  <div className="w-full h-full overflow-y-auto custom-scrollbar bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 text-white">
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Target size={14} className="text-indigo-400" /> Other Quests
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-full font-rpg-num">
                          {goals.length} QUESTS
                        </span>
                        <button
                          type="button"
                          onClick={() => setClearViewShowSidebar(false)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Hide other quests (Alt+S)"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

              {goals.length === 0 ? (
                <p className="text-xs text-white/50 italic text-center py-8">
                  No quests in your quest log.
                </p>
              ) : (
                goals.map((g) => {
                  const hasChildren = g.type !== "list" && g.children.length > 0;
                  const doneCount =
                    g.type === "list"
                      ? g.listItems?.filter((i) => (g.listHasCheckboxes === false ? true : i.isCompleted)).length || 0
                      : hasChildren
                      ? g.children.filter((c) => c.isCompleted || c.isClaimed).length
                      : g.isCompleted || g.isClaimed
                      ? 1
                      : 0;
                  const totalCount =
                    g.type === "list"
                      ? Math.max(1, g.targetCount || g.listItems?.length || 1)
                      : hasChildren
                      ? Math.max(1, g.children.length)
                      : 1;
                  const pct = Math.min(100, Math.round((doneCount / totalCount) * 100));

                  return (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {!hasChildren && g.type !== "list" && (
                            <button
                              type="button"
                              onClick={(e) => handleGoalCheck(e, g)}
                              className="mt-0.5 text-white/80 hover:text-white cursor-pointer shrink-0"
                            >
                              {g.isCompleted || g.isClaimed ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : (
                                <Circle size={18} className="text-white/40 hover:text-indigo-300" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                              {g.category || g.type.toUpperCase()}
                            </span>
                            <h4
                              className={`font-bold text-sm mt-1 truncate ${
                                g.isClaimed ? "text-white/40 line-through" : "text-white"
                              }`}
                            >
                              {g.title || "Untitled Quest"}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {g.isCompleted && !g.isClaimed ? (
                            <button
                              type="button"
                              onClick={(e) => claimGoal(e, g)}
                              className="text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full animate-pulse cursor-pointer font-rpg-num"
                            >
                              CLAIM +{g.reward}
                            </button>
                          ) : (
                            <span className="text-[11px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg shrink-0 font-rpg-num">
                              +{g.reward} SP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-400 to-amber-300 h-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Subtasks (No settings buttons) */}
                      {g.children.length > 0 && (
                        <div className="space-y-1.5 mt-1 pt-1.5 border-t border-white/5">
                          {g.children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleChildCheck(e, g, child.id)}
                                className="text-white/80 hover:text-white cursor-pointer transition-transform hover:scale-110 shrink-0"
                              >
                                {child.isCompleted || child.isClaimed ? (
                                  <CheckCircle2 size={16} className="text-emerald-400" />
                                ) : (
                                  <Circle size={16} className="text-white/40 hover:text-indigo-300" />
                                )}
                              </button>
                              <span
                                className={`text-xs truncate flex-1 ${
                                  child.isCompleted || child.isClaimed
                                    ? "text-white/40 line-through"
                                    : "text-white font-medium"
                                }`}
                              >
                                {child.title} {getDailyTaskIcon(child, g.title)}
                              </span>
                              {child.isCompleted && !child.isClaimed && child.reward > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => claimChild(e, g, child.id)}
                                  className="text-[9px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full animate-pulse cursor-pointer font-rpg-num shrink-0"
                                >
                                  CLAIM +{child.reward}
                                </button>
                              ) : (
                                child.reward > 0 && (
                                  <span className="text-[10px] text-amber-300/80 font-rpg-num shrink-0">
                                    +{child.reward}
                                  </span>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* List Items (No settings buttons) */}
                      {g.type === "list" && g.listItems && g.listItems.length > 0 && (
                        <div className="space-y-1.5 mt-1 pt-1.5 border-t border-white/5">
                          {g.listItems.map((li) => {
                            const liReward = li.reward ?? g.listItemReward ?? 0;
                            return (
                              <div
                                key={li.id}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                              >
                                {g.listHasCheckboxes !== false && (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleListItem(e, g.id, li.id)}
                                    className="text-white/80 hover:text-white cursor-pointer transition-transform hover:scale-110 shrink-0"
                                  >
                                    {li.isCompleted || li.isClaimed ? (
                                      <CheckCircle2 size={16} className="text-emerald-400" />
                                    ) : (
                                      <Circle size={16} className="text-white/40 hover:text-indigo-300" />
                                    )}
                                  </button>
                                )}
                                <span
                                  className={`text-xs truncate flex-1 ${
                                    li.isCompleted || li.isClaimed
                                      ? "text-white/40 line-through"
                                      : "text-white font-medium"
                                  }`}
                                >
                                  {li.title}
                                </span>
                                {li.isCompleted && !li.isClaimed && liReward > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => claimListItem(e, g, li.id)}
                                    className="text-[9px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full animate-pulse cursor-pointer font-rpg-num shrink-0"
                                  >
                                    CLAIM +{liReward}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Button "<" on the side when sidebar is hidden */}
          <AnimatePresence>
            {!clearViewShowSidebar && (
              <motion.div
                key="clear-view-sidebar-toggle-btn"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 group"
              >
                {/* Tooltip on hover saying "show other quests" */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0 bg-slate-900/90 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
                  <Target size={12} className="text-teal-400" />
                  <span>show other quests</span>
                </div>

                {/* The "<" Button */}
                <button
                  type="button"
                  onClick={() => setClearViewShowSidebar(true)}
                  title="show other quests"
                  className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-teal-300 hover:text-white border border-teal-500/40 hover:border-teal-400 shadow-2xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.35)]"
                >
                  <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* NORMAL APP VIEW */
        <>
          {/* SCREEN 1: HERO VIEW (Banner + Completion Radar packed in one full view height) */}
          <div
            ref={heroSectionRef}
            className={
              isAssignMode
                ? "pt-4"
                : "min-h-screen flex flex-col justify-between pt-4 pb-6 box-border"
            }
          >
            <div className="space-y-5">
              <DashboardBanner
                isAssignMode={isAssignMode}
                overallBluePct={overallBluePct}
                overallRedPct={overallRedPct}
                totalMustDoApp={totalMustDoApp}
                claimedSP={claimedSP}
                totalSP={totalSP}
                readyToClaimSP={readyToClaimSP}
                currentQuote={currentQuote}
                onGlobalClaimAll={handleGlobalClaimAll}
              />

              {!isAssignMode && (
                <DailyTacticalGraph
                  goals={goals}
                  daysData={weeklyGraphStats.daysData}
                  fullClearDays={weeklyGraphStats.fullClearDays}
                  avgPct={weeklyGraphStats.avgPct}
                  rank={weeklyGraphStats.rank}
                  includeWeeklyInGraph={includeWeeklyInGraph}
                  setIncludeWeeklyInGraph={setIncludeWeeklyInGraph}
                  onGoalCheck={handleGoalCheck}
                  onChildCheck={handleChildCheck}
                  onClaimGoal={claimGoal}
                  onClaimChild={claimChild}
                />
              )}
            </div>

            {/* Smooth Skip-Scroll Button to Quests */}
            {!isAssignMode && (
              <button
                type="button"
                onClick={() => {
                  questsSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className="mx-auto mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50/90 dark:bg-slate-800/90 border border-indigo-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:scale-105 transition-all shadow-xs cursor-pointer"
                title="Skip-scroll to Quests"
              >
                <ChevronDown size={14} className="animate-bounce" />
                <span>Scroll to Quests</span>
              </button>
            )}
          </div>

          {/* SCREEN 2: QUESTS VIEW (Sticky Toolbar + Multi-Column Quests Grid) */}
          <div ref={questsSectionRef} className="min-h-screen pt-3">
            <QuestToolbar
              isAssignMode={isAssignMode}
              setIsAssignMode={setIsAssignMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              hideFinishedAssign={hideFinishedAssign}
              setHideFinishedAssign={setHideFinishedAssign}
              enableTimeSetting={enableTimeSetting}
              setEnableTimeSetting={setEnableTimeSetting}
              allCollapsed={collapsedGoals.length === goals.length && goals.length > 0}
              onToggleCollapseAll={toggleCollapseAll}
              showRewards={showRewards}
              setShowRewards={setShowRewards}
              showTime={showTime}
              setShowTime={setShowTime}
              columns={columns}
              setColumns={setColumns}
              mobileColumns={mobileColumns}
              setMobileColumns={setMobileColumns}
            />

            {isAssignMode ? (
              <AssignScheduleView
                columns={columns}
                assignDrag={assignDrag}
                enableTimeSetting={enableTimeSetting}
                editingTimeId={editingTimeId}
                setEditingTimeId={setEditingTimeId}
                mobileAssignIndex={mobileAssignIndex}
                setMobileAssignIndex={setMobileAssignIndex}
                floatingCardRef={floatingCardRef}
                placeFloatingCard={placeFloatingCard}
                getAssignItemsForDay={getAssignItemsForDay}
                beginAssignDrag={beginAssignDrag}
                updateAssignItemTime={updateAssignItemTime}
              />
            ) : (
              /* MULTI-COLUMN MASONRY (CSS Grid Masonry with 1px auto-rows preserves smooth FLIP drag animation in 1, 2, 3, 4, and 5 columns) */
              <div
                ref={gridRef}
                data-masonry-grid
                style={{ gridAutoRows: "1px" }}
                className={`grid ${mobileGridColsMap[mobileColumns] || "grid-cols-1"} ${
                  desktopGridColsMap[columns] || "md:grid-cols-2"
                } gap-x-4 md:gap-x-6 gap-y-0 items-start relative`}
              >
                <MasonrySpanSync onSync={syncMasonrySpans} />
                {/* Pinned Card 1: Today's Summary */}
                <div className="w-full" data-nodrag>
                  <TodayActiveQuestsCard
                    isCleanView={false}
                    todayStr={todayStr}
                    todayTasks={todayTasks}
                    todayMandatoryDone={todayMandatoryDone}
                    todayMandatoryCount={todayMandatoryCount}
                    isTodayFullClear={isTodayFullClear}
                    isDailyBountyClaimed={isDailyBountyClaimed}
                    showTime={showTime}
                    goals={goals}
                    onClaimDailyBounty={handleClaimDailyBounty}
                    onGoalCheck={handleGoalCheck}
                    onChildCheck={handleChildCheck}
                    onClaimGoal={claimGoal}
                    onClaimChild={claimChild}
                    onStartFocus={startFocusForTask}
                  />
                </div>

                {/* Pinned Card 2: Add New Goal & Duplicate */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3" data-nodrag>
                  <button
                    onClick={() =>
                      addGoal(
                        activeFilter === "daily" ? "daily" : activeFilter === "list" ? "list" : "weekly"
                      )
                    }
                    className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    <Plus size={19} />
                    <span className="text-sm">New Blank Quest</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowDuplicateMenu((o) => !o)}
                      disabled={goals.length === 0}
                      className="w-full h-full bg-white dark:bg-slate-900 border-2 border-dashed border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Copy size={18} />
                      <span className="text-sm">Duplicate Quest ({goals.length})</span>
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${showDuplicateMenu ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showDuplicateMenu && goals.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-2xl z-40 p-2 max-h-64 overflow-y-auto custom-scrollbar space-y-1"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-purple-500 dark:text-purple-400 flex items-center justify-between">
                            <span>Select a Quest to Duplicate</span>
                            <button
                              onClick={() => setShowDuplicateMenu(false)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                          {goals.map((g) => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-purple-50/70 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                  {g.title || "Untitled Quest"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-rpg-num">
                                  {g.type.toUpperCase()} · {g.reward} SP
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleDuplicateGoal(g.id, true)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                                  title="Duplicate with unchecked tasks"
                                >
                                  Fresh Copy
                                </button>
                                <button
                                  onClick={() => handleDuplicateGoal(g.id, false)}
                                  className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                                  title="Exact copy keeping current checkmarks"
                                >
                                  Exact
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Draggable Goal Cards (Smooth FLIP drag animation in all columns) */}
                <AnimatePresence mode="popLayout">
                  {filteredGoals.map((goal) => (
                    <QuestCard
                      key={goal.id}
                      goal={goal}
                      draggingId={draggingId}
                      recentlyCompleted={recentlyCompleted}
                      showRewards={showRewards}
                      showTime={showTime}
                      openNotesId={openNotesId}
                      setOpenNotesId={setOpenNotesId}
                      openSettings={openSettings}
                      setOpenSettings={setOpenSettings}
                      editingGoalId={editingGoalId}
                      setEditingGoalId={setEditingGoalId}
                      editingChildId={editingChildId}
                      setEditingChildId={setEditingChildId}
                      collapsedGoals={collapsedGoals}
                      setCollapsedGoals={setCollapsedGoals}
                      expandedChildId={expandedChildId}
                      setExpandedChildId={setExpandedChildId}
                      copiedListId={copiedListId}
                      activeSurge={progressSurges[goal.id]}
                      onDragBegin={handleDragBegin}
                      onDragMove={handleDragMove}
                      onDragFinish={handleDragFinish}
                      onUpdateGoal={updateGoal}
                      onDeleteGoal={deleteGoal}
                      onDuplicateGoal={handleDuplicateGoal}
                      onStartFocus={startFocusForTask}
                      onGoalCheck={handleGoalCheck}
                      onChildCheck={handleChildCheck}
                      onClaimChild={claimChild}
                      onClaimMilestone={claimMilestone}
                      onClaimListItem={claimListItem}
                      onClaimAllReadyInGoal={claimAllReadyInGoal}
                      onClaimGoal={claimGoal}
                      onAddChildTask={addChildTask}
                      onAddMilestone={addMilestone}
                      onAddListItem={addListItem}
                      onToggleListItem={toggleListItem}
                      onDeleteListItem={deleteListItem}
                      onCopyList={handleCopyList}
                      onGenerateDailyTasks={generateDailyTasks}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return <TargetsPage />;
}