"use client";
import React, { useState, useRef } from "react";
import { Settings2, Plus, Trash2, Sparkles, Image as ImageIcon, Eye, Volume2, VolumeX, LogOut } from "lucide-react";
import { useAppContext, getLevelInfo } from "../../context/AppContext";

const Sun = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const Moon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const Check = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
);
const Flame = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);
const Download = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const Upload = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const DEFAULT_CLEAR_BG =
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop";

export default function SettingsPage() {
  const {
    quotes,
    setQuotes,
    bannerImage,
    setBannerImage,
    clearViewImage,
    setClearViewImage,
    user,
    logout,
    darkMode,
    setDarkMode,
    cleanMode,
    setCleanMode,
    soundEnabled,
    setSoundEnabled,
    stickyNotes,
    setStickyNotes,
    streak,
    setStreak,
    lifetimeXp,
    spCoins,
    setSpCoins,
    spinTokens,
    setSpinTokens,
    goals,
    setGoals,
    wheelSlices,
    setWheelSlices,
    inventory,
    setInventory,
    timeAllowances,
    setTimeAllowances,
    history,
    setHistory,
    financeData,
    setFinanceData,
  } = useAppContext();

  const [newQuote, setNewQuote] = useState("");
  const [importStatus, setImportStatus] = useState<string>("");

  // Banner Crop States
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  // Clear View Wallpaper Crop States
  const [clearCropFile, setClearCropFile] = useState<string | null>(null);
  const [clearCropScale, setClearCropScale] = useState(1);
  const clearImgRef = useRef<HTMLImageElement>(null);

  const levelInfo = getLevelInfo(lifetimeXp);

  const handleSaveQuote = () => {
    if (!newQuote.trim()) return;
    const updated = [...quotes, newQuote.trim()];
    setQuotes(updated);
    setNewQuote("");
  };

  const handleDeleteQuote = (idx: number) => {
    const updated = quotes.filter((_, i) => i !== idx);
    const finalQuotes = updated.length ? updated : ["Keep going!"];
    setQuotes(finalQuotes);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(URL.createObjectURL(file));
  };

  const applyCrop = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current) return;

    const img = imgRef.current;
    const scale = Math.max(1, cropScale);
    const targetAspect = 1200 / 400;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    let sw: number;
    let sh: number;

    if (imgAspect > targetAspect) {
      sh = img.naturalHeight / scale;
      sw = sh * targetAspect;
    } else {
      sw = img.naturalWidth / scale;
      sh = sw / targetAspect;
    }

    const sx = Math.max(0, (img.naturalWidth - sw) / 2);
    const sy = Math.max(0, (img.naturalHeight - sh) / 2);

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 400);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

    setBannerImage(dataUrl);
    setCropFile(null);
  };

  const handleUseOriginal = () => {
    if (!cropFile) return;
    fetch(cropFile)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBannerImage(reader.result as string);
          setCropFile(null);
        };
        reader.readAsDataURL(blob);
      });
  };

  const handleClearViewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClearCropFile(URL.createObjectURL(file));
      setClearCropScale(1);
    }
    e.target.value = "";
  };

  const applyClearCrop = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx || !clearImgRef.current) return;

    const img = clearImgRef.current;
    const scale = Math.max(1, clearCropScale);
    const targetAspect = 1920 / 1080;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    let sw: number;
    let sh: number;

    if (imgAspect > targetAspect) {
      sh = img.naturalHeight / scale;
      sw = sh * targetAspect;
    } else {
      sw = img.naturalWidth / scale;
      sh = sw / targetAspect;
    }

    const sx = Math.max(0, (img.naturalWidth - sw) / 2);
    const sy = Math.max(0, (img.naturalHeight - sh) / 2);

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1920, 1080);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

    setClearViewImage(dataUrl);
    setClearCropFile(null);
  };

  const handleUseOriginalClear = () => {
    if (!clearCropFile) return;
    const img = new Image();
    img.onload = () => {
      const maxDim = 2560;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        setClearViewImage(dataUrl);
      }
      setClearCropFile(null);
    };
    img.src = clearCropFile;
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      spCoins,
      spinTokens,
      lifetimeXp,
      streak,
      goals,
      wheelSlices,
      inventory,
      timeAllowances,
      history,
      financeData,
      quotes,
      stickyNotes,
      bannerImage,
      clearViewImage,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sp-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (typeof data.spCoins === "number") setSpCoins(data.spCoins);
        if (typeof data.spinTokens === "number") setSpinTokens(data.spinTokens);
        if (Array.isArray(data.goals)) setGoals(data.goals);
        if (Array.isArray(data.wheelSlices)) setWheelSlices(data.wheelSlices);
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        if (Array.isArray(data.timeAllowances)) setTimeAllowances(data.timeAllowances);
        if (Array.isArray(data.history)) setHistory(data.history);
        if (data.financeData) setFinanceData(data.financeData);
        if (Array.isArray(data.quotes)) setQuotes(data.quotes);
        if (Array.isArray(data.stickyNotes)) setStickyNotes(data.stickyNotes);
        if (data.streak) setStreak((prev) => ({ ...prev, ...data.streak }));
        if (typeof data.bannerImage === "string" || data.bannerImage === null) setBannerImage(data.bannerImage);
        if (typeof data.clearViewImage === "string" || data.clearViewImage === null) setClearViewImage(data.clearViewImage);
        setImportStatus("Backup restored!");
        setTimeout(() => setImportStatus(""), 3500);
      } catch {
        setImportStatus("Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-10 max-w-[1000px] mx-auto pb-24 md:pt-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings2 size={32} className="text-indigo-600 dark:text-indigo-400" />
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Customize your RPG HUD, Clear View, sound effects, dashboard banner, quotes, and account.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Gamification & Appearance Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="text-orange-500" /> Gamification & Theme
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  {darkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                  Appearance Mode
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Switch between clean Light Pastel and Dark RPG mode.
                </p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
              >
                {darkMode ? "Switch to Light" : "Switch to Dark"}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Flame size={16} className="text-orange-500" /> Streak SP Multiplier
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Earn +5% bonus SP per streak day (up to +25%).
                </p>
              </div>
              <button
                onClick={() => setStreak((prev) => ({ ...prev, enableMultiplier: !prev.enableMultiplier }))}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                  streak.enableMultiplier
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                }`}
              >
                {streak.enableMultiplier ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Eye size={16} className="text-teal-500" /> Clear View (Full-Screen Zen)
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Full-screen background with centered Today&apos;s Active Quests and 1-column side quest rail.
                </p>
              </div>
              <button
                onClick={() => setCleanMode(!cleanMode)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                  cleanMode
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                }`}
              >
                {cleanMode ? "Active" : "Off"}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 size={16} className="text-indigo-500" /> : <VolumeX size={16} className="text-gray-400" />}
                  RPG Sound Effects
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Synthesized chimes when checking tasks, claiming SP, and leveling up.
                </p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                  soundEnabled
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                }`}
              >
                {soundEnabled ? "SFX On" : "Muted"}
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                Adventurer Rank: Lv. {levelInfo.level} ({levelInfo.rankTitle})
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 ml-2 font-rpg-num">
                · {lifetimeXp.toLocaleString()} Total XP
              </span>
            </div>
            <div className="font-bold text-orange-600 dark:text-orange-400 font-rpg-num">
              Current Streak: {streak.current}d · Longest: {streak.longest}d · Shields: {streak.shields}
            </div>
          </div>
        </div>

        {/* Banner Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ImageIcon className="text-indigo-500" /> Dashboard Banner
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <label className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              Upload New Banner
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
            {bannerImage && (
              <button
                onClick={() => setBannerImage(null)}
                className="text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 px-5 py-2.5 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800 cursor-pointer"
              >
                Remove Banner
              </button>
            )}
          </div>

          {cropFile && (
            <div className="mt-4 p-4 md:p-6 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl">
              <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200 mb-3">Adjust Image</h3>
              <div className="w-full h-40 md:h-64 relative overflow-hidden rounded-xl shadow-inner bg-gray-900 border border-gray-200 dark:border-slate-700">
                <img
                  ref={imgRef}
                  src={cropFile}
                  style={{ transform: `scale(${cropScale})`, transformOrigin: "center" }}
                  className="w-full h-full object-cover"
                  alt="crop preview"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-16">
                  Zoom
                </span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropScale}
                  onChange={(e) => setCropScale(Number(e.target.value))}
                  className="flex-1 rpg-slider"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUseOriginal}
                    className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Use Full Image
                  </button>
                  <button
                    onClick={applyCrop}
                    className="bg-indigo-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-2xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </div>
          )}

          {!cropFile && bannerImage && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Banner</p>
              <div className="w-full h-32 md:h-48 rounded-2xl overflow-hidden shadow-2xs border border-gray-200 dark:border-slate-800">
                <img src={bannerImage} alt="Current Banner" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Clear View Wallpaper Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="text-teal-500" /> Clear View Wallpaper (Zen Mode)
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Customize the full-screen background displayed when Clear View is active.
              </p>
            </div>
            {clearViewImage && (
              <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Custom Wallpaper Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <label className="bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer transition-colors border border-teal-200 dark:border-teal-800 shadow-2xs flex items-center gap-2">
              <Upload size={16} /> Upload New Wallpaper
              <input type="file" accept="image/*" className="hidden" onChange={handleClearViewUpload} />
            </label>
            {clearViewImage && (
              <button
                onClick={() => setClearViewImage(null)}
                className="text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 px-5 py-2.5 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800 cursor-pointer flex items-center gap-2"
              >
                <Trash2 size={16} /> Reset to Default
              </button>
            )}
          </div>

          {clearCropFile && (
            <div className="mt-4 p-4 md:p-6 border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl">
              <h3 className="text-sm font-bold text-teal-800 dark:text-teal-200 mb-3">Adjust Wallpaper Framing (16:9 Full Screen)</h3>
              <div className="w-full h-44 md:h-72 relative overflow-hidden rounded-xl shadow-inner bg-gray-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                <img
                  ref={clearImgRef}
                  src={clearCropFile}
                  style={{ transform: `scale(${clearCropScale})`, transformOrigin: "center" }}
                  className="w-full h-full object-cover"
                  alt="Clear view crop preview"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-16">
                  Zoom
                </span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={clearCropScale}
                  onChange={(e) => setClearCropScale(Number(e.target.value))}
                  className="flex-1 rpg-slider"
                />
                <span className="text-xs font-mono text-gray-500 dark:text-slate-400 w-12 text-right">
                  {Math.round(clearCropScale * 100)}%
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearCropFile(null)}
                    className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUseOriginalClear}
                    className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs px-4 py-2 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 cursor-pointer border border-teal-200 dark:border-teal-800 transition-colors"
                  >
                    Use Full Image
                  </button>
                  <button
                    onClick={applyClearCrop}
                    className="bg-teal-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-2xs hover:bg-teal-700 cursor-pointer transition-colors"
                  >
                    Apply 16:9 Crop
                  </button>
                </div>
              </div>
            </div>
          )}

          {!clearCropFile && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {clearViewImage ? "Current Custom Wallpaper" : "Default Wallpaper Preview"}
                </p>
                {!clearViewImage && (
                  <span className="text-xs text-gray-400 italic">High-Res Fantasy Landscape</span>
                )}
              </div>
              <div className="w-full h-36 md:h-52 rounded-2xl overflow-hidden shadow-2xs border border-gray-200 dark:border-slate-800 relative group">
                <img
                  src={clearViewImage || DEFAULT_CLEAR_BG}
                  alt="Clear View Wallpaper"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg">
                    Full-Screen Zen Mode Background
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quotes Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="text-amber-500" /> Motivational Quotes
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
            These quotes appear on your dashboard to keep your momentum strong.
          </p>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add a new quote..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveQuote()}
              className="flex-1 p-3 text-sm border border-gray-300 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleSaveQuote}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-bold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} className="shrink-0" />
              <span className="hidden md:inline">Add Quote</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {quotes.map((q, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3.5 bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 rounded-xl"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200 italic font-medium">
                  &ldquo;{q}&rdquo;
                </span>
                <button
                  onClick={() => handleDeleteQuote(idx)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Download className="text-emerald-500" /> Local JSON Backup & Restore
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
            Export a full snapshot of your Quests, Wheel Slices, Inventory, Time Bank, Sticky Notes, and Finance ledger, or restore from a saved JSON file.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              <Download size={15} /> Export Backup (.json)
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-slate-700 transition-colors">
              <Upload size={15} /> Import Backup (.json)
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportBackup} />
            </label>
            {importStatus && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> {importStatus}
              </span>
            )}
          </div>
        </div>

        {/* Account & Session (Moved Logout Button here) */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LogOut className="text-red-500" size={22} /> Account & Session
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {user?.email
                ? `Signed in as ${user.email}`
                : "Currently playing in local storage mode."}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-black text-xs flex items-center gap-2 cursor-pointer border border-red-200 dark:border-red-800 transition-colors shadow-2xs shrink-0"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}