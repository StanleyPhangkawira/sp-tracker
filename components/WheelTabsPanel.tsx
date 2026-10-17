"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
  Check,
  Clock,
  PackageOpen,
  History,
  List,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  WheelSlice,
  SliceType,
  InventoryItem,
  TimeAllowance,
  HistoryItem,
  ActiveAllowanceTimer,
} from "../context/AppContext";

const Play = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="6 3 20 12 6 21 6 3"/></svg>
);
const Pause = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
);
const Minus = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/></svg>
);

export const formatWheelTime = (totalSeconds: number) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const res = [];
  if (h > 0) res.push(`${h}h`);
  if (m > 0) res.push(`${m}m`);
  if (s > 0 || res.length === 0) res.push(`${s}s`);
  return res.join(" ");
};

interface WheelTabsPanelProps {
  wheelSlices: WheelSlice[];
  inventory: InventoryItem[];
  timeAllowances: TimeAllowance[];
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  activeAllowanceTimer: ActiveAllowanceTimer | null;
  nowTick: number;
  todayDateStr: string;
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  editForm: Partial<WheelSlice>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<WheelSlice>>>;
  activatingWildcardId: string | null;
  setActivatingWildcardId: React.Dispatch<React.SetStateAction<string | null>>;
  wildcardTargets: Record<string, string>;
  setWildcardTargets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAddSlice: () => void;
  onDeleteSlice: (id: string) => void;
  onStartEdit: (slice: WheelSlice) => void;
  onSaveEdit: () => void;
  onActivateInventoryItem: (item: InventoryItem) => void;
  onTrashInventoryItem: (e: React.MouseEvent, id: string) => void;
  onToggleAllowanceTimer: (target: string) => void;
  onAdjustAllowanceSeconds: (target: string, deltaSeconds: number) => void;
}

export default function WheelTabsPanel({
  wheelSlices,
  inventory,
  timeAllowances,
  history,
  setHistory,
  activeAllowanceTimer,
  nowTick,
  todayDateStr,
  editingId,
  setEditingId,
  editForm,
  setEditForm,
  activatingWildcardId,
  setActivatingWildcardId,
  wildcardTargets,
  setWildcardTargets,
  onAddSlice,
  onDeleteSlice,
  onStartEdit,
  onSaveEdit,
  onActivateInventoryItem,
  onTrashInventoryItem,
  onToggleAllowanceTimer,
  onAdjustAllowanceSeconds,
}: WheelTabsPanelProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "time" | "entries" | "history">("entries");
  const [openTypeDropdownIdx, setOpenTypeDropdownIdx] = useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full lg:max-h-[80vh] bg-white dark:bg-slate-900 w-full overflow-hidden">
      <div className="grid grid-cols-4 w-full border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
        {[
          { id: "inventory", icon: PackageOpen, label: "Inventory", badge: inventory.length },
          { id: "time", icon: Clock, label: "Time Bank", badge: timeAllowances.length },
          { id: "entries", icon: List, label: "Slices", badge: wheelSlices.length },
          { id: "history", icon: History, label: "History", badge: history.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`py-3.5 px-2 flex items-center justify-center gap-1.5 transition-colors text-xs md:text-sm font-bold cursor-pointer ${
              activeTab === t.id
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30"
                : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <t.icon size={16} />
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-extrabold font-rpg-num">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 relative overflow-x-hidden overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.18 }}
            className="p-4 md:p-6 space-y-3"
          >
            {/* INVENTORY TAB */}
            {activeTab === "inventory" && (
              <>
                {inventory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <PackageOpen size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">Your inventory is empty</p>
                    <p className="text-xs mt-1">Spin the wheel to win time boosters and tokens!</p>
                  </div>
                ) : null}
                {inventory.map((item) => {
                  const totalSec = item.slice.rewards.reduce((acc, r) => acc + (r.durationSeconds || 0), 0);
                  const tks = item.slice.rewards.reduce((acc, r) => acc + (r.spinTokens || 0), 0);
                  const hasWildcard = item.slice.rewards.some((r) => r.isWildcard && r.type !== "token");

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl shadow-xs group relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span
                              className="w-3 h-3 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: item.slice.color }}
                            />
                            <span>{item.slice.text || "Reward Slice"}</span>
                            {totalSec > 0 && (
                              <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-extrabold font-rpg-num">
                                +{formatWheelTime(totalSec)}
                              </span>
                            )}
                            {tks > 0 && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-extrabold font-rpg-num">
                                +{tks} Tk
                              </span>
                            )}
                            {item.slice.enchantments?.length ? (
                              <Sparkles size={14} className="text-amber-500" />
                            ) : null}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-400 uppercase font-bold tracking-wider mt-1">
                            {item.slice.rewards.map((r) => `${r.type}${r.target ? ` (${r.target})` : ""}`).join(" + ")}{" "}
                            · {item.timestamp}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {activatingWildcardId !== item.id && (
                            <>
                              <button
                                onClick={(e) => onTrashInventoryItem(e, item.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 p-2 rounded-xl transition-colors border border-transparent cursor-pointer"
                                title="Salvage for 25–44 SP"
                              >
                                <Trash2 size={17} />
                              </button>
                              <button
                                onClick={() => onActivateInventoryItem(item)}
                                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                              >
                                {hasWildcard ? "Configure" : "Activate"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {activatingWildcardId === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2 w-full border-t border-gray-200 dark:border-slate-700 pt-3">
                              <p className="text-xs font-bold text-gray-500 dark:text-slate-300">
                                Assign Wildcard Target App / Activity:
                              </p>
                              {item.slice.rewards
                                .filter((r) => r.isWildcard && r.type !== "token")
                                .map((rw) => (
                                  <input
                                    key={rw.id}
                                    type="text"
                                    placeholder={`Target App for ${formatWheelTime(rw.durationSeconds)} (e.g. YouTube, Gaming)`}
                                    value={wildcardTargets[rw.id] || ""}
                                    onChange={(e) =>
                                      setWildcardTargets((prev) => ({ ...prev, [rw.id]: e.target.value }))
                                    }
                                    className="w-full text-sm p-2.5 border border-indigo-300 dark:border-indigo-700 rounded-xl outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                  />
                                ))}
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setActivatingWildcardId(null)}
                                  className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => onActivateInventoryItem(item)}
                                  className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={14} /> Confirm
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </>
            )}

            {/* TIME BANK TAB */}
            {activeTab === "time" && (
              <>
                {timeAllowances.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                    <Clock size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm">No active Time Allowances yet</p>
                    <p className="text-xs mt-1">
                      Activate time rewards from your Inventory to bank recreational time.
                    </p>
                  </div>
                ) : null}
                {timeAllowances.map((allowance, idx) => {
                  const isRunning = activeAllowanceTimer?.target === allowance.target;
                  const liveElapsed = isRunning
                    ? Math.max(0, Math.floor((nowTick - activeAllowanceTimer.startedAt) / 1000))
                    : 0;
                  const isActiveBooster =
                    allowance.lastUpdated === todayDateStr && allowance.boosterSeconds > 0;
                  const rawBoost = isActiveBooster ? allowance.boosterSeconds : 0;
                  const rawPerm = allowance.permanentSeconds;

                  const displayBoost = Math.max(0, rawBoost - liveElapsed);
                  const remAfterBoost = Math.max(0, liveElapsed - rawBoost);
                  const displayPerm = Math.max(0, rawPerm - remAfterBoost);
                  const totalSec = displayPerm + displayBoost;

                  return (
                    <div
                      key={idx}
                      className={`border p-4 rounded-2xl shadow-xs mb-3 transition-all ${
                        isRunning
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/30"
                          : "bg-white dark:bg-slate-800/70 border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-white">
                            {allowance.target}
                          </h3>
                          {isRunning && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse">
                              Active Session
                            </span>
                          )}
                        </div>
                        <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-black font-rpg-num">
                          {formatWheelTime(totalSec)} Total
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-slate-900/80 p-2.5 rounded-xl">
                        <div className="flex gap-2 text-xs md:text-sm font-bold items-center font-rpg-num">
                          <span className="text-gray-900 dark:text-white">{formatWheelTime(displayPerm)}</span>
                          <span className="text-gray-400 font-sans">Perm</span>
                          {displayBoost > 0 && (
                            <>
                              <span className="text-gray-300 dark:text-slate-700 mx-1">|</span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{formatWheelTime(displayBoost)}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-sans">
                                Today Boost
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAdjustAllowanceSeconds(allowance.target, -300)}
                            disabled={totalSec <= 0}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-gray-200/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-0.5"
                            title="Deduct 5 minutes"
                          >
                            <Minus size={11} /> 5m
                          </button>
                          <button
                            onClick={() => onAdjustAllowanceSeconds(allowance.target, 300)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-gray-200/80 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                            title="Add 5 minutes"
                          >
                            <Plus size={11} /> 5m
                          </button>
                          <button
                            onClick={() => onToggleAllowanceTimer(allowance.target)}
                            disabled={totalSec <= 0 && !isRunning}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                              isRunning
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
                            }`}
                          >
                            {isRunning ? (
                              <>
                                <Pause size={13} /> Pause
                              </>
                            ) : (
                              <>
                                <Play size={13} /> Use Time
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* SLICES EDITOR TAB */}
            {activeTab === "entries" && (
              <>
                {wheelSlices.map((slice) => (
                  <div
                    key={slice.id}
                    className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl shadow-xs relative mb-3"
                  >
                    {editingId === slice.id ? (
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editForm.color?.startsWith("#") ? editForm.color : "#818cf8"}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                            title="Slice Color"
                          />
                          <input
                            type="text"
                            value={editForm.text || ""}
                            onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                            className="flex-1 font-bold text-gray-900 dark:text-white border-b border-indigo-400 outline-none pb-1 bg-transparent"
                            placeholder="Slice Custom Name"
                          />
                        </div>
                        <div className="space-y-2 border-l-2 border-indigo-200 dark:border-indigo-800 pl-3">
                          {editForm.rewards?.map((reward, idx) => (
                            <div
                              key={reward.id}
                              className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white relative"
                            >
                              <button
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    rewards: editForm.rewards?.filter((r) => r.id !== reward.id),
                                  })
                                }
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="grid grid-cols-2 gap-2 text-xs mb-2 pr-6">
                                <div className="relative">
                                  <label className="font-bold text-[10px] text-gray-500 dark:text-slate-400 uppercase">
                                    Type
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenTypeDropdownIdx(openTypeDropdownIdx === idx ? null : idx)
                                    }
                                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 mt-0.5 flex items-center justify-between font-bold capitalize cursor-pointer"
                                  >
                                    <span>{reward.type === "token" ? "Token Only" : reward.type}</span>
                                    <ChevronDown
                                      size={13}
                                      className={`transition-transform duration-200 ${
                                        openTypeDropdownIdx === idx ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {openTypeDropdownIdx === idx && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden"
                                      >
                                        {(
                                          [
                                            { val: "permanent", label: "Permanent" },
                                            { val: "booster", label: "Booster" },
                                            { val: "token", label: "Token Only" },
                                          ] as const
                                        ).map((opt) => (
                                          <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => {
                                              const newRewards = [...editForm.rewards!];
                                              newRewards[idx] = {
                                                ...newRewards[idx],
                                                type: opt.val as SliceType,
                                              };
                                              setEditForm({ ...editForm, rewards: newRewards });
                                              setOpenTypeDropdownIdx(null);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                              reward.type === opt.val
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                {reward.type !== "token" && (
                                  <div>
                                    <label className="font-bold text-[10px] text-gray-500 dark:text-slate-400 uppercase flex justify-between">
                                      Target
                                      <label className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!reward.isWildcard}
                                          onChange={(e) => {
                                            const newR = [...editForm.rewards!];
                                            newR[idx] = { ...newR[idx], isWildcard: e.target.checked };
                                            setEditForm({ ...editForm, rewards: newR });
                                          }}
                                        />{" "}
                                        Wildcard
                                      </label>
                                    </label>
                                    <input
                                      type="text"
                                      value={reward.target}
                                      disabled={reward.isWildcard}
                                      placeholder={reward.isWildcard ? "Dynamic" : "e.g. YouTube"}
                                      onChange={(e) => {
                                        const newRewards = [...editForm.rewards!];
                                        newRewards[idx] = { ...newRewards[idx], target: e.target.value };
                                        setEditForm({ ...editForm, rewards: newRewards });
                                      }}
                                      className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 mt-0.5 disabled:opacity-50"
                                    />
                                  </div>
                                )}
                              </div>
                              {reward.type !== "token" ? (
                                <div>
                                  <label className="font-bold text-[10px] text-gray-500 dark:text-slate-400 uppercase">
                                    Duration (H / M / S)
                                  </label>
                                  <div className="flex gap-2 mt-0.5">
                                    <input
                                      type="number"
                                      placeholder="H"
                                      value={Math.floor(reward.durationSeconds / 3600)}
                                      onChange={(e) => {
                                        const newR = [...editForm.rewards!];
                                        const h = Number(e.target.value);
                                        const m = Math.floor((newR[idx].durationSeconds % 3600) / 60);
                                        const s = newR[idx].durationSeconds % 60;
                                        newR[idx] = { ...newR[idx], durationSeconds: h * 3600 + m * 60 + s };
                                        setEditForm({ ...editForm, rewards: newR });
                                      }}
                                      className="w-1/3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 text-xs font-rpg-num"
                                    />
                                    <input
                                      type="number"
                                      placeholder="M"
                                      value={Math.floor((reward.durationSeconds % 3600) / 60)}
                                      onChange={(e) => {
                                        const newR = [...editForm.rewards!];
                                        const h = Math.floor(newR[idx].durationSeconds / 3600);
                                        const m = Number(e.target.value);
                                        const s = newR[idx].durationSeconds % 60;
                                        newR[idx] = { ...newR[idx], durationSeconds: h * 3600 + m * 60 + s };
                                        setEditForm({ ...editForm, rewards: newR });
                                      }}
                                      className="w-1/3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 text-xs font-rpg-num"
                                    />
                                    <input
                                      type="number"
                                      placeholder="S"
                                      value={reward.durationSeconds % 60}
                                      onChange={(e) => {
                                        const newR = [...editForm.rewards!];
                                        const h = Math.floor(newR[idx].durationSeconds / 3600);
                                        const m = Math.floor((newR[idx].durationSeconds % 3600) / 60);
                                        const s = Number(e.target.value);
                                        newR[idx] = { ...newR[idx], durationSeconds: h * 3600 + m * 60 + s };
                                        setEditForm({ ...editForm, rewards: newR });
                                      }}
                                      className="w-1/3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 text-xs font-rpg-num"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <label className="font-bold text-[10px] text-gray-500 dark:text-slate-400 uppercase">
                                    Spin Tokens Rewarded
                                  </label>
                                  <input
                                    type="number"
                                    value={reward.spinTokens || 0}
                                    onChange={(e) => {
                                      const newR = [...editForm.rewards!];
                                      newR[idx] = { ...newR[idx], spinTokens: Number(e.target.value) };
                                      setEditForm({ ...editForm, rewards: newR });
                                    }}
                                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg p-1.5 mt-0.5 text-xs font-rpg-num"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                rewards: [
                                  ...(editForm.rewards || []),
                                  {
                                    id: Date.now().toString(),
                                    type: "permanent",
                                    target: "",
                                    durationSeconds: 900,
                                    spinTokens: 0,
                                  },
                                ],
                              })
                            }
                            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus size={14} /> Add Reward Action
                          </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setOpenTypeDropdownIdx(null);
                            }}
                            className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              onSaveEdit();
                              setOpenTypeDropdownIdx(null);
                            }}
                            className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check size={14} /> Save Slice
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-xs mt-1 shrink-0 border border-black/10"
                              style={{ backgroundColor: slice.color }}
                            />
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {slice.text || "Unnamed Slice"}
                              </span>
                              <div className="flex flex-col gap-1 mt-2">
                                {slice.rewards.map((r) => (
                                  <div
                                    key={r.id}
                                    className="text-xs text-gray-600 dark:text-slate-300 flex items-center gap-2 bg-gray-50 dark:bg-slate-900/70 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 flex-wrap"
                                  >
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {r.type === "token"
                                        ? "Spin Tokens"
                                        : r.isWildcard
                                        ? "Wildcard Target"
                                        : r.target || "Unspecified"}
                                    </span>
                                    <span className="text-gray-300 dark:text-slate-700">|</span>
                                    {r.type === "token" ? (
                                      <span className="font-rpg-num bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                                        +{r.spinTokens} Tk
                                      </span>
                                    ) : (
                                      <span className="font-rpg-num bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                                        {formatWheelTime(r.durationSeconds)}
                                      </span>
                                    )}
                                    <span className="text-[9px] uppercase font-extrabold text-gray-400 ml-auto">
                                      {r.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                onStartEdit(slice);
                                setOpenTypeDropdownIdx(null);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteSlice(slice.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        {slice.enchantments && slice.enchantments.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex gap-1.5 flex-wrap relative z-10">
                            {slice.enchantments.map((e, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-extrabold bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 border border-fuchsia-200 dark:border-fuchsia-800"
                              >
                                <Sparkles size={11} /> {e}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <button
                  onClick={onAddSlice}
                  className="w-full bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 transition-colors mb-6 cursor-pointer"
                >
                  <Plus size={18} /> Add New Wheel Slice
                </button>
              </>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-white">Spin Log</h3>
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      className="text-xs font-bold text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Clear History
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-gray-400 dark:text-slate-500 text-sm italic text-center py-8">
                    No spins recorded yet.
                  </p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="flex justify-between items-center text-sm py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
                    >
                      <span className="font-bold text-gray-800 dark:text-white">{h.result}</span>
                      <span className="text-xs text-gray-400 font-rpg-num">{h.timestamp}</span>
                    </div>
                  ))
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}