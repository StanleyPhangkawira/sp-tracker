"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  X,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  Tag,
  TrendingUp,
  TrendingDown,
  Settings2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Pencil,
  ArrowDownUp,
  Check,
} from "lucide-react";
import {
  useAppContext,
  Transaction,
  TransactionType,
  FinanceCategory,
  FinanceAccount,
  FinanceBudget,
} from "../../context/AppContext";
import {
  TYPE_CONFIG,
  formatCurrency,
  formatSigned,
  formatDate,
  formatTime,
  MoveRole,
  MoveSel,
  EMPTY_MOVE,
  MoneyInput,
  BalanceRow,
  SlotBox,
} from "../../components/FinanceWidgets";
import FinanceModals from "../../components/FinanceModals";

const Calendar = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
);
const PieChart = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);

export default function FinancePage() {
  const { financeData, setFinanceData } = useAppContext();
  const { transactions, categories, accounts, budgets } = financeData;

  const [showForm, setShowForm] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | "All">("All");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<TransactionType>("Spending");
  const [formAmount, setFormAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formBudgetId, setFormBudgetId] = useState("");
  const [formToAccountId, setFormToAccountId] = useState("");
  const [formToBudgetId, setFormToBudgetId] = useState("");

  const [unassignedOpen, setUnassignedOpen] = useState(false);

  const [moveMode, setMoveMode] = useState(false);
  const [mv, setMv] = useState<MoveSel>(EMPTY_MOVE);
  const [mvAmount, setMvAmount] = useState("");
  const [mvNote, setMvNote] = useState("");

  const [manageTab, setManageTab] = useState<"categories" | "accounts" | "budgets">("categories");
  const [newItemName, setNewItemName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"Income" | "Spending">("Spending");

  const filteredCategories = useMemo(() => {
    if (formType === "Move") return [];
    return categories.filter((c) => c.type === formType);
  }, [categories, formType]);

  const defaultCategoryId = useMemo(() => {
    const spending = categories.find((c) => c.type === "Spending");
    return spending?.id || "";
  }, [categories]);

  const defaultAccountId = useMemo(() => accounts[0]?.id || "", [accounts]);
  const defaultBudgetId = useMemo(() => budgets[0]?.id || "", [budgets]);

  const {
    totalIncome,
    totalSpending,
    netBalance,
    accountBalances,
    budgetStats,
    budgetBalances,
    spendingByCategory,
  } = useMemo(() => {
    let totalIncome = 0;
    let totalSpending = 0;
    const accBal: Record<string, number> = {};
    const stats: Record<string, { added: number; spent: number; movedOut: number }> = {};
    const catSpend: Record<string, number> = {};
    const bud = (id: string) => (stats[id] = stats[id] || { added: 0, spent: 0, movedOut: 0 });

    accounts.forEach((a) => {
      accBal[a.id] = a.initialBalance ?? 0;
    });
    budgets.forEach((b) => {
      bud(b.id).added = b.initialBalance ?? 0;
    });

    transactions.forEach((t) => {
      if (t.type === "Income") {
        totalIncome += t.amount;
        accBal[t.accountId] = (accBal[t.accountId] || 0) + t.amount;
        bud(t.budgetId).added += t.amount;
      } else if (t.type === "Spending") {
        totalSpending += t.amount;
        accBal[t.accountId] = (accBal[t.accountId] || 0) - t.amount;
        bud(t.budgetId).spent += t.amount;
        catSpend[t.categoryId] = (catSpend[t.categoryId] || 0) + t.amount;
      } else if (t.type === "Move") {
        accBal[t.accountId] = (accBal[t.accountId] || 0) - t.amount;
        if (t.toAccountId) accBal[t.toAccountId] = (accBal[t.toAccountId] || 0) + t.amount;
        if (t.toBudgetId && t.toBudgetId !== t.budgetId) {
          bud(t.budgetId).movedOut += t.amount;
          bud(t.toBudgetId).added += t.amount;
        }
      }
    });

    const budBal: Record<string, number> = {};
    Object.entries(stats).forEach(([id, st]) => {
      budBal[id] = st.added - st.spent - st.movedOut;
    });

    const initialTotal = accounts.reduce((sum, a) => sum + (a.initialBalance ?? 0), 0);
    return {
      totalIncome,
      totalSpending,
      netBalance: initialTotal + totalIncome - totalSpending,
      accountBalances: accBal,
      budgetStats: stats,
      budgetBalances: budBal,
      spendingByCategory: catSpend,
    };
  }, [transactions, accounts, budgets]);

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filterType !== "All") list = list.filter((t) => t.type === filterType);
    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : 30;
      const cutoff = Date.now() - days * 86400 * 1000;
      list = list.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, filterType, dateRange, searchQuery]);

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormType("Spending");
    setFormCategoryId("");
    setFormAccountId("");
    setFormBudgetId("");
    setFormToAccountId("");
    setFormToBudgetId("");
  };

  const addTransaction = () => {
    const amount = parseFloat(formAmount);
    if (!formName.trim() || isNaN(amount) || amount <= 0) return;

    const effectiveCategoryId = formType === "Move" ? "" : formCategoryId || defaultCategoryId;
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
      toAccountId: formType === "Move" ? formToAccountId || defaultAccountId : undefined,
      toBudgetId: formType === "Move" ? formToBudgetId || defaultBudgetId : undefined,
      timestamp: new Date().toISOString(),
    };

    setFinanceData((prev) => ({ ...prev, transactions: [...prev.transactions, newTxn] }));
    resetForm();
    setShowForm(false);
  };

  const deleteTransaction = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const addCategory = () => {
    if (!newItemName.trim()) return;
    const newCat: FinanceCategory = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      type: newCategoryType,
    };
    setFinanceData((prev) => ({ ...prev, categories: [...prev.categories, newCat] }));
    setNewItemName("");
  };

  const addAccount = () => {
    if (!newItemName.trim()) return;
    const newAcc: FinanceAccount = { id: Date.now().toString(), name: newItemName.trim() };
    setFinanceData((prev) => ({ ...prev, accounts: [...prev.accounts, newAcc] }));
    setNewItemName("");
  };

  const addBudget = () => {
    if (!newItemName.trim()) return;
    const newBud: FinanceBudget = { id: Date.now().toString(), name: newItemName.trim() };
    setFinanceData((prev) => ({ ...prev, budgets: [...prev.budgets, newBud] }));
    setNewItemName("");
  };

  const deleteCategory = (id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };
  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  };
  const deleteBudget = (id: string) => {
    if (budgets.length <= 1) return;
    setFinanceData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  };

  const getName = (list: { id: string; name: string }[], id: string) =>
    list.find((x) => x.id === id)?.name || "Unknown";

  const setAccountInitial = (id: string, n: number) =>
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, initialBalance: n } : a)),
    }));
  const setBudgetInitial = (id: string, n: number) =>
    setFinanceData((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === id ? { ...b, initialBalance: n } : b)),
    }));

  const unassigned =
    Math.round(
      (netBalance - budgets.reduce((sum, b) => sum + (budgetBalances[b.id] || 0), 0)) * 100
    ) / 100;
  const leftoverTarget =
    budgets.find((b) => b.name.trim().toLowerCase() === "general") ?? budgets[0];
  const assignLeftover = () => {
    if (!leftoverTarget || unassigned === 0) return;
    setFinanceData((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) =>
        b.id === leftoverTarget.id
          ? { ...b, initialBalance: Math.round(((b.initialBalance ?? 0) + unassigned) * 100) / 100 }
          : b
      ),
    }));
    setUnassignedOpen(false);
  };

  const initialAccTotal = accounts.reduce((sum, a) => sum + (a.initialBalance ?? 0), 0);
  const initialBudTotal = budgets.reduce((sum, b) => sum + (b.initialBalance ?? 0), 0);
  const openManage = (tab: "accounts" | "budgets") => {
    setManageTab(tab);
    setNewItemName("");
    setShowManage(true);
  };

  // Move Mode
  const moveAmount = parseFloat(mvAmount) || 0;
  const effFromAcc = mv.fromAcc || mv.toAcc,
    effToAcc = mv.toAcc || mv.fromAcc;
  const effFromBud = mv.fromBud || mv.toBud,
    effToBud = mv.toBud || mv.fromBud;
  const accMoves = !!effFromAcc && effFromAcc !== effToAcc;
  const budMoves = !!effFromBud && effFromBud !== effToBud;
  const moveReady = moveAmount > 0 && (accMoves || budMoves);
  const sidePart = (
    list: { id: string; name: string }[],
    from: string,
    to: string,
    moves: boolean,
    unit: string
  ) =>
    moves
      ? `${getName(list, from)} → ${getName(list, to)}`
      : from
      ? `${getName(list, from)} (same ${unit})`
      : "";
  const moveHint = !(accMoves || budMoves)
    ? "Pick a different account, a different budget, or both. Anything you leave out stays the same."
    : moveAmount <= 0
    ? "Enter an amount to move."
    : [
        sidePart(accounts, effFromAcc, effToAcc, accMoves, "account"),
        sidePart(budgets, effFromBud, effToBud, budMoves, "budget"),
      ]
        .filter(Boolean)
        .join("  ·  ");

  const rowRole = (dim: "Acc" | "Bud", id: string): MoveRole => {
    const f = mv[`from${dim}`],
      t = mv[`to${dim}`];
    if (dim === "Acc" ? accMoves : budMoves) return id === f ? "from" : id === t ? "to" : null;
    if (id !== (f || t)) return null;
    return (dim === "Acc" ? budMoves : accMoves) ? "stay" : f ? "from" : "to";
  };

  const pickMove = (dim: "Acc" | "Bud", id: string) =>
    setMv((p) => {
      const from = `from${dim}` as const,
        to = `to${dim}` as const;
      if (p[from] === id) return { ...p, [from]: "" };
      if (p[to] === id) return { ...p, [to]: "" };
      return p[from] ? { ...p, [to]: id } : { ...p, [from]: id };
    });
  const swapMove = () =>
    setMv((p) => ({
      fromAcc: p.toAcc,
      toAcc: p.fromAcc,
      fromBud: p.toBud,
      toBud: p.fromBud,
    }));
  const clearMove = () => {
    setMv(EMPTY_MOVE);
    setMvAmount("");
    setMvNote("");
  };
  const exitMoveMode = () => {
    clearMove();
    setMoveMode(false);
  };

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
      accountId,
      budgetId,
      toAccountId: effToAcc || accountId,
      toBudgetId: effToBud || budgetId,
      timestamp: new Date().toISOString(),
    };
    setFinanceData((prev) => ({ ...prev, transactions: [...prev.transactions, newTxn] }));
    clearMove();
  };

  const topCategories = useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([catId, amount]) => ({
        id: catId,
        name: getName(categories, catId),
        amount,
        pct: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spendingByCategory, categories, totalSpending]);

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pb-24 md:pt-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Finance Command
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Track your income, spending, budget health, and account transfers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowManage(true);
              setNewItemName("");
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Settings2 size={17} /> Manage
          </button>
          <button
            onClick={() => (moveMode ? exitMoveMode() : setMoveMode(true))}
            className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 transition-colors shadow-2xs cursor-pointer ${
              moveMode
                ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <ArrowRightLeft size={17} /> Move Mode
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={17} /> Add Transaction
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Total Income</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-rpg-num">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400 mb-2">
            <TrendingDown size={20} />
            <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Total Spending</span>
          </div>
          <p className="text-2xl font-black text-red-500 dark:text-red-400 font-rpg-num">
            {formatCurrency(totalSpending)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
            <Wallet size={20} />
            <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Net Balance</span>
          </div>
          <p
            className={`text-2xl font-black font-rpg-num ${
              netBalance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500 dark:text-red-400"
            }`}
          >
            {netBalance < 0 ? "-" : ""}
            {formatCurrency(Math.abs(netBalance))}
          </p>
        </div>
      </div>

      {/* MOVE MODE PANEL */}
      <AnimatePresence initial={false}>
        {moveMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                    <ArrowRightLeft size={18} /> Move Mode
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Tap a balance below to set <b className="text-red-500">From</b>, tap another to set{" "}
                    <b className="text-green-600 dark:text-green-400">To</b>. Do it in Accounts, Budgets, or both.
                  </p>
                </div>
                <button
                  onClick={exitMoveMode}
                  className="shrink-0 p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_minmax(0,230px)] gap-3 items-start">
                <div className="space-y-2">
                  <div className="text-sm font-bold text-red-500">From</div>
                  <SlotBox
                    label="Account"
                    tone="from"
                    name={effFromAcc ? getName(accounts, effFromAcc) : undefined}
                    balance={accountBalances[effFromAcc]}
                    kept={!mv.fromAcc && budMoves}
                    onClear={() => setMv((p) => ({ ...p, fromAcc: "" }))}
                  />
                  <SlotBox
                    label="Budget"
                    tone="from"
                    name={effFromBud ? getName(budgets, effFromBud) : undefined}
                    balance={budgetBalances[effFromBud]}
                    kept={!mv.fromBud && accMoves}
                    onClear={() => setMv((p) => ({ ...p, fromBud: "" }))}
                  />
                </div>

                <button
                  onClick={swapMove}
                  className="self-center justify-self-center p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 md:-rotate-90 cursor-pointer"
                >
                  <ArrowDownUp size={16} />
                </button>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">To</div>
                  <SlotBox
                    label="Account"
                    tone="to"
                    name={
                      mv.toAcc
                        ? getName(accounts, mv.toAcc)
                        : budMoves && effToAcc
                        ? getName(accounts, effToAcc)
                        : undefined
                    }
                    balance={accountBalances[effToAcc]}
                    kept={!mv.toAcc && budMoves}
                    onClear={() => setMv((p) => ({ ...p, toAcc: "" }))}
                  />
                  <SlotBox
                    label="Budget"
                    tone="to"
                    name={
                      mv.toBud
                        ? getName(budgets, mv.toBud)
                        : accMoves && effToBud
                        ? getName(budgets, effToBud)
                        : undefined
                    }
                    balance={budgetBalances[effToBud]}
                    kept={!mv.toBud && accMoves}
                    onClear={() => setMv((p) => ({ ...p, toBud: "" }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700 dark:text-slate-200">Amount</div>
                  <MoneyInput
                    placeholder="0"
                    value={mvAmount}
                    onChange={setMvAmount}
                    onKeyDown={(e) => e.key === "Enter" && submitMove()}
                    className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-rpg-num"
                  />
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={mvNote}
                    onChange={(e) => setMvNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitMove()}
                    className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={submitMove}
                    disabled={!moveReady}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {moveReady ? `Move ${formatCurrency(moveAmount)}` : "Move"}
                  </button>
                </div>
              </div>

              <p
                className={`mt-3 text-xs ${
                  moveReady ? "text-gray-500 dark:text-slate-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {moveHint}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACCOUNT, BUDGET & SPENDING BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-800 dark:text-white">Account Balances</h3>
            {!moveMode && (
              <button
                onClick={() => openManage("accounts")}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {accounts.map((acc) => (
              <BalanceRow
                key={acc.id}
                name={acc.name}
                balance={accountBalances[acc.id] || 0}
                moveMode={moveMode}
                role={rowRole("Acc", acc.id)}
                delta={moveAmount}
                onPick={() => pickMove("Acc", acc.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank size={18} className="text-amber-500" />
            <h3 className="font-bold text-gray-800 dark:text-white">Budget Balances</h3>
            {!moveMode && (
              <button
                onClick={() => openManage("budgets")}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {budgets.map((bud) => {
              const st = budgetStats[bud.id] || { added: 0, spent: 0, movedOut: 0 };
              const netAdded = Math.max(0, st.added - st.movedOut);
              const spentPct = netAdded > 0 ? Math.min(100, Math.round((st.spent / netAdded) * 100)) : 0;
              return (
                <BalanceRow
                  key={bud.id}
                  name={bud.name}
                  balance={budgetBalances[bud.id] || 0}
                  moveMode={moveMode}
                  role={rowRole("Bud", bud.id)}
                  delta={moveAmount}
                  onPick={() => pickMove("Bud", bud.id)}
                >
                  {!moveMode && (
                    <>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400 dark:text-slate-400 font-rpg-num">
                        <span>
                          Added{" "}
                          <b className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatSigned(st.added)}
                          </b>
                        </span>
                        <span>
                          Spent{" "}
                          <b className="font-bold text-red-500 dark:text-red-400">
                            {formatCurrency(st.spent)}
                          </b>
                        </span>
                        {st.movedOut > 0 && (
                          <span>
                            Moved out{" "}
                            <b className="font-bold text-blue-500 dark:text-blue-400">
                              {formatCurrency(st.movedOut)}
                            </b>
                          </span>
                        )}
                      </div>
                      {netAdded > 0 && (
                        <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full transition-all duration-500 ${
                              spentPct > 90
                                ? "bg-red-500"
                                : spentPct > 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${spentPct}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </BalanceRow>
              );
            })}

            {unassigned !== 0 && leftoverTarget && (
              <div
                tabIndex={moveMode ? -1 : 0}
                onClick={() => !moveMode && setUnassignedOpen((o) => !o)}
                onMouseLeave={() => setUnassignedOpen(false)}
                className={`group py-1.5 px-2 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 outline-none transition-opacity ${
                  moveMode ? "opacity-50" : "cursor-pointer"
                }`}
              >
                <div
                  className={`flex items-center justify-between gap-2 ${
                    moveMode
                      ? ""
                      : unassignedOpen
                      ? "hidden"
                      : "group-hover:hidden group-focus-within:hidden"
                  }`}
                >
                  <span className="text-sm italic text-amber-700 dark:text-amber-300">Unassigned</span>
                  <span
                    className={`text-sm font-bold font-rpg-num ${
                      unassigned >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}
                  >
                    {formatSigned(unassigned)}
                  </span>
                </div>
                {!moveMode && (
                  <div
                    className={`items-center justify-between gap-2 ${
                      unassignedOpen ? "flex" : "hidden group-hover:flex group-focus-within:flex"
                    }`}
                  >
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 truncate">
                      Move to {leftoverTarget.name}?
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignLeftover();
                      }}
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={18} className="text-rose-500" />
            <h3 className="font-bold text-gray-800 dark:text-white">Category Spending</h3>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 italic py-6 text-center">
              No spending recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {topCategories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 dark:text-slate-200">{cat.name}</span>
                    <span className="font-semibold text-gray-500 dark:text-slate-400 font-rpg-num">
                      {formatCurrency(cat.amount)} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 px-3 py-2 flex-1 shadow-2xs">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1">
            <Calendar size={14} className="text-gray-400 ml-1.5 mr-0.5" />
            {(
              [
                { id: "all", label: "All Time" },
                { id: "30d", label: "30 Days" },
                { id: "7d", label: "7 Days" },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateRange === d.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={15} className="text-gray-400 ml-1" />
            {(["All", "Income", "Spending", "Move"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterType === type
                    ? type === "All"
                      ? "bg-gray-800 dark:bg-indigo-600 text-white"
                      : type === "Income"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : type === "Spending"
                      ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500">
            <Wallet size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No transactions found</p>
            <p className="text-sm mt-1">Click &ldquo;Add Transaction&rdquo; to log an entry.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            <AnimatePresence initial={false}>
              {filteredTransactions.map((txn) => {
                const cfg = TYPE_CONFIG[txn.type];
                const Icon = cfg.icon;
                const isExpanded = expandedTxnId === txn.id;
                const movesAcc =
                  txn.type === "Move" && !!txn.toAccountId && txn.toAccountId !== txn.accountId;
                const movesBud =
                  txn.type === "Move" && !!txn.toBudgetId && txn.toBudgetId !== txn.budgetId;
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
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedTxnId(isExpanded ? null : txn.id)}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 dark:text-white truncate">
                            {txn.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} ${cfg.border} border`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-rpg-num">
                          {formatDate(txn.timestamp)} · {formatTime(txn.timestamp)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-black font-rpg-num ${
                            txn.type === "Income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : txn.type === "Spending"
                              ? "text-red-500 dark:text-red-400"
                              : "text-blue-500 dark:text-blue-400"
                          }`}
                        >
                          {txn.type === "Income" ? "+" : txn.type === "Spending" ? "-" : "↔"}{" "}
                          {formatCurrency(txn.amount)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-slate-400 border-t border-gray-50 dark:border-slate-800">
                            {txn.type !== "Move" && (
                              <div className="flex items-center gap-1">
                                <Tag size={12} />
                                <span className="font-semibold">Category:</span>{" "}
                                {getName(categories, txn.categoryId)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Wallet size={12} />
                              <span className="font-semibold">
                                {movesAcc ? "From Account:" : "Account:"}
                              </span>{" "}
                              {getName(accounts, txn.accountId)}
                            </div>
                            <div className="flex items-center gap-1">
                              <PiggyBank size={12} />
                              <span className="font-semibold">
                                {movesBud ? "From Budget:" : "Budget:"}
                              </span>{" "}
                              {getName(budgets, txn.budgetId)}
                            </div>
                            {movesAcc && txn.toAccountId && (
                              <div className="flex items-center gap-1">
                                <Wallet size={12} />
                                <span className="font-semibold">To Account:</span>{" "}
                                {getName(accounts, txn.toAccountId)}
                              </div>
                            )}
                            {movesBud && txn.toBudgetId && (
                              <div className="flex items-center gap-1">
                                <PiggyBank size={12} />
                                <span className="font-semibold">To Budget:</span>{" "}
                                {getName(budgets, txn.toBudgetId)}
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTransaction(txn.id);
                              }}
                              className="ml-auto p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
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

      {/* MODALS */}
      <FinanceModals
        showForm={showForm}
        setShowForm={setShowForm}
        formName={formName}
        setFormName={setFormName}
        formType={formType}
        setFormType={setFormType}
        formAmount={formAmount}
        setFormAmount={setFormAmount}
        formCategoryId={formCategoryId}
        setFormCategoryId={setFormCategoryId}
        formAccountId={formAccountId}
        setFormAccountId={setFormAccountId}
        formBudgetId={formBudgetId}
        setFormBudgetId={setFormBudgetId}
        formToAccountId={formToAccountId}
        setFormToAccountId={setFormToAccountId}
        formToBudgetId={formToBudgetId}
        setFormToBudgetId={setFormToBudgetId}
        filteredCategories={filteredCategories}
        defaultAccountId={defaultAccountId}
        defaultBudgetId={defaultBudgetId}
        accounts={accounts}
        budgets={budgets}
        categories={categories}
        onAddTransaction={addTransaction}
        showManage={showManage}
        setShowManage={setShowManage}
        manageTab={manageTab}
        setManageTab={setManageTab}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newCategoryType={newCategoryType}
        setNewCategoryType={setNewCategoryType}
        initialAccTotal={initialAccTotal}
        initialBudTotal={initialBudTotal}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onAddAccount={addAccount}
        onDeleteAccount={deleteAccount}
        onSetAccountInitial={setAccountInitial}
        onAddBudget={addBudget}
        onDeleteBudget={deleteBudget}
        onSetBudgetInitial={setBudgetInitial}
      />
    </div>
  );
}