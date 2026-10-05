"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
  Wallet, PiggyBank, Tag, TrendingUp, TrendingDown, Settings2,
  ChevronDown, ChevronUp, Search, Filter, Pencil, ArrowDownUp, Check,
} from "lucide-react";
import { useAppContext, Transaction, TransactionType, FinanceCategory, FinanceAccount, FinanceBudget } from "../../context/AppContext";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<TransactionType, { icon: typeof ArrowDownLeft; color: string; bg: string; border: string; label: string }> = {
  Income:   { icon: ArrowDownLeft,   color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", label: "Income" },
  Spending: { icon: ArrowUpRight,    color: "text-red-500",     bg: "bg-red-50",      border: "border-red-200",     label: "Spending" },
  Move:     { icon: ArrowRightLeft,  color: "text-blue-500",    bg: "bg-blue-50",     border: "border-blue-200",    label: "Move" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

const formatSigned = (n: number) => `${n < 0 ? "-" : ""}${formatCurrency(Math.abs(n))}`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}


/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

type MoveRole = "from" | "to" | "stay" | null; // "stay" = this side of the move is unchanged (e.g. same account, different budget)
type MoveSel = { fromAcc: string; toAcc: string; fromBud: string; toBud: string };
const EMPTY_MOVE: MoveSel = { fromAcc: "", toAcc: "", fromBud: "", toBud: "" };

/**
 * Text input that shows thousands dots while you type (1.000.000, decimal comma).
 * `value` is the raw string the rest of the page parses: "1500000" or "1500000.5".
 */
function MoneyInput({ value, onChange, allowNegative = false, ...rest }: {
  value: string; onChange: (raw: string) => void; allowNegative?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode">) {
  const neg = value.startsWith("-");
  const [int, dec] = (neg ? value.slice(1) : value).split(".");
  const shown = (neg ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dec !== undefined ? "," + dec : "");
  return (
    <input
      {...rest} type="text" inputMode="decimal" value={shown}
      onChange={e => {
        const raw = e.target.value.replace(/\./g, "").replace(",", ".");
        if ((allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/).test(raw)) onChange(raw);
      }}
    />
  );
}

/** Initial-balance field: keeps its own draft text, so "-" or "12," can be typed without the value snapping back. */
function BalanceInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(value ? String(value) : "");
  return (
    <MoneyInput
      allowNegative placeholder="0" aria-label="Initial balance" value={draft}
      onChange={raw => { setDraft(raw); onCommit(parseFloat(raw) || 0); }}
      onBlur={() => setDraft(value ? String(value) : "")}
      className="w-32 p-1.5 text-right text-sm font-semibold border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

/** One line in Account/Budget Balances. In Move Mode the whole row is a button and shows its From/To state. */
function BalanceRow({ name, balance, role, delta, moveMode, onPick, children }: {
  name: string; balance: number; role: MoveRole; delta: number; moveMode: boolean; onPick: () => void; children?: React.ReactNode;
}) {
  const tone = role === "from" ? "border-red-400 bg-red-50/50"
    : role === "to" ? "border-green-500 bg-green-50/50"
    : role === "stay" ? "border-blue-300 bg-blue-50/50"
    : moveMode ? "border-transparent hover:border-gray-300 hover:bg-gray-50" : "border-transparent hover:bg-gray-50";
  return (
    <div
      {...(moveMode ? {
        role: "button", tabIndex: 0, onClick: onPick,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); } },
      } : {})}
      className={`py-1.5 px-2 rounded-lg border transition-colors ${moveMode ? "cursor-pointer select-none" : ""} ${tone}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0 text-sm text-gray-600">
          <span className="truncate">{name}</span>
          {role && (
            <span className={`shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${role === "from" ? "bg-red-100 text-red-600" : role === "to" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"}`}>
              {role === "from" ? "FROM" : role === "to" ? "TO" : "SAME"}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {(role === "from" || role === "to") && delta > 0 && (
            <span className={`text-[11px] font-bold ${role === "from" ? "text-red-400" : "text-green-600"}`}>
              {role === "from" ? "-" : "+"}{formatCurrency(delta)}
            </span>
          )}
          <span className={`text-sm font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatSigned(balance)}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

/** A From/To slot in the Move panel. Empty = dashed hint; filled = coloured box, tap the X to clear it. */
function SlotBox({ label, tone, name, balance = 0, onClear, kept }: {
  label: string; tone: "from" | "to"; name?: string; balance?: number; onClear: () => void; kept?: boolean;
}) {
  if (kept && name !== undefined) { // this side doesn't change: show it as inherited from the other slot
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
        <span className="min-w-0 truncate text-sm text-blue-700">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-blue-400">{label}</span>{name}
        </span>
        <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">SAME</span>
      </div>
    );
  }
  if (name === undefined) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 bg-white/60 px-3 py-2 text-xs text-gray-400">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <span>Tap one below</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 ${tone === "from" ? "border-red-400" : "border-green-500"}`}>
      <span className="min-w-0 truncate text-sm text-gray-700">
        <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>{name}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatSigned(balance)}</span>
        <button onClick={onClear} aria-label={`Clear ${label}`} className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"><X size={14} /></button>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function FinancePage() {
  const { financeData, setFinanceData } = useAppContext();
  const { transactions, categories, accounts, budgets } = financeData;

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<TransactionType>("Spending");
  const [formAmount, setFormAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formBudgetId, setFormBudgetId] = useState("");
  const [formToAccountId, setFormToAccountId] = useState("");
  const [formToBudgetId, setFormToBudgetId] = useState("");

  const [unassignedOpen, setUnassignedOpen] = useState(false); // touch devices: tap the row to show the prompt

  // Move Mode state
  const [moveMode, setMoveMode] = useState(false);
  const [mv, setMv] = useState<MoveSel>(EMPTY_MOVE);
  const [mvAmount, setMvAmount] = useState("");
  const [mvNote, setMvNote] = useState("");

  // Manage modal state
  const [manageTab, setManageTab] = useState<"categories" | "accounts" | "budgets">("categories");
  const [newItemName, setNewItemName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"Income" | "Spending">("Spending");

  // ----- Derived data -----
  const filteredCategories = useMemo(() => {
    if (formType === "Move") return [];
    return categories.filter(c => c.type === formType);
  }, [categories, formType]);

  const defaultCategoryId = useMemo(() => {
    const spending = categories.find(c => c.type === "Spending");
    return spending?.id || "";
  }, [categories]);

  const defaultAccountId = useMemo(() => accounts[0]?.id || "", [accounts]);
  const defaultBudgetId = useMemo(() => budgets[0]?.id || "", [budgets]);

  // ----- Summary calculations -----
  // Budget "Added" = initial + income + money moved in; "Spent" = spending; "Moved out" = money moved to other budgets.
  // Current = Added - Spent - Moved out.
  const { totalIncome, totalSpending, netBalance, accountBalances, budgetStats, budgetBalances } = useMemo(() => {
    let totalIncome = 0;
    let totalSpending = 0;
    const accBal: Record<string, number> = {};
    const stats: Record<string, { added: number; spent: number; movedOut: number }> = {};
    const bud = (id: string) => (stats[id] = stats[id] || { added: 0, spent: 0, movedOut: 0 });

    accounts.forEach(a => { accBal[a.id] = a.initialBalance ?? 0; });
    budgets.forEach(b => { bud(b.id).added = b.initialBalance ?? 0; });

    transactions.forEach(t => {
      if (t.type === "Income") {
        totalIncome += t.amount;
        accBal[t.accountId] = (accBal[t.accountId] || 0) + t.amount;
        bud(t.budgetId).added += t.amount;
      } else if (t.type === "Spending") {
        totalSpending += t.amount;
        accBal[t.accountId] = (accBal[t.accountId] || 0) - t.amount;
        bud(t.budgetId).spent += t.amount;
      } else if (t.type === "Move") {
        accBal[t.accountId] = (accBal[t.accountId] || 0) - t.amount;
        if (t.toAccountId) accBal[t.toAccountId] = (accBal[t.toAccountId] || 0) + t.amount;
        if (t.toBudgetId && t.toBudgetId !== t.budgetId) { // same budget on both sides = nothing moved
          bud(t.budgetId).movedOut += t.amount;
          bud(t.toBudgetId).added += t.amount;
        }
      }
    });

    const budBal: Record<string, number> = {};
    Object.entries(stats).forEach(([id, st]) => { budBal[id] = st.added - st.spent - st.movedOut; });

    // Net balance = everything you hold = sum of all account balances (initial balances included).
    const initialTotal = accounts.reduce((sum, a) => sum + (a.initialBalance ?? 0), 0);
    return { totalIncome, totalSpending, netBalance: initialTotal + totalIncome - totalSpending, accountBalances: accBal, budgetStats: stats, budgetBalances: budBal };
  }, [transactions, accounts, budgets]);

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filterType !== "All") list = list.filter(t => t.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, filterType, searchQuery]);

  // ----- Actions -----
  const resetForm = () => {
    setFormName(""); setFormAmount(""); setFormType("Spending");
    setFormCategoryId(""); setFormAccountId(""); setFormBudgetId("");
    setFormToAccountId(""); setFormToBudgetId("");
  };

  const addTransaction = () => {
    const amount = parseFloat(formAmount);
    if (!formName.trim() || isNaN(amount) || amount <= 0) return;

    const effectiveCategoryId = formType === "Move" ? "" : (formCategoryId || defaultCategoryId);
    const effectiveAccountId = formAccountId || defaultAccountId;
    const effectiveBudgetId = formBudgetId || defaultBudgetId;

    const newTxn: Transaction = {
      id: Date.now().toString(),
      name: formName.trim(),
      type: formType,
      amount,
      categoryId: effectiveCategoryId,
      accountId: effectiveAccountId,
      budgetId: effectiveBudgetId,
      toAccountId: formType === "Move" ? (formToAccountId || defaultAccountId) : undefined,
      toBudgetId: formType === "Move" ? (formToBudgetId || defaultBudgetId) : undefined,
      timestamp: new Date().toISOString(),
    };

    setFinanceData(prev => ({ ...prev, transactions: [...prev.transactions, newTxn] }));
    resetForm();
    setShowForm(false);
  };

  const deleteTransaction = (id: string) => {
    setFinanceData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const addCategory = () => {
    if (!newItemName.trim()) return;
    const newCat: FinanceCategory = { id: Date.now().toString(), name: newItemName.trim(), type: newCategoryType };
    setFinanceData(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
    setNewItemName("");
  };

  const addAccount = () => {
    if (!newItemName.trim()) return;
    const newAcc: FinanceAccount = { id: Date.now().toString(), name: newItemName.trim() };
    setFinanceData(prev => ({ ...prev, accounts: [...prev.accounts, newAcc] }));
    setNewItemName("");
  };

  const addBudget = () => {
    if (!newItemName.trim()) return;
    const newBud: FinanceBudget = { id: Date.now().toString(), name: newItemName.trim() };
    setFinanceData(prev => ({ ...prev, budgets: [...prev.budgets, newBud] }));
    setNewItemName("");
  };

  const deleteCategory = (id: string) => {
    setFinanceData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };
  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return; // Must keep at least one
    setFinanceData(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) }));
  };
  const deleteBudget = (id: string) => {
    if (budgets.length <= 1) return;
    setFinanceData(prev => ({ ...prev, budgets: prev.budgets.filter(b => b.id !== id) }));
  };

  const getName = (list: { id: string; name: string }[], id: string) => list.find(x => x.id === id)?.name || "Unknown";

  const setAccountInitial = (id: string, n: number) =>
    setFinanceData(prev => ({ ...prev, accounts: prev.accounts.map(a => (a.id === id ? { ...a, initialBalance: n } : a)) }));
  const setBudgetInitial = (id: string, n: number) =>
    setFinanceData(prev => ({ ...prev, budgets: prev.budgets.map(b => (b.id === id ? { ...b, initialBalance: n } : b)) }));
  // Leftover = everything the accounts hold minus everything assigned to a budget. Shown as a virtual "Unassigned" row.
  const unassigned = Math.round((netBalance - budgets.reduce((sum, b) => sum + (budgetBalances[b.id] || 0), 0)) * 100) / 100;
  const leftoverTarget = budgets.find(b => b.name.trim().toLowerCase() === "general") ?? budgets[0];
  const assignLeftover = () => {
    if (!leftoverTarget || unassigned === 0) return;
    // Booked as extra initial balance on the target budget, so its "Added" grows and the leftover drops to 0.
    setFinanceData(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => (b.id === leftoverTarget.id ? { ...b, initialBalance: Math.round(((b.initialBalance ?? 0) + unassigned) * 100) / 100 } : b)),
    }));
    setUnassignedOpen(false);
  };

  const initialAccTotal = accounts.reduce((sum, a) => sum + (a.initialBalance ?? 0), 0);
  const initialBudTotal = budgets.reduce((sum, b) => sum + (b.initialBalance ?? 0), 0);
  const openManage = (tab: "accounts" | "budgets") => { setManageTab(tab); setNewItemName(""); setShowManage(true); };

  // ----- Move Mode -----
  const moveAmount = parseFloat(mvAmount) || 0;
  // A side you leave half-filled just means "unchanged": From BCA with no To account keeps the money in BCA.
  const effFromAcc = mv.fromAcc || mv.toAcc, effToAcc = mv.toAcc || mv.fromAcc;
  const effFromBud = mv.fromBud || mv.toBud, effToBud = mv.toBud || mv.fromBud;
  const accMoves = !!effFromAcc && effFromAcc !== effToAcc;
  const budMoves = !!effFromBud && effFromBud !== effToBud;
  const moveReady = moveAmount > 0 && (accMoves || budMoves);
  const sidePart = (list: { id: string; name: string }[], from: string, to: string, moves: boolean, unit: string) =>
    moves ? `${getName(list, from)} → ${getName(list, to)}` : from ? `${getName(list, from)} (same ${unit})` : "";
  const moveHint = !(accMoves || budMoves) ? "Pick a different account, a different budget, or both. Anything you leave out stays the same."
    : moveAmount <= 0 ? "Enter an amount to move."
    : [sidePart(accounts, effFromAcc, effToAcc, accMoves, "account"), sidePart(budgets, effFromBud, effToBud, budMoves, "budget")].filter(Boolean).join("  ·  ");

  // Role of a balance row in the current move (drives the red/green/blue highlight).
  const rowRole = (dim: "Acc" | "Bud", id: string): MoveRole => {
    const f = mv[`from${dim}`], t = mv[`to${dim}`];
    if (dim === "Acc" ? accMoves : budMoves) return id === f ? "from" : id === t ? "to" : null;
    if (id !== (f || t)) return null;
    return (dim === "Acc" ? budMoves : accMoves) ? "stay" : f ? "from" : "to";
  };

  // First tap on a row = From, second = To. Tapping a selected row clears it; a third tap replaces the To.
  const pickMove = (dim: "Acc" | "Bud", id: string) => setMv(p => {
    const from = `from${dim}` as const, to = `to${dim}` as const;
    if (p[from] === id) return { ...p, [from]: "" };
    if (p[to] === id) return { ...p, [to]: "" };
    return p[from] ? { ...p, [to]: id } : { ...p, [from]: id };
  });
  const swapMove = () => setMv(p => ({ fromAcc: p.toAcc, toAcc: p.fromAcc, fromBud: p.toBud, toBud: p.fromBud }));
  const clearMove = () => { setMv(EMPTY_MOVE); setMvAmount(""); setMvNote(""); };
  const exitMoveMode = () => { clearMove(); setMoveMode(false); };

  const submitMove = () => {
    if (!moveReady) return;
    const accountId = effFromAcc || defaultAccountId;
    const budgetId = effFromBud || defaultBudgetId;
    const newTxn: Transaction = {
      id: Date.now().toString(),
      name: mvNote.trim() || "Move",
      type: "Move",
      amount: moveAmount,
      categoryId: "",
      accountId, budgetId,
      toAccountId: effToAcc || accountId, // an unchanged side moves "to itself", i.e. nothing changes there
      toBudgetId: effToBud || budgetId,
      timestamp: new Date().toISOString(),
    };
    setFinanceData(prev => ({ ...prev, transactions: [...prev.transactions, newTxn] }));
    clearMove(); // stay in Move Mode for the next transfer
  };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pb-24 md:pt-10 [color-scheme:light] [&_input]:text-gray-900 [&_select]:text-gray-900 [&_select]:bg-white [&_input]:placeholder:text-gray-400">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Finance</h1>
          <p className="text-gray-500 mt-1">Track your income, spending, and transfers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowManage(true); setNewItemName(""); }}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <Settings2 size={18} /> Manage
          </button>
          <button
            onClick={() => (moveMode ? exitMoveMode() : setMoveMode(true))}
            className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer ${
              moveMode ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ArrowRightLeft size={18} /> Move Mode
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-semibold text-gray-500">Total Income</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <TrendingDown size={20} />
            <span className="text-sm font-semibold text-gray-500">Total Spending</span>
          </div>
          <p className="text-2xl font-black text-red-500">{formatCurrency(totalSpending)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Wallet size={20} />
            <span className="text-sm font-semibold text-gray-500">Net Balance</span>
          </div>
          <p className={`text-2xl font-black ${netBalance >= 0 ? "text-blue-600" : "text-red-500"}`}>{netBalance < 0 ? "-" : ""}{formatCurrency(Math.abs(netBalance))}</p>
        </div>
      </div>

      {/* MOVE MODE PANEL */}
      <AnimatePresence initial={false}>
        {moveMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-blue-700"><ArrowRightLeft size={18} /> Move Mode</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tap a balance below to set <b className="text-red-500">From</b>, tap another to set <b className="text-green-600">To</b>. Do it in Accounts, Budgets, or both. A side you skip stays the same (BCA / General → BCA / Transport: tap BCA, General, then Transport).
                  </p>
                </div>
                <button onClick={exitMoveMode} title="Turn off Move Mode" aria-label="Turn off Move Mode"
                  className="shrink-0 p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_minmax(0,230px)] gap-3 items-start">
                <div className="space-y-2">
                  <div className="text-sm font-bold text-red-500">From</div>
                  <SlotBox label="Account" tone="from" name={effFromAcc ? getName(accounts, effFromAcc) : undefined} balance={accountBalances[effFromAcc]} kept={!mv.fromAcc && budMoves} onClear={() => setMv(p => ({ ...p, fromAcc: "" }))} />
                  <SlotBox label="Budget" tone="from" name={effFromBud ? getName(budgets, effFromBud) : undefined} balance={budgetBalances[effFromBud]} kept={!mv.fromBud && accMoves} onClear={() => setMv(p => ({ ...p, fromBud: "" }))} />
                </div>

                <button onClick={swapMove} title="Swap From and To" aria-label="Swap From and To"
                  className="self-center justify-self-center p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 md:-rotate-90 cursor-pointer">
                  <ArrowDownUp size={16} />
                </button>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-green-600">To</div>
                  <SlotBox label="Account" tone="to" name={mv.toAcc ? getName(accounts, mv.toAcc) : budMoves && effToAcc ? getName(accounts, effToAcc) : undefined} balance={accountBalances[effToAcc]} kept={!mv.toAcc && budMoves} onClear={() => setMv(p => ({ ...p, toAcc: "" }))} />
                  <SlotBox label="Budget" tone="to" name={mv.toBud ? getName(budgets, mv.toBud) : accMoves && effToBud ? getName(budgets, effToBud) : undefined} balance={budgetBalances[effToBud]} kept={!mv.toBud && accMoves} onClear={() => setMv(p => ({ ...p, toBud: "" }))} />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700">Amount</div>
                  <MoneyInput
                    placeholder="0" value={mvAmount} onChange={setMvAmount}
                    onKeyDown={e => e.key === "Enter" && submitMove()}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <input
                    type="text" placeholder="Note (optional)" value={mvNote} onChange={e => setMvNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitMove()}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white"
                  />
                  <button onClick={submitMove} disabled={!moveReady}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {moveReady ? `Move ${formatCurrency(moveAmount)}` : "Move"}
                  </button>
                </div>
              </div>

              <p className={`mt-3 text-xs ${moveReady ? "text-gray-500" : "text-amber-600"}`}>{moveHint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACCOUNT & BUDGET BALANCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Account Balances */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-700">Account Balances</h3>
            {!moveMode && (
              <button onClick={() => openManage("accounts")} title="Edit initial balances" aria-label="Edit initial account balances"
                className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {accounts.map(acc => (
              <BalanceRow
                key={acc.id} name={acc.name} balance={accountBalances[acc.id] || 0} moveMode={moveMode}
                role={rowRole("Acc", acc.id)}
                delta={moveAmount} onPick={() => pickMove("Acc", acc.id)}
              />
            ))}
          </div>
        </div>

        {/* Budget Balances */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank size={18} className="text-amber-500" />
            <h3 className="font-bold text-gray-700">Budget Balances</h3>
            {!moveMode && (
              <button onClick={() => openManage("budgets")} title="Edit initial balances" aria-label="Edit initial budget balances"
                className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {budgets.map(bud => {
              const st = budgetStats[bud.id] || { added: 0, spent: 0, movedOut: 0 };
              return (
                <BalanceRow
                  key={bud.id} name={bud.name} balance={budgetBalances[bud.id] || 0} moveMode={moveMode}
                  role={rowRole("Bud", bud.id)}
                  delta={moveAmount} onPick={() => pickMove("Bud", bud.id)}
                >
                  {!moveMode && (
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400">
                      <span>Added <b className="font-bold text-emerald-600">{formatSigned(st.added)}</b></span>
                      <span>Spent <b className="font-bold text-red-500">{formatCurrency(st.spent)}</b></span>
                      {st.movedOut > 0 && <span>Moved out <b className="font-bold text-blue-500">{formatCurrency(st.movedOut)}</b></span>}
                    </div>
                  )}
                </BalanceRow>
              );
            })}

            {/* Virtual "Unassigned" budget: only exists while there is a leftover. Hover (or tap) offers to fold it into General. */}
            {unassigned !== 0 && leftoverTarget && (
              <div
                tabIndex={moveMode ? -1 : 0}
                onClick={() => !moveMode && setUnassignedOpen(o => !o)}
                onMouseLeave={() => setUnassignedOpen(false)}
                className={`group py-1.5 px-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 outline-none transition-opacity ${moveMode ? "opacity-50" : "cursor-pointer"}`}
              >
                <div className={`flex items-center justify-between gap-2 ${moveMode ? "" : unassignedOpen ? "hidden" : "group-hover:hidden group-focus-within:hidden"}`}>
                  <span className="text-sm italic text-amber-700">Unassigned</span>
                  <span className={`text-sm font-bold ${unassigned >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatSigned(unassigned)}</span>
                </div>
                {!moveMode && (
                  <div className={`items-center justify-between gap-2 ${unassignedOpen ? "flex" : "hidden group-hover:flex group-focus-within:flex"}`}>
                    <span className="text-sm font-semibold text-amber-700 truncate">Move to {leftoverTarget.name}?</span>
                    <button
                      onClick={e => { e.stopPropagation(); assignLeftover(); }}
                      aria-label={`Move ${formatSigned(unassigned)} to ${leftoverTarget.name}`} title={`Move ${formatSigned(unassigned)} to ${leftoverTarget.name}`}
                      className="shrink-0 p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 flex-1 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={16} className="text-gray-400 ml-1" />
          {(["All", "Income", "Spending", "Move"] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === type
                  ? type === "All" ? "bg-gray-800 text-white"
                    : type === "Income" ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : type === "Spending" ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No transactions yet</p>
            <p className="text-sm mt-1">Click &quot;Add Transaction&quot; to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {filteredTransactions.map(txn => {
                const cfg = TYPE_CONFIG[txn.type];
                const Icon = cfg.icon;
                const isExpanded = expandedTxnId === txn.id;
                const movesAcc = txn.type === "Move" && !!txn.toAccountId && txn.toAccountId !== txn.accountId;
                const movesBud = txn.type === "Move" && !!txn.toBudgetId && txn.toBudgetId !== txn.budgetId;
                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedTxnId(isExpanded ? null : txn.id)}
                    >
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 truncate">{txn.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} ${cfg.border} border`}>{cfg.label}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${txn.type === "Income" ? "text-emerald-600" : txn.type === "Spending" ? "text-red-500" : "text-blue-500"}`}>
                          {txn.type === "Income" ? "+" : txn.type === "Spending" ? "-" : "↔"} {formatCurrency(txn.amount)}
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 border-t border-gray-50">
                            {txn.type !== "Move" && (
                              <div className="flex items-center gap-1">
                                <Tag size={12} />
                                <span className="font-semibold">Category:</span> {getName(categories, txn.categoryId)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Wallet size={12} />
                              <span className="font-semibold">{movesAcc ? "From Account:" : "Account:"}</span> {getName(accounts, txn.accountId)}
                            </div>
                            <div className="flex items-center gap-1">
                              <PiggyBank size={12} />
                              <span className="font-semibold">{movesBud ? "From Budget:" : "Budget:"}</span> {getName(budgets, txn.budgetId)}
                            </div>
                            {movesAcc && txn.toAccountId && (
                              <div className="flex items-center gap-1">
                                <Wallet size={12} />
                                <span className="font-semibold">To Account:</span> {getName(accounts, txn.toAccountId)}
                              </div>
                            )}
                            {movesBud && txn.toBudgetId && (
                              <div className="flex items-center gap-1">
                                <PiggyBank size={12} />
                                <span className="font-semibold">To Budget:</span> {getName(budgets, txn.toBudgetId)}
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this transaction?")) deleteTransaction(txn.id); }}
                              className="ml-auto p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  ADD TRANSACTION MODAL                                        */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800">New Transaction</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Transaction Type */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Type</label>
                <div className="flex gap-2">
                  {(["Income", "Spending", "Move"] as TransactionType[]).map(type => {
                    const cfg = TYPE_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => { setFormType(type); setFormCategoryId(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all cursor-pointer ${
                          formType === type ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        <Icon size={16} /> {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Transaction Name</label>
                <input
                  type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Lunch, Salary, Transfer..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount</label>
                <MoneyInput
                  value={formAmount} onChange={setFormAmount}
                  placeholder="0"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Category (not for Move) */}
              {formType !== "Move" && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {formType} Category
                  </label>
                  <select
                    value={formCategoryId || (filteredCategories[0]?.id || "")}
                    onChange={e => setFormCategoryId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    {filteredCategories.length === 0 && <option value="">No categories — add in Manage</option>}
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Source Account & Budget */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {formType === "Move" ? "From Account" : "Account"}
                  </label>
                  <select
                    value={formAccountId || defaultAccountId}
                    onChange={e => setFormAccountId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {formType === "Move" ? "From Budget" : "Budget"}
                  </label>
                  <select
                    value={formBudgetId || defaultBudgetId}
                    onChange={e => setFormBudgetId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Destination Account & Budget (Move only) */}
              {formType === "Move" && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">To Account</label>
                    <select
                      value={formToAccountId || defaultAccountId}
                      onChange={e => setFormToAccountId(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">To Budget</label>
                    <select
                      value={formToBudgetId || defaultBudgetId}
                      onChange={e => setFormToBudgetId(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                    >
                      {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Move description */}
              {formType === "Move" && (
                <div className="mb-5 p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-600">
                  <ArrowRightLeft size={14} className="inline mr-1" />
                  <strong>Move</strong> transfers funds between accounts and/or budgets without changing total net balance.
                </div>
              )}

              <button
                onClick={addTransaction}
                disabled={!formName.trim() || !formAmount || parseFloat(formAmount) <= 0}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add Transaction
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/*  MANAGE MODAL (Categories, Accounts, Budgets)                 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showManage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowManage(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800">Manage</h2>
                <button onClick={() => setShowManage(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
                {([
                  { key: "categories" as const, label: "Categories", icon: Tag },
                  { key: "accounts" as const, label: "Accounts", icon: Wallet },
                  { key: "budgets" as const, label: "Budgets", icon: PiggyBank },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setManageTab(tab.key); setNewItemName(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      manageTab === tab.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Categories Tab */}
              {manageTab === "categories" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      placeholder="Category name..."
                      className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
                      onKeyDown={e => e.key === "Enter" && addCategory()}
                    />
                    <select
                      value={newCategoryType}
                      onChange={e => setNewCategoryType(e.target.value as "Income" | "Spending")}
                      className="p-2.5 border border-gray-300 rounded-xl text-sm bg-white cursor-pointer"
                    >
                      <option value="Spending">Spending</option>
                      <option value="Income">Income</option>
                    </select>
                    <button onClick={addCategory} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cat.type === "Income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>{cat.type}</span>
                          <span className="text-sm text-gray-700">{cat.name}</span>
                        </div>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts Tab */}
              {manageTab === "accounts" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      placeholder="Account name..."
                      className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
                      onKeyDown={e => e.key === "Enter" && addAccount()}
                    />
                    <button onClick={addAccount} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 px-1 pb-1">The number on the right is the initial balance: what the account held before your first transaction.</p>
                    {accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Wallet size={14} className="text-indigo-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{acc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <BalanceInput value={acc.initialBalance ?? 0} onCommit={n => setAccountInitial(acc.id, n)} />
                          <button
                            onClick={() => deleteAccount(acc.id)}
                            disabled={accounts.length <= 1}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budgets Tab */}
              {manageTab === "budgets" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      placeholder="Budget name..."
                      className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
                      onKeyDown={e => e.key === "Enter" && addBudget()}
                    />
                    <button onClick={addBudget} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 px-1 pb-1">The number on the right is the initial balance. It counts as money &quot;Added&quot; to that budget.</p>
                    {Math.abs(initialAccTotal - initialBudTotal) > 0.005 && (
                      <p className="text-xs text-amber-600 px-1 pb-1">
                        Heads up: budget initials total {formatSigned(initialBudTotal)}, account initials total {formatSigned(initialAccTotal)}. Make them equal so both lists add up to the same amount.
                      </p>
                    )}
                    {budgets.map(bud => (
                      <div key={bud.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <PiggyBank size={14} className="text-amber-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{bud.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <BalanceInput value={bud.initialBalance ?? 0} onCommit={n => setBudgetInitial(bud.id, n)} />
                          <button
                            onClick={() => deleteBudget(bud.id)}
                            disabled={budgets.length <= 1}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}