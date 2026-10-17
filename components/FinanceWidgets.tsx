"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { TransactionType } from "../context/AppContext";

export const TYPE_CONFIG: Record<
  TransactionType,
  { icon: typeof ArrowDownLeft; color: string; bg: string; border: string; label: string }
> = {
  Income: {
    icon: ArrowDownLeft,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Income",
  },
  Spending: {
    icon: ArrowUpRight,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/60",
    border: "border-red-200 dark:border-red-800",
    label: "Spending",
  },
  Move: {
    icon: ArrowRightLeft,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-800",
    label: "Move",
  },
};

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export const formatSigned = (n: number) => `${n < 0 ? "-" : ""}${formatCurrency(Math.abs(n))}`;

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export type MoveRole = "from" | "to" | "stay" | null;
export type MoveSel = { fromAcc: string; toAcc: string; fromBud: string; toBud: string };
export const EMPTY_MOVE: MoveSel = { fromAcc: "", toAcc: "", fromBud: "", toBud: "" };

export function AnimatedSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-40 max-h-52 overflow-y-auto custom-scrollbar"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 italic">{placeholder}</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    opt.value === value
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check size={13} />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MoneyInput({
  value,
  onChange,
  allowNegative = false,
  ...rest
}: {
  value: string;
  onChange: (raw: string) => void;
  allowNegative?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode">) {
  const neg = value.startsWith("-");
  const [int, dec] = (neg ? value.slice(1) : value).split(".");
  const shown =
    (neg ? "-" : "") +
    int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
    (dec !== undefined ? "," + dec : "");
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={shown}
      onChange={(e) => {
        const raw = e.target.value.replace(/\./g, "").replace(",", ".");
        if ((allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/).test(raw)) onChange(raw);
      }}
    />
  );
}

export function BalanceInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(value ? String(value) : "");
  return (
    <MoneyInput
      allowNegative
      placeholder="0"
      aria-label="Initial balance"
      value={draft}
      onChange={(raw) => {
        setDraft(raw);
        onCommit(parseFloat(raw) || 0);
      }}
      onBlur={() => setDraft(value ? String(value) : "")}
      className="w-32 p-1.5 text-right text-sm font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-rpg-num"
    />
  );
}

export function BalanceRow({
  name,
  balance,
  role,
  delta,
  moveMode,
  onPick,
  children,
}: {
  name: string;
  balance: number;
  role: MoveRole;
  delta: number;
  moveMode: boolean;
  onPick: () => void;
  children?: React.ReactNode;
}) {
  const tone =
    role === "from"
      ? "border-red-400 bg-red-50/50 dark:bg-red-950/30"
      : role === "to"
      ? "border-green-500 bg-green-50/50 dark:bg-green-950/30"
      : role === "stay"
      ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
      : moveMode
      ? "border-transparent hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60"
      : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50";
  return (
    <div
      {...(moveMode
        ? {
            role: "button",
            tabIndex: 0,
            onClick: onPick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick();
              }
            },
          }
        : {})}
      className={`py-2 px-2.5 rounded-xl border transition-colors ${
        moveMode ? "cursor-pointer select-none" : ""
      } ${tone}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0 text-sm font-semibold text-gray-700 dark:text-slate-200">
          <span className="truncate">{name}</span>
          {role && (
            <span
              className={`shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                role === "from"
                  ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300"
                  : role === "to"
                  ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300"
              }`}
            >
              {role === "from" ? "FROM" : role === "to" ? "TO" : "SAME"}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 shrink-0 font-rpg-num">
          {(role === "from" || role === "to") && delta > 0 && (
            <span
              className={`text-[11px] font-bold ${
                role === "from" ? "text-red-400" : "text-green-600 dark:text-green-400"
              }`}
            >
              {role === "from" ? "-" : "+"}
              {formatCurrency(delta)}
            </span>
          )}
          <span
            className={`text-sm font-black ${
              balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            }`}
          >
            {formatSigned(balance)}
          </span>
        </span>
      </div>
      {children}
    </div>
  );
}

export function SlotBox({
  label,
  tone,
  name,
  balance = 0,
  onClear,
  kept,
}: {
  label: string;
  tone: "from" | "to";
  name?: string;
  balance?: number;
  onClear: () => void;
  kept?: boolean;
}) {
  if (kept && name !== undefined) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 px-3 py-2">
        <span className="min-w-0 truncate text-sm text-blue-700 dark:text-blue-300">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            {label}
          </span>
          {name}
        </span>
        <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
          SAME
        </span>
      </div>
    );
  }
  if (name === undefined) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-2 text-xs text-gray-400 dark:text-slate-500">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <span>Tap one below</span>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 ${
        tone === "from" ? "border-red-400" : "border-green-500"
      }`}
    >
      <span className="min-w-0 truncate text-sm text-gray-700 dark:text-slate-200">
        <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
        {name}
      </span>
      <span className="flex items-center gap-2 shrink-0 font-rpg-num">
        <span
          className={`text-xs font-bold ${
            balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
          }`}
        >
          {formatSigned(balance)}
        </span>
        <button
          onClick={onClear}
          aria-label={`Clear ${label}`}
          className="p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X size={14} />
        </button>
      </span>
    </div>
  );
}