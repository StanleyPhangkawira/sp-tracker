"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthScreen from "../components/AuthScreen";
import { User } from "@supabase/supabase-js";

export interface ChildTask { 
  id: string; title: string; reward: number; 
  isCompleted: boolean; isClaimed?: boolean; 
  isOptional?: boolean; isFailed?: boolean; 
  assignedDays?: string[]; 
  startTime?: string;
  endTime?: string;
  assignOrder?: number;
}
export interface Milestone { 
  id: string; at: number; reward: number; isClaimed: boolean; 
  isOptional?: boolean; 
}
export interface ListItem { id: string; title: string; isCompleted: boolean; } 

export interface Goal { 
  id: string; title: string; 
  type: "weekly" | "daily" | "list"; 
  frequency?: "once" | "day-night"; 
  reward: number; isCompleted: boolean; isClaimed?: boolean; 
  isOptional?: boolean; isFailed?: boolean;
  children: ChildTask[];
  targetCount?: number; milestones?: Milestone[]; listItems?: ListItem[];
  listHasCheckboxes?: boolean; 
}
export type SliceType = "permanent" | "booster" | "token";
export interface RewardItem { id: string; type: SliceType; target: string; durationSeconds: number; spinTokens: number; isWildcard?: boolean; }
export interface WheelSlice { id: string; text: string; color: string; rewards: RewardItem[]; enchantments?: string[]; }
export interface InventoryItem { id: string; slice: WheelSlice; timestamp: string; }
export interface TimeAllowance { target: string; permanentSeconds: number; boosterSeconds: number; lastUpdated: string; }
export interface HistoryItem { id: string; result: string; timestamp: string; }

export type TransactionType = "Income" | "Spending" | "Move";
export interface FinanceCategory { id: string; name: string; type: "Income" | "Spending"; }
export interface FinanceAccount { id: string; name: string; }
export interface FinanceBudget { id: string; name: string; }
export interface Transaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  budgetId: string;
  // For Move transactions: destination account/budget
  toAccountId?: string;
  toBudgetId?: string;
  timestamp: string;
}
export interface FinanceData {
  transactions: Transaction[];
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  budgets: FinanceBudget[];
}

interface AppContextType {
  spCoins: number; setSpCoins: React.Dispatch<React.SetStateAction<number>>;
  spinTokens: number; setSpinTokens: React.Dispatch<React.SetStateAction<number>>;
  goals: Goal[]; setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  wheelSlices: WheelSlice[]; setWheelSlices: React.Dispatch<React.SetStateAction<WheelSlice[]>>;
  inventory: InventoryItem[]; setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  timeAllowances: TimeAllowance[]; setTimeAllowances: React.Dispatch<React.SetStateAction<TimeAllowance[]>>;
  history: HistoryItem[]; setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  financeData: FinanceData; setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  resetApp: () => void;
  user: User | null;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [spCoins, setSpCoins] = useState(0);
  const [spinTokens, setSpinTokens] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wheelSlices, setWheelSlices] = useState<WheelSlice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [timeAllowances, setTimeAllowances] = useState<TimeAllowance[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const defaultFinanceData: FinanceData = {
    transactions: [],
    categories: [
      { id: "cat-1", name: "Salary", type: "Income" },
      { id: "cat-2", name: "Freelance", type: "Income" },
      { id: "cat-3", name: "Food", type: "Spending" },
      { id: "cat-4", name: "Transport", type: "Spending" },
      { id: "cat-5", name: "Entertainment", type: "Spending" },
      { id: "cat-6", name: "Shopping", type: "Spending" },
      { id: "cat-7", name: "Bills", type: "Spending" },
    ],
    accounts: [{ id: "acc-1", name: "Wallet" }],
    budgets: [{ id: "bud-1", name: "General" }],
  };
  const [financeData, setFinanceData] = useState<FinanceData>(defaultFinanceData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setLoadingAuth(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedCoins = localStorage.getItem("spCoins"); if (savedCoins) setSpCoins(Number(savedCoins)); else setSpCoins(10000); 
    if (localStorage.getItem("spinTokens")) setSpinTokens(Number(localStorage.getItem("spinTokens")));
    if (localStorage.getItem("goals")) setGoals(JSON.parse(localStorage.getItem("goals")!));
    if (localStorage.getItem("wheelSlices")) setWheelSlices(JSON.parse(localStorage.getItem("wheelSlices")!));
    if (localStorage.getItem("inventory")) setInventory(JSON.parse(localStorage.getItem("inventory")!));
    if (localStorage.getItem("timeAllowances")) setTimeAllowances(JSON.parse(localStorage.getItem("timeAllowances")!));
    if (localStorage.getItem("history")) setHistory(JSON.parse(localStorage.getItem("history")!));
    if (localStorage.getItem("financeData")) setFinanceData(JSON.parse(localStorage.getItem("financeData")!));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    const fetchCloudData = async () => {
      const { data, error } = await supabase.from('user_data').select('*').eq('id', user.id).single();
      if (data) {
        setSpCoins(data.sp_coins); setSpinTokens(data.spin_tokens);
        setGoals(data.goals); setWheelSlices(data.wheel_slices);
        setInventory(data.inventory); setTimeAllowances(data.time_allowances); setHistory(data.history);
        if (data.finance_data) setFinanceData(data.finance_data);
      } else if (error && error.code === 'PGRST116') {
        await supabase.from('user_data').insert({
          id: user.id, sp_coins: spCoins, spin_tokens: spinTokens, goals, 
          wheel_slices: wheelSlices, inventory, time_allowances: timeAllowances, history,
          finance_data: financeData
        });
      }
    };
    fetchCloudData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mounted]); 

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("spCoins", spCoins.toString()); localStorage.setItem("spinTokens", spinTokens.toString());
    localStorage.setItem("goals", JSON.stringify(goals)); localStorage.setItem("wheelSlices", JSON.stringify(wheelSlices));
    localStorage.setItem("inventory", JSON.stringify(inventory)); localStorage.setItem("timeAllowances", JSON.stringify(timeAllowances));
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("financeData", JSON.stringify(financeData));

    if (!user) return;
    const timeoutId = setTimeout(async () => {
      await supabase.from('user_data').upsert({
        id: user.id, sp_coins: spCoins, spin_tokens: spinTokens, goals, 
        wheel_slices: wheelSlices, inventory, time_allowances: timeAllowances, history,
        finance_data: financeData
      });
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [spCoins, spinTokens, goals, wheelSlices, inventory, timeAllowances, history, financeData, mounted, user]);

  const resetApp = () => {
    setSpCoins(0); setSpinTokens(0); 
    setGoals(prev => prev.map(g => ({ 
      ...g, isCompleted: false, isClaimed: false, 
      children: g.children.map(c => ({...c, isCompleted: false, isClaimed: false})), 
      milestones: g.milestones?.map(m => ({...m, isClaimed: false})),
      listItems: g.listItems?.map(l => ({...l, isCompleted: false}))
    })));
    setInventory([]); setTimeAllowances([]); setHistory([]);
  };

  const logout = async () => { await supabase.auth.signOut(); };

  const isDev = process.env.NODE_ENV === 'development';

  if (loadingAuth || !mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Loading Sync Engine...</div>;
  if (!user && !isDev) return <AuthScreen />;

  return (
    <AppContext.Provider value={{ spCoins, setSpCoins, spinTokens, setSpinTokens, goals, setGoals, wheelSlices, setWheelSlices, inventory, setInventory, timeAllowances, setTimeAllowances, history, setHistory, financeData, setFinanceData, resetApp, user, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};