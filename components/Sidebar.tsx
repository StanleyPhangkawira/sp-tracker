"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Gift, Coins, Dices, RotateCcw, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { spCoins, spinTokens, resetApp, logout } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleReset = () => {
    if (window.confirm("⚠️ Reset resources to 0 and uncheck all goals?")) resetApp();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) logout();
  };

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-50 flex items-center justify-between px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
            <Target size={20} />
            <span className="text-[10px]">Targets</span>
          </Link>
          <Link href="/rewards" className={`flex flex-col items-center gap-1 ${pathname === '/rewards' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
            <Gift size={20} />
            <span className="text-[10px]">Rewards</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <div id="sp-resource" className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1.5 rounded-lg text-xs font-bold border border-yellow-200">
            <Coins size={14} />
            <span>{spCoins}</span>
          </div>
          <div id="token-resource" className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1.5 rounded-lg text-xs font-bold border border-purple-200">
            <Dices size={14} />
            <span>{spinTokens}</span>
          </div>
          <button onClick={handleReset} className="p-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 ml-1">
            <RotateCcw size={14} />
          </button>
          <button onClick={handleLogout} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      {/* DESKTOP SIDEBAR (Resized ~30% smaller) */}
      <nav className={`relative transition-all duration-300 ease-in-out bg-white border-r border-gray-200 z-50 flex-col items-center md:items-start min-h-screen p-3 ${isCollapsed ? 'w-16' : 'w-48'} hidden md:flex`}>
        
        {/* Collapse Toggle */}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:scale-110 z-50">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center gap-2 mb-8 mt-4 transition-all ${isCollapsed ? 'justify-center w-full px-0' : 'px-1'}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">SP</div>
          {!isCollapsed && <span className="font-bold text-lg text-gray-800 transition-opacity whitespace-nowrap">Tracker</span>}
        </div>

        <div className="flex flex-col w-full gap-2">
          <Link href="/" className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${pathname === '/' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}>
            <Target size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm whitespace-nowrap">Targets</span>}
          </Link>
          <Link href="/rewards" className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${pathname === '/rewards' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}>
            <Gift size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm whitespace-nowrap">Rewards</span>}
          </Link>
        </div>

        <div className="mt-auto w-full flex flex-col gap-2 relative">
          <div className={`flex items-center gap-2 bg-yellow-100 text-yellow-700 p-2 rounded-xl font-bold shadow-sm justify-center border border-yellow-200 ${isCollapsed ? 'flex-col text-[10px]' : 'text-sm'}`}>
            <Coins size={16} className="shrink-0" />
            {!isCollapsed && <span>{spCoins} SP</span>}
          </div>
          <div className={`flex items-center gap-2 bg-purple-100 text-purple-700 p-2 rounded-xl font-bold shadow-sm justify-center border border-purple-200 ${isCollapsed ? 'flex-col text-[10px]' : 'text-sm'}`}>
            <Dices size={16} className="shrink-0" />
            {!isCollapsed && <span>{spinTokens} Tk</span>}
          </div>
          <button onClick={handleReset} className={`flex items-center gap-2 bg-red-50 text-red-600 p-2 rounded-xl font-bold shadow-sm justify-center border border-red-200 hover:bg-red-100 mt-2 ${isCollapsed ? 'flex-col text-[10px]' : 'text-sm'}`}>
            <RotateCcw size={14} className="shrink-0" />
            {!isCollapsed && <span>Reset</span>}
          </button>
          <button onClick={handleLogout} className={`flex items-center gap-2 bg-gray-100 text-gray-700 p-2 rounded-xl font-bold shadow-sm justify-center border border-gray-200 hover:bg-gray-200 mt-1 ${isCollapsed ? 'flex-col text-[10px]' : 'text-sm'}`}>
            <LogOut size={14} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>
    </>
  );
}