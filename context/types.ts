import { User } from "@supabase/supabase-js";

export interface ChildTask {
  id: string;
  title: string;
  reward: number;
  isCompleted: boolean;
  isClaimed?: boolean;
  isOptional?: boolean;
  isFailed?: boolean;
  assignedDays?: string[];
  startTime?: string;
  endTime?: string;
  assignOrder?: number;
  icon?: string;
  timeSlot?: "day" | "night";
  notes?: string;
}

export interface Milestone {
  id: string;
  at: number;
  reward: number;
  isClaimed: boolean;
  isOptional?: boolean;
}

export interface ListItem {
  id: string;
  title: string;
  isCompleted: boolean;
  reward?: number;
  isClaimed?: boolean;
}

export type GoalPriority = "normal" | "high" | "boss";

export interface Goal {
  id: string;
  title: string;
  type: "weekly" | "daily" | "list";
  frequency?: "once" | "day-night";
  reward: number;
  isCompleted: boolean;
  isClaimed?: boolean;
  isOptional?: boolean;
  isFailed?: boolean;
  theme?: string;
  icon?: string;
  priority?: GoalPriority;
  category?: string;
  notes?: string;
  estimatedMinutes?: number;
  assignedDays?: string[];
  startTime?: string;
  endTime?: string;
  assignOrder?: number;
  children: ChildTask[];
  targetCount?: number;
  milestones?: Milestone[];
  listItems?: ListItem[];
  listHasCheckboxes?: boolean;
  listItemReward?: number;
}

export interface StickyNoteItem {
  id: string;
  title: string;
  content: string;
  color: "amber" | "mint" | "rose" | "sky" | "violet";
  updatedAt: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  shields: number;
  enableMultiplier: boolean;
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
  id: string;
  text: string;
  color: string;
  rewards: RewardItem[];
  enchantments?: string[];
}
export interface InventoryItem {
  id: string;
  slice: WheelSlice;
  timestamp: string;
}
export interface TimeAllowance {
  target: string;
  permanentSeconds: number;
  boosterSeconds: number;
  lastUpdated: string;
}
export interface HistoryItem {
  id: string;
  result: string;
  timestamp: string;
}

export type TransactionType = "Income" | "Spending" | "Move";
export interface FinanceCategory {
  id: string;
  name: string;
  type: "Income" | "Spending";
}
export interface FinanceAccount {
  id: string;
  name: string;
  initialBalance?: number;
}
export interface FinanceBudget {
  id: string;
  name: string;
  initialBalance?: number;
}
export interface Transaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  budgetId: string;
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

export interface ActiveAllowanceTimer {
  target: string;
  startedAt: number;
}

export type RpgSoundType = "check" | "claim" | "quest" | "levelup" | "click" | "spin";

export interface AppContextType {
  spCoins: number;
  setSpCoins: React.Dispatch<React.SetStateAction<number>>;
  spinTokens: number;
  setSpinTokens: React.Dispatch<React.SetStateAction<number>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  wheelSlices: WheelSlice[];
  setWheelSlices: React.Dispatch<React.SetStateAction<WheelSlice[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  timeAllowances: TimeAllowance[];
  setTimeAllowances: React.Dispatch<React.SetStateAction<TimeAllowance[]>>;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  financeData: FinanceData;
  setFinanceData: React.Dispatch<React.SetStateAction<FinanceData>>;
  lifetimeXp: number;
  setLifetimeXp: React.Dispatch<React.SetStateAction<number>>;
  streak: StreakData;
  setStreak: React.Dispatch<React.SetStateAction<StreakData>>;
  quotes: string[];
  setQuotes: React.Dispatch<React.SetStateAction<string[]>>;
  bannerImage: string | null;
  setBannerImage: React.Dispatch<React.SetStateAction<string | null>>;
  clearViewImage: string | null;
  setClearViewImage: React.Dispatch<React.SetStateAction<string | null>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  cleanMode: boolean;
  setCleanMode: React.Dispatch<React.SetStateAction<boolean>>;
  clearViewShowSidebar: boolean;
  setClearViewShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  stickyNotes: StickyNoteItem[];
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNoteItem[]>>;
  dailyBountyClaimedDate: string;
  setDailyBountyClaimedDate: React.Dispatch<React.SetStateAction<string>>;
  activeAllowanceTimer: ActiveAllowanceTimer | null;
  setActiveAllowanceTimer: React.Dispatch<React.SetStateAction<ActiveAllowanceTimer | null>>;
  awardSpAndXp: (baseSp: number, applyStreakBonus?: boolean) => number;
  recordDailyActivity: () => void;
  duplicateGoal: (goalId: string, resetProgress?: boolean) => Goal | null;
  playSound: (type: RpgSoundType) => void;
  startNewCycle: (mode: "daily" | "weekly" | "all") => void;
  resetApp: () => void;
  user: User | null;
  logout: () => void;
}

export const MON_TO_SUN = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function buildDefaultDailyChildren(
  frequency: "once" | "day-night" = "once",
  rewardPerSlot = 15
): ChildTask[] {
  const stamp = Date.now();
  if (frequency === "day-night") {
    return MON_TO_SUN.flatMap((day, i) => [
      {
        id: `${stamp}-${i}-sun`,
        title: day,
        reward: rewardPerSlot,
        isCompleted: false,
        isClaimed: false,
        assignedDays: [day],
        startTime: "08:00",
        timeSlot: "day" as const,
      },
      {
        id: `${stamp}-${i}-moon`,
        title: day,
        reward: rewardPerSlot,
        isCompleted: false,
        isClaimed: false,
        assignedDays: [day],
        startTime: "20:00",
        timeSlot: "night" as const,
      },
    ]);
  }
  return MON_TO_SUN.map((day, i) => ({
    id: `${stamp}-${i}`,
    title: day,
    reward: rewardPerSlot,
    isCompleted: false,
    isClaimed: false,
    assignedDays: [day],
  }));
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

export function getLevelInfo(xp: number) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  let needed = 250;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 250 + (level - 1) * 100;
  }
  const titles = [
    "Novice Tracker",
    "Habit Apprentice",
    "Routine Scout",
    "Focus Ranger",
    "Quest Vanguard",
    "Momentum Knight",
    "Discipline Master",
    "Chrono Paladin",
    "Grand Architect",
    "Mythic Sovereign",
  ];
  const rankTitle = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 2))];
  const progressPct = Math.min(100, Math.round((remaining / needed) * 100));
  return { level, currentLevelXp: remaining, nextLevelXp: needed, progressPct, rankTitle };
}

export const DEFAULT_STARTER_GOALS: Goal[] = [
  {
    id: "g-starter-1",
    title: "Weekly Creative Boss Sprint",
    type: "weekly",
    reward: 300,
    isCompleted: false,
    isClaimed: false,
    theme: "lavender",
    icon: "drawing",
    priority: "boss",
    category: "Creative",
    notes: "Complete the main creative milestones before Sunday review.",
    children: [
      {
        id: "c-st-1",
        title: "Draft concept & references",
        reward: 60,
        isCompleted: true,
        isClaimed: true,
        assignedDays: ["Monday"],
        startTime: "09:30",
      },
      {
        id: "c-st-2",
        title: "Complete main production block",
        reward: 80,
        isCompleted: true,
        isClaimed: false,
        assignedDays: ["Wednesday"],
        startTime: "14:00",
      },
      {
        id: "c-st-3",
        title: "Polish & publish final piece",
        reward: 80,
        isCompleted: false,
        isClaimed: false,
        assignedDays: ["Friday"],
        startTime: "16:00",
      },
      {
        id: "c-st-4",
        title: "Bonus: Behind-the-scenes log",
        reward: 50,
        isCompleted: false,
        isClaimed: false,
        isOptional: true,
        assignedDays: ["Saturday"],
      },
    ],
  },
  {
    id: "g-starter-2",
    title: "Morning & Evening Vitality",
    type: "daily",
    frequency: "day-night",
    reward: 150,
    isCompleted: false,
    isClaimed: false,
    theme: "mint",
    icon: "skincare",
    priority: "high",
    category: "Health",
    children: MON_TO_SUN.flatMap((day, i) => [
      {
        id: `d-st-${i}-sun`,
        title: day,
        reward: 15,
        isCompleted: i < 3,
        isClaimed: i < 2,
        assignedDays: [day],
        startTime: "08:00",
        timeSlot: "day" as const,
      },
      {
        id: `d-st-${i}-moon`,
        title: day,
        reward: 15,
        isCompleted: i < 2,
        isClaimed: i < 2,
        assignedDays: [day],
        startTime: "20:30",
        timeSlot: "night" as const,
      },
    ]),
  },
  {
    id: "g-starter-3",
    title: "Knowledge & Skill Mastery Tome",
    type: "list",
    reward: 200,
    isCompleted: false,
    isClaimed: false,
    theme: "sky",
    icon: "study",
    priority: "normal",
    category: "Study",
    targetCount: 5,
    listHasCheckboxes: true,
    listItemReward: 15,
    children: [],
    listItems: [
      { id: "li-1", title: "Chapter 1: Core Systems & Loops", isCompleted: true, reward: 15, isClaimed: true },
      { id: "li-2", title: "Chapter 2: Tactile Game Feel", isCompleted: true, reward: 15, isClaimed: false },
      { id: "li-3", title: "Chapter 3: Strategic Resource Allocation", isCompleted: false, reward: 15, isClaimed: false },
    ],
    milestones: [
      { id: "ms-1", at: 2, reward: 50, isClaimed: false },
      { id: "ms-2", at: 5, reward: 120, isClaimed: false },
    ],
  },
];

export const DEFAULT_STICKY_NOTES: StickyNoteItem[] = [
  {
    id: "sn-1",
    title: "Guild Notice & Quick Notes",
    content:
      "• Finish today's active quests for the Full-Clear Bounty!\n• Remember to assign weekly tasks to specific days.\n• Click the Pin icon to keep this scroll open.",
    color: "amber",
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_FINANCE_DATA: FinanceData = {
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

export const DEFAULT_STREAK: StreakData = {
  current: 1,
  longest: 3,
  lastActiveDate: "",
  shields: 1,
  enableMultiplier: true,
};