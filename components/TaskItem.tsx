
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task } from '../types';
import { soundEngine } from '../services/soundService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onLongPress: (task: Task) => void;
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#34C759', // Emerald
  2: '#34C759', 
  3: '#FF9500', // Amber
  4: '#FF3B30', // Crimson
  5: '#FF2D55'  // Pink/Boss
};

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onToggleSubtask,
  onLongPress
}) => {
  const [offset, setOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const longPressTimer = useRef<any>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    longPressTimer.current = setTimeout(() => {
      onLongPress(task);
      setTouchStart(null);
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    const dampenedDiff = Math.abs(diff) > 100 ? (diff > 0 ? 100 + (diff - 100) * 0.1 : -100 + (diff + 100) * 0.1) : diff;
    setOffset(dampenedDiff);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (offset > 100) onToggle(task.id);
    else if (offset < -100) onDelete(task.id);
    setOffset(0);
    setTouchStart(null);
  };

  const progressPercent = useMemo(() => {
    if (task.completed) return 100;
    const total = task.subTasks?.length || 0;
    if (total === 0) return 0;
    const completed = task.subTasks?.filter(st => st.completed).length || 0;
    return (completed / total) * 100;
  }, [task.subTasks, task.completed]);

  const translateY = 100 - progressPercent;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    soundEngine.playTick(0.3);
  };

  const levelColor = DIFFICULTY_COLORS[task.difficulty] || '#007AFF';

  return (
    <div className="animate-view-enter relative">
      <div 
        className="absolute inset-0 flex items-center justify-between px-10 rounded-[2rem] transition-colors duration-200"
        style={{ 
          backgroundColor: offset > 50 ? 'var(--accent)' : (offset < -50 ? '#FF3B30' : 'transparent'),
          opacity: Math.min(0.8, Math.abs(offset) / 100)
        }}
      >
        <span className="text-white font-black text-[10px] uppercase tracking-widest">Complete</span>
        <span className="text-white font-black text-[10px] uppercase tracking-widest">Delete</span>
      </div>

      <div 
        className="relative card-ui rounded-[2rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleExpand}
      >
        <div className="flex items-center p-6 space-x-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1.5">
               <div 
                className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter text-white"
                style={{ backgroundColor: levelColor, boxShadow: `0 2px 8px ${levelColor}40` }}
               >
                 Lvl {task.difficulty}
               </div>
               {task.isBoss && (
                 <span className="text-[7px] font-black uppercase tracking-tighter bg-zinc-900 text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full">BOSS</span>
               )}
               {task.isRoutineInstance && (
                 <span className="text-[7px] font-black uppercase tracking-tighter bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center space-x-1">
                   <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                   <span>Routine</span>
                 </span>
               )}
            </div>
            <h3 className={`font-bold text-[17px] tracking-tight transition-all duration-500 ${task.completed ? 'opacity-20 line-through' : 'text-main'}`}>
              {task.title}
            </h3>
            <div className="flex items-center text-[10px] font-bold opacity-30 mt-1 space-x-2 uppercase tracking-widest">
              <span className="text-accent">{task.startTime || 'Flex'}</span>
              <span>•</span>
              <span>{task.duration}m</span>
              {task.subTasks?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{task.subTasks.filter(s => s.completed).length}/{task.subTasks.length}</span>
                  <svg 
                    className={`w-2.5 h-2.5 ml-1 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </div>
          </div>

          <div 
            className="w-10 h-10 rounded-full relative overflow-hidden bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 shrink-0"
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          >
            <div 
              className="absolute inset-0 bg-accent transition-transform duration-700 cubic-bezier(0.23, 1, 0.32, 1)"
              style={{ transform: `translateY(${translateY}%)` }}
            />
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${task.completed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        </div>

        <div 
          className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ 
            maxHeight: isExpanded ? '1000px' : '0px',
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)'
          }}
        >
          <div className="px-6 pb-6 pt-1 space-y-3">
            {task.subTasks?.map((st, idx) => (
              <div 
                key={st.id} 
                className="flex items-center space-x-3 active:opacity-60 transition-all duration-500"
                style={{ 
                  transitionDelay: isExpanded ? `${idx * 40}ms` : '0ms',
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                  opacity: isExpanded ? 1 : 0
                }}
                onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, st.id); }}
              >
                <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${st.completed ? 'bg-accent border-accent' : 'border-black/10 dark:border-white/10'}`}>
                  {st.completed && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span className={`text-[13px] font-bold transition-all duration-500 ${st.completed ? 'line-through opacity-30' : 'opacity-70'}`}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
