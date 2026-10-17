"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Wallet, PiggyBank, Tag } from "lucide-react";
import {
  TransactionType,
  FinanceCategory,
  FinanceAccount,
  FinanceBudget,
} from "../context/AppContext";
import {
  TYPE_CONFIG,
  formatSigned,
  AnimatedSelect,
  MoneyInput,
  BalanceInput,
} from "./FinanceWidgets";

interface FinanceModalsProps {
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  formName: string;
  setFormName: React.Dispatch<React.SetStateAction<string>>;
  formType: TransactionType;
  setFormType: React.Dispatch<React.SetStateAction<TransactionType>>;
  formAmount: string;
  setFormAmount: React.Dispatch<React.SetStateAction<string>>;
  formCategoryId: string;
  setFormCategoryId: React.Dispatch<React.SetStateAction<string>>;
  formAccountId: string;
  setFormAccountId: React.Dispatch<React.SetStateAction<string>>;
  formBudgetId: string;
  setFormBudgetId: React.Dispatch<React.SetStateAction<string>>;
  formToAccountId: string;
  setFormToAccountId: React.Dispatch<React.SetStateAction<string>>;
  formToBudgetId: string;
  setFormToBudgetId: React.Dispatch<React.SetStateAction<string>>;
  filteredCategories: FinanceCategory[];
  defaultAccountId: string;
  defaultBudgetId: string;
  accounts: FinanceAccount[];
  budgets: FinanceBudget[];
  categories: FinanceCategory[];
  onAddTransaction: () => void;
  showManage: boolean;
  setShowManage: React.Dispatch<React.SetStateAction<boolean>>;
  manageTab: "categories" | "accounts" | "budgets";
  setManageTab: React.Dispatch<React.SetStateAction<"categories" | "accounts" | "budgets">>;
  newItemName: string;
  setNewItemName: React.Dispatch<React.SetStateAction<string>>;
  newCategoryType: "Income" | "Spending";
  setNewCategoryType: React.Dispatch<React.SetStateAction<"Income" | "Spending">>;
  initialAccTotal: number;
  initialBudTotal: number;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onAddAccount: () => void;
  onDeleteAccount: (id: string) => void;
  onSetAccountInitial: (id: string, n: number) => void;
  onAddBudget: () => void;
  onDeleteBudget: (id: string) => void;
  onSetBudgetInitial: (id: string, n: number) => void;
}

export default function FinanceModals({
  showForm,
  setShowForm,
  formName,
  setFormName,
  formType,
  setFormType,
  formAmount,
  setFormAmount,
  formCategoryId,
  setFormCategoryId,
  formAccountId,
  setFormAccountId,
  formBudgetId,
  setFormBudgetId,
  formToAccountId,
  setFormToAccountId,
  formToBudgetId,
  setFormToBudgetId,
  filteredCategories,
  defaultAccountId,
  defaultBudgetId,
  accounts,
  budgets,
  categories,
  onAddTransaction,
  showManage,
  setShowManage,
  manageTab,
  setManageTab,
  newItemName,
  setNewItemName,
  newCategoryType,
  setNewCategoryType,
  initialAccTotal,
  initialBudTotal,
  onAddCategory,
  onDeleteCategory,
  onAddAccount,
  onDeleteAccount,
  onSetAccountInitial,
  onAddBudget,
  onDeleteBudget,
  onSetBudgetInitial,
}: FinanceModalsProps) {
  return (
    <>
      {/* ADD TRANSACTION MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">New Transaction</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Type
                </label>
                <div className="flex gap-2">
                  {(["Income", "Spending", "Move"] as TransactionType[]).map((type) => {
                    const cfg = TYPE_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setFormType(type);
                          setFormCategoryId("");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all cursor-pointer ${
                          formType === type
                            ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                            : "border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <Icon size={16} /> {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Transaction Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Lunch, Salary, Transfer..."
                  className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Amount
                </label>
                <MoneyInput
                  value={formAmount}
                  onChange={setFormAmount}
                  placeholder="0"
                  className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-rpg-num"
                />
              </div>

              {formType !== "Move" && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    {formType} Category
                  </label>
                  <AnimatedSelect
                    value={formCategoryId || filteredCategories[0]?.id || ""}
                    options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={setFormCategoryId}
                    placeholder="No categories — add in Manage"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    {formType === "Move" ? "From Account" : "Account"}
                  </label>
                  <AnimatedSelect
                    value={formAccountId || defaultAccountId}
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                    onChange={setFormAccountId}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    {formType === "Move" ? "From Budget" : "Budget"}
                  </label>
                  <AnimatedSelect
                    value={formBudgetId || defaultBudgetId}
                    options={budgets.map((b) => ({ value: b.id, label: b.name }))}
                    onChange={setFormBudgetId}
                  />
                </div>
              </div>

              {formType === "Move" && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      To Account
                    </label>
                    <AnimatedSelect
                      value={formToAccountId || defaultAccountId}
                      options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                      onChange={setFormToAccountId}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      To Budget
                    </label>
                    <AnimatedSelect
                      value={formToBudgetId || defaultBudgetId}
                      options={budgets.map((b) => ({ value: b.id, label: b.name }))}
                      onChange={setFormToBudgetId}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={onAddTransaction}
                disabled={!formName.trim() || !formAmount || parseFloat(formAmount) <= 0}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Add Transaction
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANAGE MODAL */}
      <AnimatePresence>
        {showManage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
            onClick={() => setShowManage(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manage Finance</h2>
                <button
                  onClick={() => setShowManage(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                {(
                  [
                    { key: "categories" as const, label: "Categories", icon: Tag },
                    { key: "accounts" as const, label: "Accounts", icon: Wallet },
                    { key: "budgets" as const, label: "Budgets", icon: PiggyBank },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setManageTab(tab.key);
                      setNewItemName("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      manageTab === tab.key
                        ? "bg-white dark:bg-slate-900 text-gray-800 dark:text-white shadow-2xs"
                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {manageTab === "categories" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Category name..."
                      className="flex-1 p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      onKeyDown={(e) => e.key === "Enter" && onAddCategory()}
                    />
                    <div className="w-32">
                      <AnimatedSelect
                        value={newCategoryType}
                        options={[
                          { value: "Spending", label: "Spending" },
                          { value: "Income", label: "Income" },
                        ]}
                        onChange={(v) => setNewCategoryType(v as "Income" | "Spending")}
                      />
                    </div>
                    <button
                      onClick={onAddCategory}
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              cat.type === "Income"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                                : "bg-red-100 dark:bg-red-950 text-red-500 dark:text-red-300"
                            }`}
                          >
                            {cat.type}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-slate-200">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {manageTab === "accounts" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Account name..."
                      className="flex-1 p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      onKeyDown={(e) => e.key === "Enter" && onAddAccount()}
                    />
                    <button
                      onClick={onAddAccount}
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 dark:text-slate-500 px-1 pb-1">
                      The number on the right is the initial balance before your first transaction.
                    </p>
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Wallet size={14} className="text-indigo-400 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-slate-200 truncate">
                            {acc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <BalanceInput
                            value={acc.initialBalance ?? 0}
                            onCommit={(n) => onSetAccountInitial(acc.id, n)}
                          />
                          <button
                            onClick={() => onDeleteAccount(acc.id)}
                            disabled={accounts.length <= 1}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {manageTab === "budgets" && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Budget name..."
                      className="flex-1 p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      onKeyDown={(e) => e.key === "Enter" && onAddBudget()}
                    />
                    <button
                      onClick={onAddBudget}
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 dark:text-slate-500 px-1 pb-1">
                      The number on the right is the initial balance (&ldquo;Added&rdquo; to that budget).
                    </p>
                    {Math.abs(initialAccTotal - initialBudTotal) > 0.005 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 px-1 pb-1">
                        Heads up: budget initials total {formatSigned(initialBudTotal)}, account initials total{" "}
                        {formatSigned(initialAccTotal)}.
                      </p>
                    )}
                    {budgets.map((bud) => (
                      <div
                        key={bud.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PiggyBank size={14} className="text-amber-400 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-slate-200 truncate">
                            {bud.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <BalanceInput
                            value={bud.initialBalance ?? 0}
                            onCommit={(n) => onSetBudgetInitial(bud.id, n)}
                          />
                          <button
                            onClick={() => onDeleteBudget(bud.id)}
                            disabled={budgets.length <= 1}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 disabled:opacity-30 cursor-pointer"
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
    </>
  );
}