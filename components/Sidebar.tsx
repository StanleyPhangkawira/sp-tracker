"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Gift, Coins, Dices, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { spCoins, spinTokens, resetApp } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleReset = () => {
    if (window.confirm("⚠️ Reset resources to 0 and uncheck all goals?")) resetApp();
  };

  return (
    <nav className={`relative transition-all duration-300 ease-in-out bg-white border-r border-gray-200 z-50 flex flex-col items-center md:items-start min-h-screen p-4 ${isCollapsed ? 'w-24' : 'w-64'} hidden md:flex`}>
      
      {/* Collapse Toggle */}
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:scale-110 z-50">
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`flex items-center gap-3 mb-10 mt-4 transition-all ${isCollapsed ? 'justify-center w-full px-0' : 'px-2'}`}>
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">SP</div>
        {!isCollapsed && <span className="font-bold text-xl text-gray-800 transition-opacity whitespace-nowrap">Tracker</span>}
      </div>

      <div className="flex flex-col w-full gap-3">
        <Link href="/" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}>
          <Target size={24} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Targets</span>}
        </Link>
        <Link href="/rewards" className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/rewards' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'} ${isCollapsed ? 'justify-center' : ''}`}>
          <Gift size={24} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Rewards</span>}
        </Link>
      </div>

      <div className="mt-auto w-full flex flex-col gap-2 relative">
        <div id="sp-resource" className={`flex items-center gap-2 bg-yellow-100 text-yellow-700 p-2.5 rounded-xl font-bold shadow-sm justify-center border border-yellow-200 ${isCollapsed ? 'flex-col text-xs' : ''}`}>
          <Coins size={18} className="shrink-0" />
          {!isCollapsed && <span>{spCoins} SP</span>}
        </div>
        <div id="token-resource" className={`flex items-center gap-2 bg-purple-100 text-purple-700 p-2.5 rounded-xl font-bold shadow-sm justify-center border border-purple-200 ${isCollapsed ? 'flex-col text-xs' : ''}`}>
          <Dices size={18} className="shrink-0" />
          {!isCollapsed && <span>{spinTokens} Tokens</span>}
        </div>
        <button onClick={handleReset} className={`flex items-center gap-2 bg-red-50 text-red-600 p-2.5 rounded-xl font-bold shadow-sm justify-center border border-red-200 hover:bg-red-100 mt-2 ${isCollapsed ? 'flex-col text-xs' : ''}`}>
          <RotateCcw size={16} className="shrink-0" />
          {!isCollapsed && <span>Reset All</span>}
        </button>
      </div>
    </nav>
  );
}