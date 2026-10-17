"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import AuthScreen from "../components/AuthScreen";
import { User } from "@supabase/supabase-js";
import {
  Goal,
  WheelSlice,
  InventoryItem,
  TimeAllowance,
  HistoryItem,
  FinanceData,
  StreakData,
  StickyNoteItem,
  ActiveAllowanceTimer,
  RpgSoundType,
  AppContextType,
  DEFAULT_STARTER_GOALS,
  DEFAULT_STICKY_NOTES,
  DEFAULT_FINANCE_DATA,
  DEFAULT_STREAK,
  getLocalDateString,
  getYesterdayDateString,
  getLevelInfo,
} from "./types";

export * from "./types";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [spCoins, setSpCoins] = useState(1000);
  const [spinTokens, setSpinTokens] = useState(3);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wheelSlices, setWheelSlices] = useState<WheelSlice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [timeAllowances, setTimeAllowances] = useState<TimeAllowance[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [financeData, setFinanceData] = useState<FinanceData>(DEFAULT_FINANCE_DATA);

  const [lifetimeXp, setLifetimeXp] = useState<number>(0);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [quotes, setQuotes] = useState<string[]>([
    "Small daily improvements over time lead to stunning results.",
    "Every completed quest forges the legend you are becoming.",
    "Discipline in the small things unlocks mastery in the great.",
  ]);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [clearViewImage, setClearViewImage] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [cleanMode, setCleanMode] = useState<boolean>(false);
  const [clearViewShowSidebar, setClearViewShowSidebar] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>(DEFAULT_STICKY_NOTES);
  const [dailyBountyClaimedDate, setDailyBountyClaimedDate] = useState<string>("");
  const [activeAllowanceTimer, setActiveAllowanceTimer] = useState<ActiveAllowanceTimer | null>(null);

  const [mounted, setMounted] = useState(false);
  const cloudSyncReadyRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (type: RpgSoundType) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        const playTone = (
          freq: number,
          start: number,
          dur: number,
          wave: OscillatorType = "triangle",
          gainVal = 0.08
        ) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = wave;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(gainVal, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        };

        if (type === "click") {
          playTone(520, now, 0.045, "sine", 0.04);
        } else if (type === "check") {
          playTone(587.33, now, 0.08, "triangle", 0.07);
          playTone(880, now + 0.055, 0.14, "triangle", 0.08);
        } else if (type === "claim") {
          playTone(987.77, now, 0.08, "sine", 0.09);
          playTone(1318.51, now + 0.06, 0.22, "sine", 0.1);
        } else if (type === "quest") {
          playTone(523.25, now, 0.1, "triangle", 0.09);
          playTone(659.25, now + 0.08, 0.1, "triangle", 0.09);
          playTone(783.99, now + 0.16, 0.12, "triangle", 0.09);
          playTone(1046.5, now + 0.25, 0.35, "triangle", 0.12);
        } else if (type === "levelup") {
          [440, 554.37, 659.25, 880, 1108.73].forEach((f, idx) => {
            playTone(f, now + idx * 0.07, 0.24, "triangle", 0.1);
          });
        } else if (type === "spin") {
          playTone(440, now, 0.06, "sine", 0.06);
          playTone(660, now + 0.05, 0.09, "sine", 0.06);
        }
      } catch {
        // Ignore audio errors when blocked by autoplay policy
      }
    },
    [soundEnabled]
  );

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoadingAuth(false);
      })
      .catch(() => {
        setLoadingAuth(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem("spCoins");
      setSpCoins(savedCoins !== null ? Number(savedCoins) : 1000);

      const savedTokens = localStorage.getItem("spinTokens");
      if (savedTokens !== null) setSpinTokens(Number(savedTokens));

      let parsedGoals: Goal[] = [];
      const rawGoals = localStorage.getItem("goals");
      if (rawGoals) {
        parsedGoals = JSON.parse(rawGoals);
        setGoals(parsedGoals);
      } else {
        parsedGoals = DEFAULT_STARTER_GOALS;
        setGoals(DEFAULT_STARTER_GOALS);
      }

      const rawSlices = localStorage.getItem("wheelSlices");
      if (rawSlices) setWheelSlices(JSON.parse(rawSlices));

      const rawInv = localStorage.getItem("inventory");
      if (rawInv) setInventory(JSON.parse(rawInv));

      const rawTime = localStorage.getItem("timeAllowances");
      if (rawTime) setTimeAllowances(JSON.parse(rawTime));

      const rawHist = localStorage.getItem("history");
      if (rawHist) setHistory(JSON.parse(rawHist));

      const rawFin = localStorage.getItem("financeData");
      if (rawFin) setFinanceData(JSON.parse(rawFin));

      const rawXp = localStorage.getItem("sp_lifetime_xp");
      if (rawXp !== null) {
        setLifetimeXp(Number(rawXp));
      } else if (parsedGoals.length > 0) {
        let derivedXp = 0;
        parsedGoals.forEach((g) => {
          if (g.isClaimed) derivedXp += g.reward || 50;
          g.children?.forEach((c) => {
            if (c.isClaimed) derivedXp += c.reward || 15;
          });
          g.milestones?.forEach((m) => {
            if (m.isClaimed) derivedXp += m.reward || 25;
          });
          g.listItems?.forEach((li) => {
            if (li.isClaimed) derivedXp += li.reward || g.listItemReward || 10;
          });
        });
        setLifetimeXp(derivedXp);
      }

      const rawStreak = localStorage.getItem("sp_streak");
      if (rawStreak) {
        const parsedStreak: StreakData = { ...DEFAULT_STREAK, ...JSON.parse(rawStreak) };
        const today = getLocalDateString();
        const yesterday = getYesterdayDateString();
        if (
          parsedStreak.lastActiveDate &&
          parsedStreak.lastActiveDate !== today &&
          parsedStreak.lastActiveDate !== yesterday &&
          parsedStreak.current > 0
        ) {
          if (parsedStreak.shields > 0) {
            parsedStreak.shields -= 1;
            parsedStreak.lastActiveDate = yesterday;
          } else {
            parsedStreak.current = 0;
          }
        }
        setStreak(parsedStreak);
      }

      const rawQuotes = localStorage.getItem("sp_quotes");
      if (rawQuotes) {
        const q = JSON.parse(rawQuotes);
        if (Array.isArray(q) && q.length > 0) setQuotes(q);
      }

      const rawBanner = localStorage.getItem("sp_banner");
      if (rawBanner) setBannerImage(rawBanner);

      const rawClearView = localStorage.getItem("sp_clear_view_image");
      if (rawClearView) setClearViewImage(rawClearView);

      const rawDark = localStorage.getItem("sp_dark_mode");
      if (rawDark !== null) {
        const isDark = rawDark === "true";
        setDarkMode(isDark);
        document.documentElement.classList.toggle("dark", isDark);
      }

      const rawClean = localStorage.getItem("sp_clean_mode");
      if (rawClean !== null) setCleanMode(rawClean === "true");

      const rawCleanSidebar = localStorage.getItem("sp_clean_view_sidebar");
      if (rawCleanSidebar !== null) setClearViewShowSidebar(rawCleanSidebar === "true");

      const rawSound = localStorage.getItem("sp_sound_enabled");
      if (rawSound !== null) setSoundEnabled(rawSound === "true");

      const rawSticky = localStorage.getItem("sp_sticky_notes");
      if (rawSticky) {
        const parsedSticky = JSON.parse(rawSticky);
        if (Array.isArray(parsedSticky) && parsedSticky.length > 0) {
          setStickyNotes(parsedSticky);
        }
      }

      const rawBounty = localStorage.getItem("sp_daily_bounty_date");
      if (rawBounty) setDailyBountyClaimedDate(rawBounty);
    } catch (err) {
      console.error("Failed to read local storage state:", err);
    }
    setMounted(true);
  }, []);

  // Sync dark mode class onto documentElement & body
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("sp_dark_mode", String(darkMode));
    } catch {}
  }, [darkMode, mounted]);

  // Fetch cloud data before enabling cloud writes
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      cloudSyncReadyRef.current = true;
      return;
    }
    cloudSyncReadyRef.current = false;
    const fetchCloudData = async () => {
      try {
        const { data, error } = await supabase.from("user_data").select("*").eq("id", user.id).single();
        if (data) {
          if (typeof data.sp_coins === "number") setSpCoins(data.sp_coins);
          if (typeof data.spin_tokens === "number") setSpinTokens(data.spin_tokens);
          if (Array.isArray(data.goals)) setGoals(data.goals);
          if (Array.isArray(data.wheel_slices)) setWheelSlices(data.wheel_slices);
          if (Array.isArray(data.inventory)) setInventory(data.inventory);
          if (Array.isArray(data.time_allowances)) setTimeAllowances(data.time_allowances);
          if (Array.isArray(data.history)) setHistory(data.history);
          if (data.finance_data) setFinanceData(data.finance_data);
        } else if (error && error.code === "PGRST116") {
          await supabase.from("user_data").insert({
            id: user.id,
            sp_coins: spCoins,
            spin_tokens: spinTokens,
            goals,
            wheel_slices: wheelSlices,
            inventory,
            time_allowances: timeAllowances,
            history,
            finance_data: financeData,
          });
        }
      } finally {
        cloudSyncReadyRef.current = true;
      }
    };
    fetchCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mounted]);

  // Persist to localStorage & debounced Supabase upsert
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("spCoins", spCoins.toString());
      localStorage.setItem("spinTokens", spinTokens.toString());
      localStorage.setItem("goals", JSON.stringify(goals));
      localStorage.setItem("wheelSlices", JSON.stringify(wheelSlices));
      localStorage.setItem("inventory", JSON.stringify(inventory));
      localStorage.setItem("timeAllowances", JSON.stringify(timeAllowances));
      localStorage.setItem("history", JSON.stringify(history));
      localStorage.setItem("financeData", JSON.stringify(financeData));
      localStorage.setItem("sp_lifetime_xp", lifetimeXp.toString());
      localStorage.setItem("sp_streak", JSON.stringify(streak));
      localStorage.setItem("sp_quotes", JSON.stringify(quotes));
      localStorage.setItem("sp_clean_mode", String(cleanMode));
      localStorage.setItem("sp_clean_view_sidebar", String(clearViewShowSidebar));
      localStorage.setItem("sp_sound_enabled", String(soundEnabled));
      localStorage.setItem("sp_sticky_notes", JSON.stringify(stickyNotes));
      localStorage.setItem("sp_daily_bounty_date", dailyBountyClaimedDate);
      if (bannerImage) localStorage.setItem("sp_banner", bannerImage);
      else localStorage.removeItem("sp_banner");
      if (clearViewImage) localStorage.setItem("sp_clear_view_image", clearViewImage);
      else localStorage.removeItem("sp_clear_view_image");
    } catch (err) {
      console.error("Local storage save error:", err);
    }

    if (!user || !cloudSyncReadyRef.current) return;
    const timeoutId = setTimeout(async () => {
      await supabase.from("user_data").upsert({
        id: user.id,
        sp_coins: spCoins,
        spin_tokens: spinTokens,
        goals,
        wheel_slices: wheelSlices,
        inventory,
        time_allowances: timeAllowances,
        history,
        finance_data: financeData,
      });
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [
    spCoins,
    spinTokens,
    goals,
    wheelSlices,
    inventory,
    timeAllowances,
    history,
    financeData,
    lifetimeXp,
    streak,
    quotes,
    bannerImage,
    clearViewImage,
    cleanMode,
    clearViewShowSidebar,
    soundEnabled,
    stickyNotes,
    dailyBountyClaimedDate,
    mounted,
    user,
  ]);

  const recordDailyActivity = () => {
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    setStreak((prev) => {
      if (prev.lastActiveDate === today) return prev;
      const nextCurrent = prev.lastActiveDate === yesterday || prev.current === 0 ? prev.current + 1 : 1;
      const nextLongest = Math.max(prev.longest, nextCurrent);
      return {
        ...prev,
        current: nextCurrent,
        longest: nextLongest,
        lastActiveDate: today,
      };
    });
  };

  const awardSpAndXp = (baseSp: number, applyStreakBonus = true): number => {
    const cleanBase = Math.max(0, Number(baseSp) || 0);
    const mult =
      applyStreakBonus && streak.enableMultiplier && streak.current > 0
        ? 1 + Math.min(0.25, streak.current * 0.05)
        : 1;
    const finalSp = Math.round(cleanBase * mult);
    const xpGain = Math.max(10, finalSp);
    const oldLevel = getLevelInfo(lifetimeXp).level;
    const newLevel = getLevelInfo(lifetimeXp + xpGain).level;

    setSpCoins((prev) => prev + finalSp);
    setLifetimeXp((prev) => prev + xpGain);
    recordDailyActivity();

    if (newLevel > oldLevel) {
      playSound("levelup");
    } else {
      playSound("claim");
    }
    return finalSp;
  };

  const duplicateGoal = (goalId: string, resetProgress = true): Goal | null => {
    const source = goals.find((g) => g.id === goalId);
    if (!source) return null;
    const now = Date.now();
    const cloned: Goal = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${now}-${Math.floor(Math.random() * 1000)}`,
      title: `${source.title || "Untitled Quest"} (Copy)`,
      isCompleted: resetProgress ? false : source.isCompleted,
      isClaimed: false,
      isFailed: false,
      children: (source.children || []).map((c, idx) => ({
        ...c,
        id: `${now}-c-${idx}${c.timeSlot === "day" ? "-sun" : c.timeSlot === "night" ? "-moon" : ""}`,
        isCompleted: resetProgress ? false : c.isCompleted,
        isClaimed: false,
        isFailed: false,
      })),
      milestones: source.milestones?.map((m, idx) => ({
        ...m,
        id: `${now}-m-${idx}`,
        isClaimed: false,
      })),
      listItems: source.listItems?.map((li, idx) => ({
        ...li,
        id: `${now}-l-${idx}`,
        isCompleted: resetProgress ? (source.listHasCheckboxes === false ? true : false) : li.isCompleted,
        isClaimed: false,
      })),
    };

    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goalId);
      if (idx === -1) return [cloned, ...prev];
      const next = [...prev];
      next.splice(idx + 1, 0, cloned);
      return next;
    });
    playSound("click");
    return cloned;
  };

  const startNewCycle = (mode: "daily" | "weekly" | "all") => {
    setDailyBountyClaimedDate("");
    setGoals((prev) =>
      prev.map((g) => {
        const shouldReset =
          mode === "all" ||
          (mode === "daily" && g.type === "daily") ||
          (mode === "weekly" && (g.type === "daily" || g.type === "weekly"));
        if (!shouldReset) return g;
        return {
          ...g,
          isCompleted: false,
          isClaimed: false,
          isFailed: false,
          children: g.children.map((c) => ({
            ...c,
            isCompleted: false,
            isClaimed: false,
            isFailed: false,
          })),
          milestones: g.milestones?.map((m) => ({ ...m, isClaimed: false })),
          listItems: g.listItems?.map((l) => ({ ...l, isCompleted: false, isClaimed: false })),
        };
      })
    );
  };

  const resetApp = () => {
    setSpCoins(0);
    setSpinTokens(0);
    setDailyBountyClaimedDate("");
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        isCompleted: false,
        isClaimed: false,
        isFailed: false,
        children: g.children.map((c) => ({ ...c, isCompleted: false, isClaimed: false, isFailed: false })),
        milestones: g.milestones?.map((m) => ({ ...m, isClaimed: false })),
        listItems: g.listItems?.map((l) => ({ ...l, isCompleted: false, isClaimed: false })),
      }))
    );
    setInventory([]);
    setTimeAllowances([]);
    setHistory([]);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isDev = process.env.NODE_ENV === "development";

  if (loadingAuth || !mounted) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 font-bold text-slate-600 dark:text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg animate-bounce shadow-lg shadow-indigo-500/30">
          SP
        </div>
        <span className="tracking-wider uppercase text-xs font-extrabold">Initializing Quest Engine...</span>
      </div>
    );
  }
  if (!user && !isDev) return <AuthScreen />;

  return (
    <AppContext.Provider
      value={{
        spCoins,
        setSpCoins,
        spinTokens,
        setSpinTokens,
        goals,
        setGoals,
        wheelSlices,
        setWheelSlices,
        inventory,
        setInventory,
        timeAllowances,
        setTimeAllowances,
        history,
        setHistory,
        financeData,
        setFinanceData,
        lifetimeXp,
        setLifetimeXp,
        streak,
        setStreak,
        quotes,
        setQuotes,
        bannerImage,
        setBannerImage,
        clearViewImage,
        setClearViewImage,
        darkMode,
        setDarkMode,
        cleanMode,
        setCleanMode,
        clearViewShowSidebar,
        setClearViewShowSidebar,
        soundEnabled,
        setSoundEnabled,
        stickyNotes,
        setStickyNotes,
        dailyBountyClaimedDate,
        setDailyBountyClaimedDate,
        activeAllowanceTimer,
        setActiveAllowanceTimer,
        awardSpAndXp,
        recordDailyActivity,
        duplicateGoal,
        playSound,
        startNewCycle,
        resetApp,
        user,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};