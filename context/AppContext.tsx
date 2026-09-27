"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface ChildTask {
  id: string; title: string; reward: number; isCompleted: boolean; isClaimed?: boolean;
}

export interface Goal {
  id: string; title: string; type: "weekly" | "daily"; frequency?: "once" | "day-night";
  reward: number; isCompleted: boolean; isClaimed?: boolean; children: ChildTask[];
}

export type SliceType = "permanent" | "booster" | "token";

export interface RewardItem {
  id: string;
  type: SliceType;
  target: string;
  durationSeconds: number;
  spinTokens: number;
  isWildcard?: boolean;
}

export interface WheelSlice {
  id: string; text: string; color: string; rewards: RewardItem[]; enchantments?: string[];
}

export interface InventoryItem {
  id: string; slice: WheelSlice; timestamp: string;
}

export interface TimeAllowance {
  target: string; permanentSeconds: number; boosterSeconds: number; lastUpdated: string; 
}

export interface HistoryItem {
  id: string; result: string; timestamp: string;
}

interface AppContextType {
  spCoins: number; setSpCoins: React.Dispatch<React.SetStateAction<number>>;
  spinTokens: number; setSpinTokens: React.Dispatch<React.SetStateAction<number>>;
  goals: Goal[]; setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  wheelSlices: WheelSlice[]; setWheelSlices: React.Dispatch<React.SetStateAction<WheelSlice[]>>;
  inventory: InventoryItem[]; setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  timeAllowances: TimeAllowance[]; setTimeAllowances: React.Dispatch<React.SetStateAction<TimeAllowance[]>>;
  history: HistoryItem[]; setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSlices: WheelSlice[] = [
  { id: "1", text: "8m Clash Royale", color: "hsl(0, 70%, 75%)", rewards: [{ id: "r1", type: "permanent", target: "Clash Royale", durationSeconds: 480, spinTokens: 0 }] },
  { id: "2", text: "5m Clash Royale", color: "hsl(36, 70%, 75%)", rewards: [{ id: "r2", type: "permanent", target: "Clash Royale", durationSeconds: 300, spinTokens: 0 }] },
  { id: "3", text: "30m CR Booster", color: "hsl(72, 70%, 75%)", rewards: [{ id: "r3", type: "booster", target: "Clash Royale", durationSeconds: 1800, spinTokens: 0 }] },
  { id: "4", text: "8m Threads", color: "hsl(108, 70%, 75%)", rewards: [{ id: "r4", type: "permanent", target: "Threads", durationSeconds: 480, spinTokens: 0 }] },
  { id: "5", text: "5m Threads", color: "hsl(144, 70%, 75%)", rewards: [{ id: "r5", type: "permanent", target: "Threads", durationSeconds: 300, spinTokens: 0 }] },
  { id: "6", text: "30m Threads Boost", color: "hsl(180, 70%, 75%)", rewards: [{ id: "r6", type: "booster", target: "Threads", durationSeconds: 1800, spinTokens: 0 }] },
  { id: "7", text: "8m Instagram", color: "hsl(216, 70%, 75%)", rewards: [{ id: "r7", type: "permanent", target: "Instagram", durationSeconds: 480, spinTokens: 0 }] },
  { id: "8", text: "2m IG + 1 Token", color: "hsl(252, 70%, 75%)", rewards: [{ id: "r8a", type: "permanent", target: "Instagram", durationSeconds: 120, spinTokens: 0 }, { id: "r8b", type: "token", target: "", durationSeconds: 0, spinTokens: 1 }] },
  { id: "9", text: "8m TikTok", color: "hsl(288, 70%, 75%)", rewards: [{ id: "r9", type: "permanent", target: "TikTok", durationSeconds: 480, spinTokens: 0 }] },
  { id: "10", text: "2m TT + 1 Token", color: "hsl(324, 70%, 75%)", rewards: [{ id: "r10a", type: "permanent", target: "TikTok", durationSeconds: 120, spinTokens: 0 }, { id: "r10b", type: "token", target: "", durationSeconds: 0, spinTokens: 1 }] },
  { id: "11", text: "15m Wild Card", color: "hsl(340, 70%, 75%)", rewards: [{ id: "r11", type: "permanent", target: "Any App", durationSeconds: 900, spinTokens: 0, isWildcard: true }] },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [spCoins, setSpCoins] = useState(0);
  const [spinTokens, setSpinTokens] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wheelSlices, setWheelSlices] = useState<WheelSlice[]>(defaultSlices);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [timeAllowances, setTimeAllowances] = useState<TimeAllowance[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedCoins = localStorage.getItem("spCoins");
    if (savedCoins) setSpCoins(Number(savedCoins)); else setSpCoins(10000); 

    if (localStorage.getItem("spinTokens")) setSpinTokens(Number(localStorage.getItem("spinTokens")));
    if (localStorage.getItem("goals")) setGoals(JSON.parse(localStorage.getItem("goals")!));
    if (localStorage.getItem("wheelSlices")) setWheelSlices(JSON.parse(localStorage.getItem("wheelSlices")!));
    if (localStorage.getItem("inventory")) setInventory(JSON.parse(localStorage.getItem("inventory")!));
    if (localStorage.getItem("timeAllowances")) setTimeAllowances(JSON.parse(localStorage.getItem("timeAllowances")!));
    if (localStorage.getItem("history")) setHistory(JSON.parse(localStorage.getItem("history")!));
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("spCoins", spCoins.toString()); localStorage.setItem("spinTokens", spinTokens.toString());
      localStorage.setItem("goals", JSON.stringify(goals)); localStorage.setItem("wheelSlices", JSON.stringify(wheelSlices));
      localStorage.setItem("inventory", JSON.stringify(inventory)); localStorage.setItem("timeAllowances", JSON.stringify(timeAllowances));
      localStorage.setItem("history", JSON.stringify(history));
    }
  }, [spCoins, spinTokens, goals, wheelSlices, inventory, timeAllowances, history, mounted]);

  const resetApp = () => {
    setSpCoins(0); setSpinTokens(0); 
    setGoals(prev => prev.map(g => ({
       ...g, isCompleted: false, isClaimed: false,
       children: g.children.map(c => ({...c, isCompleted: false, isClaimed: false}))
    })));
    setInventory([]); setTimeAllowances([]); setHistory([]);
  };

  if (!mounted) return null;
  return (
    <AppContext.Provider value={{ spCoins, setSpCoins, spinTokens, setSpinTokens, goals, setGoals, wheelSlices, setWheelSlices, inventory, setInventory, timeAllowances, setTimeAllowances, history, setHistory, resetApp }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};