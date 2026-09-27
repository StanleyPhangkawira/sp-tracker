"use client";

import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings2, Trash2, CheckCircle2, Circle, Sun, Moon, LayoutGrid, GripHorizontal } from "lucide-react";
import { useAppContext, Goal, ChildTask } from "../context/AppContext";

export default function TargetsPage() {
  const { goals, setGoals, setSpCoins } = useAppContext();
  const [openSettings, setOpenSettings] = useState<string | null>(null);
  const [columns, setColumns] = useState(2);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const triggerBigConfetti = () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
  const triggerSmallConfetti = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    confetti({ particleCount: 50, spread: 60, origin: { x, y }, colors: ['#4ade80', '#eab308'] });
  };
  const triggerGlow = (id: string) => {
    setRecentlyCompleted(prev => [...prev, id]);
    setTimeout(() => setRecentlyCompleted(prev => prev.filter(item => item !== id)), 2000);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnter = (index: number) => {
    if (draggedIdx !== null && draggedIdx !== index) {
      const newGoals = [...goals];
      const dragged = newGoals[draggedIdx];
      newGoals.splice(draggedIdx, 1);
      newGoals.splice(index, 0, dragged);
      setDraggedIdx(index);
      setGoals(newGoals);
    }
  };
  const handleDragEnd = () => setDraggedIdx(null);

  const addGoal = () => {
    const id = Date.now().toString();
    setGoals([{ id, title: "", type: "weekly", reward: 0, isCompleted: false, isClaimed: false, children: [] }, ...goals]);
    setEditingGoalId(id);
  };
  const updateGoal = (id: string, updates: Partial<Goal>) => setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));
  
  const addChildTask = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const id = Date.now().toString();
    updateGoal(goalId, { children: [...goal.children, { id, title: "", reward: 0, isCompleted: false, isClaimed: false }] });
    setEditingChildId(id);
  };

  const handleGoalCheck = (goal: Goal) => { if (goal.children.length === 0 && !goal.isClaimed) updateGoal(goal.id, { isCompleted: !goal.isCompleted }); };
  const handleChildCheck = (goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed) updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isCompleted: !c.isCompleted } : c) });
  };
  const claimChild = (e: React.MouseEvent, goal: Goal, childId: string) => {
    const child = goal.children.find(c => c.id === childId);
    if (child && !child.isClaimed) {
      updateGoal(goal.id, { children: goal.children.map(c => c.id === childId ? { ...c, isClaimed: true } : c) });
      setSpCoins(prev => prev + (child.reward || 0));
      triggerSmallConfetti(e); triggerGlow(child.id);
    }
  };
  const claimGoal = (e: React.MouseEvent, goal: Goal) => {
    if (!goal.isClaimed) {
      updateGoal(goal.id, { isClaimed: true, isCompleted: true });
      setSpCoins(prev => prev + (goal.reward || 0));
      triggerBigConfetti(); triggerGlow(goal.id);
    }
  };

  const generateDailyTasks = (goalId: string, frequency: 'once' | 'day-night') => {
    let newChildren = frequency === 'once' 
      ? daysOfWeek.map((day, i) => ({ id: `${Date.now()}-${i}`, title: day, reward: 0, isCompleted: false }))
      : daysOfWeek.flatMap((day, i) => [
        { id: `${Date.now()}-${i}-sun`, title: `${day} ☀️`, reward: 0, isCompleted: false },
        { id: `${Date.now()}-${i}-moon`, title: `${day} 🌙`, reward: 0, isCompleted: false }
      ]);
    updateGoal(goalId, { type: 'daily', frequency, children: newChildren, isCompleted: false });
  };

  const gridColsMap: Record<number, string> = { 1: "md:columns-1", 2: "md:columns-2", 3: "md:columns-3", 4: "md:columns-4", 5: "md:columns-5" };

  return (
    <div className="p-4 md:p-10 max-w-[1400px] mx-auto pt-20 md:pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Targets & Goals</h1>
        <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <LayoutGrid size={18} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 w-24">Columns: {columns}</span>
          <input type="range" min="1" max="5" value={columns} onChange={(e) => setColumns(Number(e.target.value))} className="w-24 md:w-32 cursor-pointer accent-blue-600"/>
        </div>
      </div>
      
      <div className={`columns-1 ${gridColsMap[columns]} gap-6 space-y-6 relative`}>
        {/* AnimatePresence enables exit animations */}
        <AnimatePresence mode="popLayout">
          {goals.map((goal, index) => {
            const hasChildren = goal.children.length > 0;
            const allChildrenClaimed = hasChildren && goal.children.every(c => c.isClaimed);
            const progress = hasChildren ? Math.round((goal.children.filter(c => c.isClaimed).length / goal.children.length) * 100) : (goal.isClaimed ? 100 : 0);

            return (
              <motion.div 
                layout // This single prop makes the boxes glide automatically when siblings change
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                key={goal.id} 
                draggable onDragStart={(e) => handleDragStart(e as any, index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                className={`break-inside-avoid w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative cursor-grab active:cursor-grabbing mb-6
                  ${recentlyCompleted.includes(goal.id) ? 'ring-2 ring-green-400 shadow-xl z-10' : 'hover:shadow-md'}
                  ${draggedIdx === index ? 'opacity-30 ring-2 ring-dashed ring-blue-400' : ''}
                  ${goal.isClaimed ? 'opacity-75 bg-gray-50/50' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 flex-1 w-full overflow-hidden">
                    {!hasChildren && (
                      <button onClick={() => handleGoalCheck(goal)} disabled={goal.isClaimed} className={`shrink-0 transition-colors ${goal.isClaimed ? 'cursor-not-allowed' : 'hover:scale-110'}`}>
                        {goal.isClaimed ? <CheckCircle2 size={28} className="text-gray-300" /> : goal.isCompleted ? <CheckCircle2 size={28} className="text-blue-500" /> : <Circle size={28} className="text-gray-300" />}
                      </button>
                    )}
                    <input type="text" placeholder="New Goal" value={goal.title} autoFocus={editingGoalId === goal.id} disabled={goal.isClaimed} onChange={(e) => updateGoal(goal.id, { title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setEditingGoalId(null)} onBlur={() => setEditingGoalId(null)} className={`font-semibold text-xl bg-transparent outline-none w-full truncate ${goal.isClaimed ? 'text-gray-400 line-through' : 'text-gray-900 focus:border-b focus:border-blue-400'}`} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {((!hasChildren && goal.isCompleted && !goal.isClaimed) || (allChildrenClaimed && !goal.isClaimed)) && (
                      <button onClick={(e) => claimGoal(e, goal)} className="text-[10px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:scale-105 transition-transform whitespace-nowrap">✨ CLAIM {goal.reward || 0} SP</button>
                    )}
                    {goal.isClaimed && (<button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>)}
                    {!goal.isClaimed && (<button onClick={() => setOpenSettings(openSettings === goal.id ? null : goal.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full"><Settings2 size={20} /></button>)}
                    <GripHorizontal size={20} className="text-gray-300 cursor-grab" />
                  </div>
                </div>

                {/* Dropdown */}
                <div className={`grid transition-all duration-300 ease-in-out ${openSettings === goal.id && !goal.isClaimed ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid gap-4 grid-cols-2">
                      <div><label className="text-xs font-semibold text-gray-500 uppercase">Type</label><select value={goal.type} onChange={(e) => updateGoal(goal.id, { type: e.target.value as "weekly" | "daily" })} className="block w-full mt-1 p-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white"><option value="weekly">Weekly / Custom</option><option value="daily">Daily</option></select></div>
                      <div><label className="text-xs font-semibold text-gray-500 uppercase">Completion Reward</label><input type="number" value={goal.reward || 0} onChange={(e) => updateGoal(goal.id, { reward: Number(e.target.value) })} className="block w-full mt-1 p-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-gray-900 bg-white"/></div>
                      {goal.type === 'daily' && (<div className="col-span-2 flex flex-col md:flex-row gap-2"><button onClick={() => generateDailyTasks(goal.id, 'once')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Once a Day</button><button onClick={() => generateDailyTasks(goal.id, 'day-night')} className="flex-1 bg-white border border-gray-300 p-2 rounded-lg font-medium text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-1">Day & Night <Sun size={14}/><Moon size={14}/></button></div>)}
                      <div className="col-span-2 flex justify-end mt-2"><button onClick={() => deleteGoal(goal.id)} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"><Trash2 size={16} /> Delete</button></div>
                    </div>
                  </div>
                </div>

                {hasChildren && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium"><span>{progress === 100 ? 'Completed' : 'Progress'}</span><span>{progress}%</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"><div className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-400' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div></div>
                  </div>
                )}

                {hasChildren && (
                  <div className="mt-4 space-y-2">
                    {goal.children.map((child) => (
                      <div key={child.id} className={`flex items-center gap-3 p-2 rounded-lg group transition-all duration-300 ${recentlyCompleted.includes(child.id) ? 'scale-[1.02] ring-1 ring-green-400 bg-green-50 shadow-sm' : child.isClaimed ? 'bg-gray-100/50' : 'bg-gray-50/50 hover:bg-gray-50'}`}>
                        <button onClick={() => handleChildCheck(goal, child.id)} disabled={child.isClaimed} className={`transition-colors shrink-0 ${child.isClaimed ? 'cursor-not-allowed' : 'hover:scale-110'}`}>
                          {child.isClaimed ? <CheckCircle2 size={20} className="text-gray-300" /> : child.isCompleted ? <CheckCircle2 size={20} className="text-blue-500" /> : <Circle size={20} className="text-gray-300 group-hover:text-blue-400" />}
                        </button>
                        <input type="text" placeholder="New Task" value={child.title} autoFocus={editingChildId === child.id} disabled={child.isClaimed} onKeyDown={(e) => e.key === 'Enter' && setEditingChildId(null)} onBlur={() => setEditingChildId(null)} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, title: e.target.value } : c) })} className={`text-sm bg-transparent outline-none w-full truncate ${child.isClaimed ? 'text-gray-400 line-through' : 'text-gray-900 focus:border-b focus:border-blue-400'}`} />
                        
                        {!child.isClaimed && !child.isCompleted && (
                          <div className="flex items-center bg-yellow-100 px-1.5 py-0.5 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus-within:opacity-100 shrink-0">
                            <span className="text-yellow-700 text-[10px] font-bold mr-0.5">+</span>
                            <input type="number" value={child.reward || 0} onChange={(e) => updateGoal(goal.id, { children: goal.children.map(c => c.id === child.id ? { ...c, reward: Number(e.target.value) } : c) })} className="w-6 bg-transparent text-yellow-700 text-xs font-bold outline-none text-center"/>
                            <span className="text-yellow-700 text-[10px] font-bold ml-0.5">SP</span>
                          </div>
                        )}
                        {child.isCompleted && !child.isClaimed && (<button onClick={(e) => claimChild(e, goal, child.id)} className="ml-auto shrink-0 text-[10px] md:text-xs font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)] hover:scale-105 transition-transform">✨ CLAIM {child.reward || 0}</button>)}
                        {!child.isClaimed && (<button onClick={() => updateGoal(goal.id, { children: goal.children.filter(c => c.id !== child.id) })} className="text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"><Trash2 size={16} /></button>)}
                      </div>
                    ))}
                  </div>
                )}
                {!goal.isClaimed && (<button onClick={() => addChildTask(goal.id)} className="mt-4 flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors"><Plus size={16} /> Add sub-task</button>)}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button 
          layout // Allows the add button to glide smoothly out of the way
          onClick={addGoal} 
          className="break-inside-avoid w-full border-2 border-dashed border-gray-300 text-gray-400 font-bold p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-h-[120px]"
        >
          <Plus size={32} /> <span>Add New Goal</span>
        </motion.button>
      </div>
    </div>
  );
}