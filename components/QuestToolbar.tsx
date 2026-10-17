"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Clock,
  Coins,
  SlidersHorizontal,
  ChevronDown,
  Check,
  UnfoldVertical,
  FoldVertical,
  Sparkles,
} from "lucide-react";
import { CATEGORIES } from "./QuestShared";

const Utils_Filters = ["All", "weekly", "daily", "list"] as const;

interface QuestToolbarProps {
  isAssignMode: boolean;
  setIsAssignMode: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeCategory: string;
  setActiveCategory: React.Dispatch<React.SetStateAction<string>>;
  activeFilter: "All" | "weekly" | "daily" | "list";
  setActiveFilter: React.Dispatch<React.SetStateAction<"All" | "weekly" | "daily" | "list">>;
  hideFinishedAssign: boolean;
  setHideFinishedAssign: React.Dispatch<React.SetStateAction<boolean>>;
  enableTimeSetting: boolean;
  setEnableTimeSetting: React.Dispatch<React.SetStateAction<boolean>>;
  allCollapsed: boolean;
  onToggleCollapseAll: () => void;
  showRewards: boolean;
  setShowRewards: React.Dispatch<React.SetStateAction<boolean>>;
  showTime: boolean;
  setShowTime: React.Dispatch<React.SetStateAction<boolean>>;
  columns: number;
  setColumns: React.Dispatch<React.SetStateAction<number>>;
  mobileColumns: number;
  setMobileColumns: React.Dispatch<React.SetStateAction<number>>;
}

export default function QuestToolbar({
  isAssignMode,
  setIsAssignMode,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  activeFilter,
  setActiveFilter,
  hideFinishedAssign,
  setHideFinishedAssign,
  enableTimeSetting,
  setEnableTimeSetting,
  allCollapsed,
  onToggleCollapseAll,
  showRewards,
  setShowRewards,
  showTime,
  setShowTime,
  columns,
  setColumns,
  mobileColumns,
  setMobileColumns,
}: QuestToolbarProps) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    };
    if (viewMenuOpen) {
      window.addEventListener("mousedown", handleOutside);
    }
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [viewMenuOpen]);

  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 rounded-2xl p-3 md:p-3.5 border border-gray-200/80 dark:border-slate-800 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all">
      {/* Left: Filters & Search */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {!isAssignMode && (
          <>
            {/* Search Box */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl px-3 h-10 w-full sm:w-52 md:w-60 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quests..."
                className="text-xs bg-transparent outline-none text-gray-800 dark:text-white w-full placeholder:text-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="h-10 text-xs font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 text-gray-700 dark:text-slate-200 rounded-xl px-3 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter Pills */}
            <div className="flex items-center h-10 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700/80">
              {Utils_Filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`h-full px-3.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center justify-center ${
                    activeFilter === f
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        {isAssignMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setHideFinishedAssign(!hideFinishedAssign)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                hideFinishedAssign
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
              }`}
            >
              {hideFinishedAssign ? "Show All Tasks" : "Hide Finished Tasks"}
            </button>

            <button
              onClick={() => setEnableTimeSetting(!enableTimeSetting)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                enableTimeSetting
                  ? "bg-lime-600 text-white border-lime-600 shadow-2xs"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
              }`}
            >
              <Clock size={14} />
              <span>{enableTimeSetting ? "Lock Time Slots" : "Quick Time Slots"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Mode Toggle + Packed View Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Assign / Normal Mode Switcher */}
        <div className="flex items-center h-10 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700/80">
          <button
            onClick={() => setIsAssignMode(false)}
            className={`h-full px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isAssignMode
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            Quests
          </button>
          <button
            onClick={() => setIsAssignMode(true)}
            className={`h-full px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isAssignMode
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            Assign Mode
          </button>
        </div>

        {/* Unified "View" Button Packing Columns & Toggles */}
        <div className="relative" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => setViewMenuOpen((prev) => !prev)}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer transition-all ${
              viewMenuOpen
                ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700/80 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
            title="View Settings (Columns & Display Toggles)"
          >
            <SlidersHorizontal size={15} className="text-indigo-500 shrink-0" />
            <span>View</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md text-indigo-700 dark:text-indigo-300 font-rpg-num">
              {columns}COL
            </span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${viewMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* View Settings Popover */}
          {viewMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-3.5 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-indigo-500" /> View Configuration
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  {columns} Column{columns > 1 ? "s" : ""}
                </span>
              </div>

              {/* Column Count Controls */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Desktop Grid Columns</span>
                  <span className="text-[10px] text-gray-400 font-rpg-num">{columns} Cols</span>
                </label>
                <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setColumns(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-black transition-all cursor-pointer font-rpg-num ${
                        columns === num
                          ? "bg-indigo-600 text-white shadow-xs scale-105"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  className="w-full rpg-slider mt-1"
                />
              </div>

              {/* Mobile Columns */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300">
                  Mobile Layout
                </span>
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setMobileColumns(1)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                      mobileColumns === 1
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    1 Col
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileColumns(2)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                      mobileColumns === 2
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    2 Cols
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-slate-800" />

              {/* Display Toggles */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Coins size={14} className="text-amber-500" />
                    <span>Show Rewards (+SP)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRewards}
                    onChange={(e) => setShowRewards(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-lime-500" />
                    <span>Show Time Windows</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTime}
                    onChange={(e) => setShowTime(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {!isAssignMode && (
                  <button
                    type="button"
                    onClick={onToggleCollapseAll}
                    className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {allCollapsed ? (
                        <UnfoldVertical size={14} className="text-indigo-500" />
                      ) : (
                        <FoldVertical size={14} className="text-indigo-500" />
                      )}
                      <span>{allCollapsed ? "Expand All Quests" : "Collapse All Quests"}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}