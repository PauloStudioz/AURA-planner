
import { useState, useLayoutEffect, useTransition, useCallback, useEffect } from 'react';
import { AppState, AILevel, Task, UserStats, RoutineBlueprint } from '../types';
import { soundEngine } from '../services/soundService';

const INITIAL_STATS: UserStats = { focus: 10, discipline: 10, consistency: 10, creativity: 10, xp: 0, level: 1, streak: 0 };

const ACCENT_MAP: Record<string, string> = {
  blue: '#007AFF',
  purple: '#AF52DE',
  pink: '#FF2D55',
  amber: '#FF9500',
  emerald: '#34C759',
  crimson: '#FF3B30'
};

const hexToRgb = (hex: string) => {
  const h = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(h.slice(1, 3), 16) || 0;
  const g = parseInt(h.slice(3, 5), 16) || 0;
  const b = parseInt(h.slice(5, 7), 16) || 0;
  return { r, g, b };
};

export const useAuraState = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('aura_state');
    const defaultState: AppState = {
      tasks: [], routines: [], lastRoutineReset: '', stats: INITIAL_STATS, history: {}, aiMode: AILevel.NORMAL, apiKey: null,
      energyLevel: 'morning', onboarded: true, profile: { name: 'Seeker', motto: 'Flow follows focus.' },
      theme: 'glass', accentColor: 'blue', glassStyle: 'fusion', chats: [], sortPreference: 'time',
      rituals: { pomodoroLength: 25, breakLength: 5, hapticIntensity: 'high', soundEnabled: true, soundVolume: 0.5 },
      recentlyDeletedTask: null
    };
    if (!saved) return defaultState;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed, recentlyDeletedTask: null };
    } catch (e) {
      return defaultState;
    }
  });

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    setState(p => {
      let changed = false;
      let updatedTasks = [...p.tasks];
      let lastReset = p.lastRoutineReset;

      if (lastReset !== todayStr) {
        changed = true;
        updatedTasks = updatedTasks.filter(t => !t.isRoutineInstance && (t.date || todayStr) >= todayStr);
        const activeRoutines = p.routines.filter(r => r.isActive);
        activeRoutines.forEach(r => {
          updatedTasks.push({
            id: `routine-${r.id}-${todayStr}`,
            title: r.title,
            duration: r.duration,
            startTime: r.startTime,
            date: todayStr,
            completed: false,
            category: r.category,
            isBoss: false,
            subTasks: [],
            difficulty: r.difficulty,
            isRoutineInstance: true
          });
        });
        lastReset = todayStr;
      }

      const finalizedTasks = updatedTasks.filter(t => {
        const taskDate = t.date || todayStr;
        const isPast = taskDate < todayStr;
        if (isPast && !t.completed) {
            changed = true;
            return false; 
        }
        return true; 
      });

      if (!changed && finalizedTasks.length === p.tasks.length) return p;

      return {
        ...p,
        tasks: finalizedTasks,
        lastRoutineReset: lastReset,
      };
    });
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const bgLayer = document.getElementById('aura-bg-layer');
    if (!bgLayer) return;

    document.body.className = `theme-${state.theme}`;
    const hex = ACCENT_MAP[state.accentColor] || (state.accentColor.startsWith('#') ? state.accentColor : '#007AFF');
    root.style.setProperty('--accent', hex);
    const { r, g, b } = hexToRgb(hex);
    root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
    
    let gradient = 'none';
    if (state.theme === 'glass') {
      switch (state.glassStyle) {
        case 'fusion': 
          gradient = `radial-gradient(at 0% 0%, ${hex}e0 0px, transparent 60%), 
                      radial-gradient(at 100% 0%, #AF52DEaa 0px, transparent 65%), 
                      radial-gradient(at 100% 100%, ${hex}d0 0px, transparent 60%), 
                      radial-gradient(at 0% 100%, #34C759aa 0px, transparent 65%), 
                      radial-gradient(at 50% 50%, rgba(255,255,255,0.98) 0px, transparent 85%), 
                      #E8EBF2`; 
          break;
        case 'prism': 
          gradient = `linear-gradient(160deg, ${hex}bb 0%, #ffffff 25%, #ffffff 75%, ${hex}a0 100%), 
                      radial-gradient(at 100% 0%, #AF52DEcc 0px, transparent 55%),
                      radial-gradient(at 0% 100%, #34C759cc 0px, transparent 55%)`; 
          break;
        case 'deep': 
          gradient = `linear-gradient(135deg, ${hex}90 0%, #BCC6D5 45%, ${hex}80 100%),
                      radial-gradient(circle at top right, ${hex}50, transparent),
                      radial-gradient(circle at bottom left, #AF52DE50, transparent)`; 
          break;
        case 'pure': 
          gradient = `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`; 
          break;
      }
    } else if (state.theme === 'midnight') {
      gradient = `radial-gradient(circle at 50% -25%, ${hex}a0 0%, #000000 85%)`;
    } else {
      gradient = 'none';
    }
    
    bgLayer.style.backgroundImage = gradient;
    bgLayer.style.opacity = (state.theme === 'glass' || state.theme === 'midnight') ? '1' : '0';
    
    const { recentlyDeletedTask, ...persistState } = state;
    localStorage.setItem('aura_state', JSON.stringify(persistState));
  }, [state.theme, state.accentColor, state.glassStyle]);

  const toggleTask = (id: string) => {
    setState(p => {
      const t = p.tasks.find(x => x.id === id);
      if (!t) return p;
      const val = !t.completed;
      if (p.rituals.soundEnabled) val ? soundEngine.playPing(p.rituals.soundVolume) : soundEngine.playTick(p.rituals.soundVolume);
      
      const todayKey = new Date().toISOString().split('T')[0];
      const newHistory = { ...p.history };
      newHistory[todayKey] = Math.max(0, (newHistory[todayKey] || 0) + (val ? 1 : -1));

      return { 
        ...p, 
        tasks: p.tasks.map(x => x.id === id ? { ...x, completed: val } : x), 
        history: newHistory,
        stats: { 
          ...p.stats, 
          xp: Math.max(0, p.stats.xp + (val ? 25 : -25)),
          streak: newHistory[todayKey] > 0 ? Math.max(p.stats.streak, 1) : p.stats.streak
        } 
      };
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(p => ({
      ...p,
      tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTask = (id: string) => {
    setState(p => {
      const taskToDelete = p.tasks.find(t => t.id === id);
      return {
        ...p,
        tasks: p.tasks.filter(t => t.id !== id),
        recentlyDeletedTask: taskToDelete || null
      };
    });
  };

  const undoDelete = () => {
    setState(p => {
      if (!p.recentlyDeletedTask) return p;
      return {
        ...p,
        tasks: [p.recentlyDeletedTask, ...p.tasks],
        recentlyDeletedTask: null
      };
    });
  };

  const addTasks = (newTasks: Task[]) => setState(p => ({ ...p, tasks: [...newTasks, ...p.tasks] }));

  const addRoutine = (r: RoutineBlueprint) => {
    setState(p => {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedRoutines = [...p.routines, r];
      let updatedTasks = [...p.tasks];
      
      if (r.isActive) {
        updatedTasks.push({
          id: `routine-${r.id}-${todayStr}`,
          title: r.title,
          duration: r.duration,
          startTime: r.startTime,
          date: todayStr,
          completed: false,
          category: r.category,
          isBoss: false,
          subTasks: [],
          difficulty: r.difficulty,
          isRoutineInstance: true
        });
      }
      
      return { ...p, routines: updatedRoutines, tasks: updatedTasks };
    });
  };

  const deleteRoutine = (id: string) => {
    setState(p => ({ 
      ...p, 
      routines: p.routines.filter(r => r.id !== id),
      tasks: p.tasks.filter(t => !t.id.startsWith(`routine-${id}`))
    }));
  };

  const toggleRoutineActive = (id: string) => {
    setState(p => {
      const todayStr = new Date().toISOString().split('T')[0];
      const routine = p.routines.find(r => r.id === id);
      if (!routine) return p;
      
      const becomingActive = !routine.isActive;
      const updatedRoutines = p.routines.map(r => r.id === id ? { ...r, isActive: becomingActive } : r);
      
      let updatedTasks = [...p.tasks];
      if (becomingActive) {
        updatedTasks.push({
          id: `routine-${id}-${todayStr}`,
          title: routine.title,
          duration: routine.duration,
          startTime: routine.startTime,
          date: todayStr,
          completed: false,
          category: routine.category,
          isBoss: false,
          subTasks: [],
          difficulty: routine.difficulty,
          isRoutineInstance: true
        });
      } else {
        updatedTasks = updatedTasks.filter(t => t.id !== `routine-${id}-${todayStr}`);
      }
      
      return { ...p, routines: updatedRoutines, tasks: updatedTasks };
    });
  };

  const updateRoutine = (id: string, updates: Partial<RoutineBlueprint>) => {
    setState(p => {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedRoutines = p.routines.map(r => r.id === id ? { ...r, ...updates } : r);
      const updatedTasks = p.tasks.map(t => {
        if (t.id === `routine-${id}-${todayStr}`) {
          return { ...t, ...updates };
        }
        return t;
      });
      return { ...p, routines: updatedRoutines, tasks: updatedTasks };
    });
  };

  return { 
    state, 
    setState: (u: any) => setState(p => ({ ...p, ...u })), 
    toggleTask, 
    deleteTask, 
    addTasks, 
    updateSortPreference: (pref: any) => setState(p => ({ ...p, sortPreference: pref })), 
    updateTask, 
    undoDelete, 
    addRoutine, 
    deleteRoutine, 
    toggleRoutineActive,
    updateRoutine,
    toggleSubtask: (tid: string, sid: string) => {} 
  };
};
