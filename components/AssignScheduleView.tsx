"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  GripVertical,
  Star,
  Clock,
  X,
  Map,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  assignDays,
  AssignItemType,
  AssignDrag,
  TIME_PRESETS,
  DURATION_CHIPS,
  addMinutesToTimeStr,
  CollapsingRow,
  DropSlot,
} from "./QuestShared";

function AssignTimeEditor({
  item,
  onUpdate,
  onClose,
}: {
  item: AssignItemType;
  onUpdate: (updates: { startTime?: string; endTime?: string }) => void;
  onClose: () => void;
}) {
  const start = item.startTime || "09:00";
  const end = item.endTime || "";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden w-full"
      onPointerDown={(e) => e.stopPropagation()}
      data-nodrag
    >
      <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-lime-300 dark:border-lime-700/80 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400 flex items-center gap-1">
            <Clock size={11} /> RPG Time Slot Scheduler
          </span>
          <div className="flex items-center gap-1">
            {item.startTime && (
              <button
                type="button"
                onClick={() => {
                  onUpdate({ startTime: undefined, endTime: undefined });
                  onClose();
                }}
                className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Preset Time Slots */}
        <div className="flex flex-wrap gap-1">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.start}
              type="button"
              onClick={() => onUpdate({ startTime: p.start, endTime: p.end })}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer font-rpg-num ${
                item.startTime === p.start
                  ? "bg-lime-500 text-white border-lime-600 shadow-2xs"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-lime-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Start & End Time Steppers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-slate-800/90 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase text-gray-400">Start</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onUpdate({ startTime: addMinutesToTimeStr(start, -15) })}
                  className="text-[9px] font-bold px-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-lime-200 cursor-pointer"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ startTime: addMinutesToTimeStr(start, 15) })}
                  className="text-[9px] font-bold px-1 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-lime-200 cursor-pointer"
                >
                  +15m
                </button>
              </div>
            </div>
            <input
              type="time"
              value={item.startTime || ""}
              onChange={(e) => onUpdate({ startTime: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs font-bold font-rpg-num rounded-md px-2 py-1 outline-none focus:border-lime-500"
            />
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/90 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase text-gray-400">End</span>
              {end && (
                <button
                  type="button"
                  onClick={() => onUpdate({ endTime: undefined })}
                  className="text-[9px] font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  None
                </button>
              )}
            </div>
            <input
              type="time"
              value={end}
              onChange={(e) => onUpdate({ startTime: item.startTime || "09:00", endTime: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs font-bold font-rpg-num rounded-md px-2 py-1 outline-none focus:border-lime-500"
            />
          </div>
        </div>

        {/* Quick Duration Chips */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <span className="text-[9px] font-bold uppercase text-gray-400">Duration:</span>
          <div className="flex gap-1">
            {DURATION_CHIPS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => {
                  const baseStart = item.startTime || "09:00";
                  onUpdate({
                    startTime: baseStart,
                    endTime: addMinutesToTimeStr(baseStart, d.mins),
                  });
                }}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-lime-100/80 dark:bg-lime-950/70 text-lime-800 dark:text-lime-300 hover:bg-lime-200 dark:hover:bg-lime-900 cursor-pointer font-rpg-num"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface AssignScheduleViewProps {
  columns: number;
  assignDrag: AssignDrag | null;
  enableTimeSetting: boolean;
  editingTimeId: string | null;
  setEditingTimeId: React.Dispatch<React.SetStateAction<string | null>>;
  mobileAssignIndex: number;
  setMobileAssignIndex: React.Dispatch<React.SetStateAction<number>>;
  floatingCardRef: React.MutableRefObject<HTMLDivElement | null>;
  placeFloatingCard: () => void;
  getAssignItemsForDay: (day: string) => AssignItemType[];
  beginAssignDrag: (e: React.PointerEvent, item: AssignItemType, day: string) => void;
  updateAssignItemTime: (
    item: AssignItemType,
    updates: { startTime?: string; endTime?: string; assignedDays?: string[] }
  ) => void;
}

export default function AssignScheduleView({
  columns,
  assignDrag,
  enableTimeSetting,
  editingTimeId,
  setEditingTimeId,
  mobileAssignIndex,
  setMobileAssignIndex,
  floatingCardRef,
  placeFloatingCard,
  getAssignItemsForDay,
  beginAssignDrag,
  updateAssignItemTime,
}: AssignScheduleViewProps) {
  const swipeControls = useDragControls();

  return (
    <>
      {/* ASSIGN MODE PC VIEW (Deterministic Masonry Columns) */}
      <div className="hidden md:flex items-start gap-4 md:gap-6 select-none">
        {Array.from({ length: columns }, (_, col) => (
          <div key={col} className="flex-1 min-w-0 flex flex-col gap-4 md:gap-6">
            {assignDays
              .filter((_, i) => i % columns === col)
              .map((day) => {
                const allItems = getAssignItemsForDay(day);
                const isTarget = assignDrag?.targetDay === day;
                const visibleItems = assignDrag
                  ? allItems.filter((i) => i.id !== assignDrag.item.id)
                  : allItems;
                const slot =
                  isTarget && assignDrag ? Math.min(assignDrag.targetIndex, visibleItems.length) : -1;
                const slotHeight = assignDrag?.height ?? 0;
                const startOpen = !!assignDrag?.fresh;
                const showEmptyHint = day !== "Unorganized" && visibleItems.length === 0 && !isTarget;

                return (
                  <div
                    key={day}
                    data-assign-day={day}
                    className={`w-full border shadow-xs rounded-2xl p-4 md:p-5 transition-colors duration-200 ${
                      isTarget
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700"
                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                    }`}
                  >
                    <h3 className="font-bold text-gray-800 dark:text-white text-base md:text-lg mb-3 flex justify-between items-center">
                      <span>{day}</span>
                      <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full font-rpg-num">
                        {allItems.length}
                      </span>
                    </h3>
                    <div data-assign-list className="flex flex-col -mb-3">
                      <AnimatePresence initial={false} custom={!assignDrag}>
                        {visibleItems.flatMap((item, idx) => {
                          const isTimed = !!item.startTime;
                          const isDone = item.isCompleted || item.isClaimed;
                          const isTimeEditorOpen = enableTimeSetting || editingTimeId === item.id;
                          return [
                            idx === slot && (
                              <DropSlot key={`slot-${idx}`} height={slotHeight} startOpen={startOpen} />
                            ),
                            <div
                              key={item.id}
                              data-assign-item
                              onPointerDown={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest("input, select, textarea, button, a, [data-nodrag]"))
                                  return;
                                beginAssignDrag(e, item, day);
                              }}
                              className={`mb-3 p-3 rounded-xl border text-sm transition-colors group select-none touch-none cursor-grab active:cursor-grabbing ${
                                isDone
                                  ? "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 opacity-70"
                                  : isTimed
                                  ? "bg-lime-50/90 dark:bg-lime-950/40 border-lime-300 dark:border-lime-800 hover:border-lime-400 shadow-2xs"
                                  : item.isDaily
                                  ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900"
                                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    beginAssignDrag(e, item, day);
                                  }}
                                  className="shrink-0 mt-0.5 touch-none cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 hover:text-gray-500"
                                  title="Drag to assign"
                                >
                                  <GripVertical size={16} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      {item.isDaily ? (
                                        <div
                                          className={`font-bold text-sm truncate ${
                                            isDone
                                              ? "text-gray-400 dark:text-slate-500 line-through"
                                              : "text-gray-800 dark:text-white"
                                          }`}
                                        >
                                          {item.goalTitle} {item.icon}
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-[10px] text-gray-400 font-bold mb-0.5 truncate uppercase tracking-wider">
                                            {item.goalTitle}
                                          </div>
                                          <div
                                            className={`font-semibold text-sm truncate ${
                                              item.isFailed
                                                ? "text-red-400 line-through"
                                                : isDone
                                                ? "text-gray-400 dark:text-slate-500 line-through"
                                                : "text-gray-800 dark:text-white"
                                            }`}
                                          >
                                            {item.isOptional && (
                                              <Star size={12} className="inline mr-1 text-amber-400 mb-0.5" />
                                            )}
                                            {item.title}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onClick={() =>
                                        setEditingTimeId(editingTimeId === item.id ? null : item.id)
                                      }
                                      className={`shrink-0 border text-[10px] font-bold rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer transition-all font-rpg-num ${
                                        isTimed
                                          ? "bg-lime-200/80 dark:bg-lime-950/90 hover:bg-lime-300 border-lime-300 dark:border-lime-700 text-lime-900 dark:text-lime-300"
                                          : "bg-gray-100 dark:bg-slate-900 hover:bg-lime-50 dark:hover:bg-lime-950/40 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400"
                                      }`}
                                    >
                                      <Clock size={11} />
                                      <span>
                                        {isTimed
                                          ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ""}`
                                          : "Set Time"}
                                      </span>
                                    </button>
                                  </div>

                                  <AnimatePresence initial={false}>
                                    {isTimeEditorOpen && (
                                      <AssignTimeEditor
                                        item={item}
                                        onUpdate={(updates) => updateAssignItemTime(item, updates)}
                                        onClose={() => setEditingTimeId(null)}
                                      />
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>,
                          ];
                        })}
                        {slot === visibleItems.length && (
                          <DropSlot key={`slot-${slot}`} height={slotHeight} startOpen={startOpen} />
                        )}
                        {showEmptyHint && (
                          <CollapsingRow key="empty-hint" height={100}>
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/30">
                              <p className="text-xs text-gray-400 font-medium">Drop tasks here</p>
                            </div>
                          </CollapsingRow>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* Floating drag card */}
      {assignDrag && (
        <div
          ref={(el) => {
            floatingCardRef.current = el;
            if (el) placeFloatingCard();
          }}
          className="fixed left-0 top-0 z-[100] pointer-events-none will-change-transform"
          style={{ width: assignDrag.width }}
        >
          <div
            className={`w-full p-3 rounded-xl border shadow-2xl text-sm ${
              assignDrag.item.startTime
                ? "bg-lime-50 dark:bg-lime-950 border-lime-300 dark:border-lime-700 ring-2 ring-lime-400/40"
                : assignDrag.item.isDaily
                ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-2">
              <GripVertical size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-wider">
                    {assignDrag.item.goalTitle}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 flex items-center gap-1 shrink-0">
                    <Map size={9} /> From {assignDrag.sourceDay}
                  </span>
                </div>
                <div className="font-semibold text-sm truncate text-gray-800 dark:text-white">
                  {assignDrag.item.title || assignDrag.item.goalTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODE MOBILE VIEW */}
      <div className="md:hidden flex flex-col w-full overflow-hidden">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 mb-5 sticky top-4 z-10">
          <button
            onClick={() => setMobileAssignIndex((prev) => Math.max(0, prev - 1))}
            className={`p-2 transition-opacity ${mobileAssignIndex === 0 ? "opacity-30" : "opacity-100"}`}
            disabled={mobileAssignIndex === 0}
          >
            <ChevronLeft />
          </button>
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
              {assignDays[mobileAssignIndex]}
            </h3>
            <div className="flex gap-1 mt-1">
              {assignDays.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === mobileAssignIndex ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => setMobileAssignIndex((prev) => Math.min(7, prev + 1))}
            className={`p-2 transition-opacity ${mobileAssignIndex === 7 ? "opacity-30" : "opacity-100"}`}
            disabled={mobileAssignIndex === 7}
          >
            <ChevronRight />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mobileAssignIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            data-assign-day={assignDays[mobileAssignIndex]}
            drag="x"
            dragListener={false}
            dragControls={swipeControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onPointerDown={(e) => {
              if (
                !(e.target as HTMLElement).closest("input, select, textarea, button, a, [data-nodrag]")
              )
                swipeControls.start(e);
            }}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -50 && mobileAssignIndex < 7)
                setMobileAssignIndex((prev) => prev + 1);
              else if (info.offset.x > 50 && mobileAssignIndex > 0)
                setMobileAssignIndex((prev) => prev - 1);
            }}
            className="min-h-[50vh] pt-2 touch-pan-y"
          >
            {(() => {
              const day = assignDays[mobileAssignIndex];
              const items = getAssignItemsForDay(day);
              const visibleItems = assignDrag
                ? items.filter((i) => i.id !== assignDrag.item.id)
                : items;
              const isTarget = assignDrag?.targetDay === day;
              const slot =
                isTarget && assignDrag ? Math.min(assignDrag.targetIndex, visibleItems.length) : -1;
              const slotHeight = assignDrag?.height ?? 0;
              const startOpen = !!assignDrag?.fresh;

              return (
                <div data-assign-list className="flex flex-col -mb-3">
                  <AnimatePresence initial={false} custom={!assignDrag}>
                    {visibleItems.flatMap((item, idx) => {
                      const isTimed = !!item.startTime;
                      const isDone = item.isCompleted || item.isClaimed;
                      const isTimeEditorOpen = enableTimeSetting || editingTimeId === item.id;
                      return [
                        idx === slot && (
                          <DropSlot key={`slot-${idx}`} height={slotHeight} startOpen={startOpen} />
                        ),
                        <div
                          key={item.id}
                          data-assign-item
                          onPointerDown={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest("input, select, textarea, button, a, [data-nodrag]"))
                              return;
                            beginAssignDrag(e, item, day);
                          }}
                          className={`mb-3 p-4 rounded-2xl border text-sm flex flex-col gap-2 shadow-xs transition-colors group select-none touch-none cursor-grab active:cursor-grabbing ${
                            isDone
                              ? "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 opacity-70"
                              : isTimed
                              ? "bg-lime-50 dark:bg-lime-950/40 border-lime-300 dark:border-lime-800"
                              : item.isDaily
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900"
                              : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                beginAssignDrag(e, item, day);
                              }}
                              className="shrink-0 self-center -ml-1.5 p-1.5 touch-none cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600"
                            >
                              <GripVertical size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              {item.isDaily ? (
                                <div
                                  className={`font-bold text-base truncate ${
                                    isDone
                                      ? "text-gray-400 dark:text-slate-500 line-through"
                                      : "text-gray-800 dark:text-white"
                                  }`}
                                >
                                  {item.goalTitle} {item.icon}
                                </div>
                              ) : (
                                <>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5 truncate uppercase tracking-wider">
                                    {item.goalTitle}
                                  </div>
                                  <div
                                    className={`font-semibold text-base truncate ${
                                      item.isFailed
                                        ? "text-red-400 line-through"
                                        : isDone
                                        ? "text-gray-400 dark:text-slate-500 line-through"
                                        : "text-gray-800 dark:text-white"
                                    }`}
                                  >
                                    {item.isOptional && (
                                      <Star size={12} className="inline mr-1 text-amber-400 mb-0.5" />
                                    )}
                                    {item.title}
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTimeId(editingTimeId === item.id ? null : item.id)
                              }
                              className={`shrink-0 border text-[10px] font-bold rounded-lg px-2.5 py-1 flex items-center gap-1 cursor-pointer font-rpg-num ${
                                isTimed
                                  ? "bg-lime-200/80 dark:bg-lime-950 text-lime-900 dark:text-lime-300 border-lime-300 dark:border-lime-700"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                              }`}
                            >
                              <Clock size={11} />
                              <span>{isTimed ? item.startTime : "Time"}</span>
                            </button>
                          </div>

                          <AnimatePresence initial={false}>
                            {isTimeEditorOpen && (
                              <AssignTimeEditor
                                item={item}
                                onUpdate={(updates) => updateAssignItemTime(item, updates)}
                                onClose={() => setEditingTimeId(null)}
                              />
                            )}
                          </AnimatePresence>
                        </div>,
                      ];
                    })}
                    {slot === visibleItems.length && (
                      <DropSlot key={`slot-${slot}`} height={slotHeight} startOpen={startOpen} />
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}