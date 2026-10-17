"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Dices, Sparkles } from "lucide-react";
import { useAppContext, WheelSlice, SliceType } from "../context/AppContext";
import WheelTabsPanel, { formatWheelTime } from "./WheelTabsPanel";

interface SpinningWheelProps {
  isGlowing?: boolean;
}

export default function SpinningWheel({ isGlowing = false }: SpinningWheelProps) {
  const {
    spinTokens,
    setSpinTokens,
    wheelSlices,
    setWheelSlices,
    inventory,
    setInventory,
    timeAllowances,
    setTimeAllowances,
    history,
    setHistory,
    setSpCoins,
    darkMode,
    playSound,
    activeAllowanceTimer,
    setActiveAllowanceTimer,
  } = useAppContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WheelSlice>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [idleRotation, setIdleRotation] = useState(0);
  const [winner, setWinner] = useState<WheelSlice | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [activatingWildcardId, setActivatingWildcardId] = useState<string | null>(null);
  const [wildcardTargets, setWildcardTargets] = useState<Record<string, string>>({});
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const getPastelColor = () => `hsl(${Math.floor(Math.random() * 360)}, 75%, 78%)`;
  const todayDateStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!activeAllowanceTimer) return;
    setNowTick(Date.now());
    const id = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [activeAllowanceTimer]);

  const commitElapsedAllowance = (target: string, elapsedSeconds: number) => {
    if (elapsedSeconds <= 0) return;
    setTimeAllowances((prev) =>
      prev.map((a) => {
        if (a.target !== target) return a;
        const isActiveBooster = a.lastUpdated === todayDateStr && a.boosterSeconds > 0;
        let boost = isActiveBooster ? a.boosterSeconds : 0;
        let perm = a.permanentSeconds;
        let rem = elapsedSeconds;
        if (boost >= rem) {
          boost -= rem;
          rem = 0;
        } else {
          rem -= boost;
          boost = 0;
          perm = Math.max(0, perm - rem);
        }
        return { ...a, boosterSeconds: boost, permanentSeconds: perm, lastUpdated: todayDateStr };
      })
    );
  };

  const toggleAllowanceTimer = (target: string) => {
    playSound("click");
    if (activeAllowanceTimer) {
      const elapsed = Math.max(0, Math.floor((Date.now() - activeAllowanceTimer.startedAt) / 1000));
      commitElapsedAllowance(activeAllowanceTimer.target, elapsed);
      if (activeAllowanceTimer.target === target) {
        setActiveAllowanceTimer(null);
        return;
      }
    }
    setActiveAllowanceTimer({ target, startedAt: Date.now() });
  };

  const adjustAllowanceSeconds = (target: string, deltaSeconds: number) => {
    playSound("click");
    if (activeAllowanceTimer?.target === target) {
      const elapsed = Math.max(0, Math.floor((Date.now() - activeAllowanceTimer.startedAt) / 1000));
      commitElapsedAllowance(target, elapsed);
      setActiveAllowanceTimer({ target, startedAt: Date.now() });
    }
    setTimeAllowances((prev) =>
      prev.map((a) => {
        if (a.target !== target) return a;
        const nextPerm = Math.max(0, a.permanentSeconds + deltaSeconds);
        return { ...a, permanentSeconds: nextPerm };
      })
    );
  };

  // High-DPI Canvas rendering for the Spinning Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const logicalSize = 400;
    if (canvas.width !== logicalSize * dpr || canvas.height !== logicalSize * dpr) {
      canvas.width = logicalSize * dpr;
      canvas.height = logicalSize * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    const radius = logicalSize / 2;
    ctx.clearRect(0, 0, logicalSize, logicalSize);

    if (wheelSlices.length === 0) {
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 4, 0, 2 * Math.PI);
      ctx.fillStyle = darkMode ? "#1e293b" : "#e2e8f0";
      ctx.fill();
      ctx.fillStyle = darkMode ? "#94a3b8" : "#64748b";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add Slices to Spin", radius, radius);
      ctx.restore();
      return;
    }

    const sliceAngle = (2 * Math.PI) / wheelSlices.length;

    wheelSlices.forEach((item, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 4, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = darkMode ? "#0f172a" : "#ffffff";
      ctx.stroke();

      const pegAngle = startAngle;
      const pegX = radius + (radius - 12) * Math.cos(pegAngle);
      const pegY = radius + (radius - 12) * Math.sin(pegAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#94a3b8";
      ctx.stroke();

      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px system-ui, sans-serif";

      const totalSec = item.rewards?.reduce((acc, r) => acc + (r.durationSeconds || 0), 0) || 0;
      const tks = item.rewards?.reduce((acc, r) => acc + (r.spinTokens || 0), 0) || 0;
      const extra = [];
      if (totalSec > 0) extra.push(formatWheelTime(totalSec));
      if (tks > 0) extra.push(`${tks}Tk`);
      const rawLabel = `${item.enchantments?.length ? "✨" : ""}${item.text || "Slice"} ${
        extra.length ? `(${extra.join("+")})` : ""
      }`;
      const truncated = rawLabel.length > 22 ? rawLabel.slice(0, 21) + "…" : rawLabel;

      ctx.fillText(truncated, radius - 26, 4);
      ctx.restore();
    });

    ctx.restore();
  }, [wheelSlices, darkMode]);

  useEffect(() => {
    if (isSpinning) return;
    let animId: number;
    const tick = () => {
      setIdleRotation((prev) => (prev + 0.15) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isSpinning]);

  const handleAddSlice = () => {
    playSound("click");
    const newId = Date.now().toString();
    const newSlice: WheelSlice = { id: newId, text: "", color: getPastelColor(), rewards: [] };
    setWheelSlices((prev) => [...prev, newSlice]);
    setEditingId(newId);
    setEditForm(newSlice);
  };
  const handleDeleteSlice = (id: string) => {
    setWheelSlices((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };
  const startEdit = (slice: WheelSlice) => {
    setEditingId(slice.id);
    setEditForm(JSON.parse(JSON.stringify(slice)));
  };
  const saveEdit = () => {
    setWheelSlices(wheelSlices.map((s) => (s.id === editingId ? ({ ...s, ...editForm } as WheelSlice) : s)));
    setEditingId(null);
  };

  const processEnchantments = (winSlice: WheelSlice) => {
    const activeSlices = JSON.parse(JSON.stringify(wheelSlices)) as WheelSlice[];
    const localAnnounce: string[] = [];
    const inventoryAdditions: typeof inventory = [];
    let bonusTokens = 0;
    const allRewards = () => activeSlices.flatMap((s) => s.rewards.map((r) => ({ slice: s, reward: r })));

    winSlice.enchantments?.forEach((ench) => {
      const winIdx = activeSlices.findIndex((s) => s.id === winSlice.id);
      if (ench === "Respect" && activeSlices.length >= 2) {
        const s1 = activeSlices.splice(Math.floor(Math.random() * activeSlices.length), 1)[0];
        const s2 = activeSlices.splice(Math.floor(Math.random() * activeSlices.length), 1)[0];
        activeSlices.push({
          id: Date.now().toString() + Math.random(),
          text: "Combo Slice",
          color: getPastelColor(),
          rewards: [...s1.rewards, ...s2.rewards],
          enchantments: [],
        });
        localAnnounce.push(`Respect: Merged "${s1.text}" & "${s2.text}" into Combo Slice!`);
      } else if ((ench === "Altering I" || ench === "Altering II") && activeSlices.length >= 2) {
        const perms = allRewards().filter((x) => x.reward.type === "permanent");
        if (perms.length >= 2) {
          const cut = perms[Math.floor(Math.random() * perms.length)];
          const add = perms.find((p) => p.reward.id !== cut.reward.id);
          if (add) {
            const oldCut = cut.reward.durationSeconds;
            const oldAdd = add.reward.durationSeconds;
            cut.reward.durationSeconds = Math.max(0, oldCut - 120);
            add.reward.durationSeconds = oldAdd + (ench === "Altering I" ? 180 : 240);
            localAnnounce.push(
              `${ench}: "${cut.reward.target}" ${formatWheelTime(oldCut)}→${formatWheelTime(
                cut.reward.durationSeconds
              )}. "${add.reward.target}" ${formatWheelTime(oldAdd)}→${formatWheelTime(add.reward.durationSeconds)}`
            );
          }
        }
      } else if (ench === "Breaking") {
        const bRewards = winSlice.rewards
          .filter((r) => r.type === "permanent")
          .map((r) => ({
            ...r,
            id: "b" + Math.random(),
            type: "booster" as SliceType,
            durationSeconds: Math.ceil(r.durationSeconds * 3.5),
          }));
        if (bRewards.length > 0) {
          inventoryAdditions.push({
            id: Date.now().toString() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            slice: {
              ...winSlice,
              id: "brk" + Date.now(),
              text: `(Break) ${winSlice.text}`,
              rewards: bRewards,
              enchantments: [],
            },
          });
          localAnnounce.push("Breaking: Generated massive 350% Booster!");
        }
      } else if (ench.startsWith("Quietness")) {
        if (winIdx !== -1)
          activeSlices[winIdx].enchantments = activeSlices[winIdx].enchantments?.filter((e) => e !== ench);
        const targets = allRewards();
        if (targets.length) {
          const rand = targets[Math.floor(Math.random() * targets.length)];
          const old = rand.reward.durationSeconds;
          rand.reward.durationSeconds = Math.ceil(old * (ench === "Quietness I" ? 1.1 : 1.3));
          if (rand.slice.enchantments?.includes("Quietness I")) {
            rand.slice.enchantments = rand.slice.enchantments.filter((e) => e !== "Quietness I");
            rand.slice.enchantments.push("Quietness II");
          }
          localAnnounce.push(
            `${ench}: "${rand.reward.target}" ${formatWheelTime(old)}→${formatWheelTime(rand.reward.durationSeconds)}`
          );
        }
      } else if (ench.startsWith("Purity")) {
        const targets = allRewards();
        if (targets.length) {
          const rand = targets[Math.floor(Math.random() * targets.length)];
          const old = rand.reward.durationSeconds;
          if (rand.reward.type === "permanent")
            rand.reward.durationSeconds += ench === "Purity I" ? 60 : ench === "Purity II" ? 120 : 180;
          if (ench === "Purity IV" && rand.reward.type === "booster") rand.reward.durationSeconds += 1800;
          localAnnounce.push(
            `${ench}: "${rand.reward.target}" ${formatWheelTime(old)}→${formatWheelTime(rand.reward.durationSeconds)}`
          );
        }
      } else if (ench.startsWith("Tail")) {
        bonusTokens++;
        const targets = allRewards().filter(
          (x) => x.reward.type === "permanent" || x.reward.type === "booster"
        );
        if (targets.length) {
          const rand = targets[Math.floor(Math.random() * targets.length)];
          const old = rand.reward.durationSeconds;
          rand.reward.durationSeconds = Math.ceil(
            old * (ench === "Tail I" ? 0.7 : ench === "Tail II" ? 0.8 : 0.9)
          );
          localAnnounce.push(
            `${ench}: +1 Spin Token, "${rand.reward.target}" ${formatWheelTime(old)}→${formatWheelTime(
              rand.reward.durationSeconds
            )}`
          );
        }
      }
    });
    setTimeout(() => {
      setWheelSlices(activeSlices);
    }, 650);
    if (bonusTokens > 0) setSpinTokens((prev) => prev + bonusTokens);
    return { localAnnounce, inventoryAdditions };
  };

  const spinWheel = (e: React.MouseEvent) => {
    if (wheelSlices.length === 0 || isSpinning || spinTokens < 1) return;
    playSound("spin");
    const btnRect = e.currentTarget.getBoundingClientRect();
    const originX = (btnRect.left + btnRect.width / 2) / window.innerWidth;
    const originY = (btnRect.top + btnRect.height / 2) / window.innerHeight;

    setIsSpinning(true);
    setWinner(null);
    setAnnouncements([]);
    setSpinTokens((prev) => prev - 1);

    const targetSpin =
      rotation + idleRotation + Math.floor(Math.random() * 5 + 5) * 360 + Math.floor(Math.random() * 360);
    setRotation(targetSpin);
    setIdleRotation(0);

    setTimeout(() => {
      setIsSpinning(false);
      const winningIndex = Math.floor(((360 - (targetSpin % 360)) % 360) / (360 / wheelSlices.length));
      const winningSlice = wheelSlices[winningIndex];
      if (!winningSlice) return;
      setWinner(winningSlice);
      playSound("quest");
      confetti({ particleCount: 140, spread: 80, origin: { x: originX, y: originY } });

      const { localAnnounce, inventoryAdditions } = processEnchantments(winningSlice);
      if (localAnnounce.length) setAnnouncements(localAnnounce);
      setInventory((prev) => [
        { id: Date.now().toString(), slice: winningSlice, timestamp: new Date().toLocaleTimeString() },
        ...inventoryAdditions,
        ...prev,
      ]);
      setHistory((prev) => [
        { id: Date.now().toString(), result: winningSlice.text || "Slice", timestamp: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    }, 4000);
  };

  const activateInventoryItem = (invItem: (typeof inventory)[0]) => {
    const { slice } = invItem;
    const missingWildcards = slice.rewards.filter(
      (r) => r.isWildcard && r.type !== "token" && !wildcardTargets[r.id]?.trim()
    );
    if (missingWildcards.length > 0) {
      setActivatingWildcardId(invItem.id);
      return;
    }

    playSound("claim");
    slice.rewards.forEach((reward) => {
      if (reward.type === "token") {
        setSpinTokens((prev) => prev + (reward.spinTokens || 1));
      } else {
        const targetName = reward.isWildcard ? wildcardTargets[reward.id]?.trim() : reward.target;
        if (targetName && reward.durationSeconds) {
          setTimeAllowances((prev) => {
            const existing = prev.find((p) => p.target === targetName);
            const isNewDay = existing && existing.lastUpdated !== todayDateStr;
            let perm = existing ? existing.permanentSeconds : 0;
            let boost = existing && !isNewDay ? existing.boosterSeconds : 0;
            if (reward.type === "permanent") perm += reward.durationSeconds;
            else if (reward.type === "booster") boost += reward.durationSeconds;
            const updated = {
              target: targetName,
              permanentSeconds: perm,
              boosterSeconds: boost,
              lastUpdated: todayDateStr,
            };
            if (existing) return prev.map((p) => (p.target === targetName ? updated : p));
            return [...prev, updated];
          });
        }
      }
    });
    setInventory((prev) => prev.filter((i) => i.id !== invItem.id));
    setActivatingWildcardId(null);
    setWildcardTargets({});
  };

  const trashInventoryItem = (e: React.MouseEvent, id: string) => {
    playSound("claim");
    const refund = Math.floor(Math.random() * (44 - 25 + 1)) + 25;
    setSpCoins((prev) => prev + refund);
    setInventory((prev) => prev.filter((i) => i.id !== id));

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ particleCount: 30, spread: 50, origin: { x, y }, colors: ["#facc15", "#fbbf24"] });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[75vh]">
      {/* WHEEL ARENA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-indigo-50/30 dark:from-slate-900 dark:to-slate-950">
        {winner && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-6 text-center max-w-md w-full"
          >
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-3 py-1 rounded-full">
              🎉 Jackpot Reward Unlocked
            </span>
            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white bg-white dark:bg-slate-800 mt-2 px-5 py-3 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-md">
              {winner.text || "Mystery Slice"}
            </p>
            {announcements.length > 0 && (
              <div className="mt-3 bg-white/90 dark:bg-slate-800/90 border border-fuchsia-200 dark:border-fuchsia-900/60 p-3.5 rounded-xl shadow-xs text-xs text-left">
                <h4 className="font-bold text-fuchsia-700 dark:text-fuchsia-300 mb-1 flex items-center gap-1">
                  <Sparkles size={14} /> Enchantment Triggers:
                </h4>
                <ul className="text-gray-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                  {announcements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        <div className="relative w-72 h-72 md:w-96 md:h-96">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-indigo-900 dark:border-t-amber-400 drop-shadow-lg" />
          <div
            className={`w-full h-full rounded-full overflow-hidden border-8 transition-transform ease-out ${
              isGlowing
                ? "border-fuchsia-400 shadow-[0_0_45px_rgba(217,70,239,0.85)]"
                : "shadow-2xl border-white dark:border-slate-800"
            }`}
            style={{
              transform: `rotate(${isSpinning ? rotation : rotation + idleRotation}deg)`,
              transitionDuration: isSpinning ? "4000ms" : "0ms",
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
          <button
            onClick={spinWheel}
            disabled={isSpinning || wheelSlices.length === 0 || spinTokens < 1}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-2xl z-10 flex flex-col items-center justify-center font-black text-slate-900 dark:text-white hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide border-4 border-indigo-100 dark:border-slate-700 cursor-pointer"
          >
            <span className="text-lg">SPIN</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5 font-extrabold font-rpg-num">
              <Dices size={12} /> 1 Tk
            </span>
          </button>
        </div>
      </div>

      {/* 4-TAB MANAGEMENT PANEL */}
      <WheelTabsPanel
        wheelSlices={wheelSlices}
        inventory={inventory}
        timeAllowances={timeAllowances}
        history={history}
        setHistory={setHistory}
        activeAllowanceTimer={activeAllowanceTimer}
        nowTick={nowTick}
        todayDateStr={todayDateStr}
        editingId={editingId}
        setEditingId={setEditingId}
        editForm={editForm}
        setEditForm={setEditForm}
        activatingWildcardId={activatingWildcardId}
        setActivatingWildcardId={setActivatingWildcardId}
        wildcardTargets={wildcardTargets}
        setWildcardTargets={setWildcardTargets}
        onAddSlice={handleAddSlice}
        onDeleteSlice={handleDeleteSlice}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onActivateInventoryItem={activateInventoryItem}
        onTrashInventoryItem={trashInventoryItem}
        onToggleAllowanceTimer={toggleAllowanceTimer}
        onAdjustAllowanceSeconds={adjustAllowanceSeconds}
      />
    </div>
  );
}