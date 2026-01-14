
import { useState, useLayoutEffect, useTransition, useCallback, useEffect } from 'react';
import { AppState, AILevel, Task, UserStats, RoutineBlueprint, ChronoState, ChatSession } from '../types';
import { soundEngine } from '../services/soundService';

const INITIAL_STATS: UserStats = { 
  focus: 10, discipline: 10, consistency: 10, creativity: 10, 
  xp: 0, level: 1, streak: 0, focusMinutes: 0, sessionsCompleted: 0 
};

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
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('aura_state');
    const defaultState: AppState = {
      tasks: [], routines: [], lastRoutineReset: '', stats: INITIAL_STATS, history: {}, aiMode: AILevel.NORMAL, apiKey: null,
      energyLevel: 'morning', onboarded: true, profile: { name: 'Seeker', motto: 'Flow follows focus.' },
      theme: 'glass', accentColor: 'blue', glassStyle: 'fusion', chats: [], archivedChats: [], sortPreference: 'time',
      rituals: { pomodoroLength: 25, breakLength: 5, longBreakLength: 15, hapticIntensity: 'high', soundEnabled: true, soundVolume: 0.5, autoStartBreaks: false, autoStartFocus: false },
      chrono: { isActive: false, type: 'focus', startTime: null, endTime: null, remainingAtLastPause: null },
      recentlyDeletedTask: null
    };
    if (!saved) return defaultState;
    try {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultState, 
        ...parsed, 
        rituals: { ...defaultState.rituals, ...parsed.rituals },
        recentlyDeletedTask: null,
        archivedChats: parsed.archivedChats || []
      };
    } catch (e) {
      return defaultState;
    }
  });

  const startChrono = useCallback((type: 'focus' | 'break' | 'long-break') => {
    setState(p => {
      if (p.rituals.soundEnabled) soundEngine.playPing(p.rituals.soundVolume * 0.3);
      const length = type === 'focus' ? p.rituals.pomodoroLength : (type === 'break' ? p.rituals.breakLength : p.rituals.longBreakLength);
      const durationMs = length * 60 * 1000;
      const startTime = Date.now();
      return {
        ...p,
        chrono: { isActive: true, type, startTime, endTime: startTime + durationMs, remainingAtLastPause: null }
      };
    });
  }, []);

  const archiveCurrentChat = useCallback(() => {
    setState(p => {
      if (p.chats.length === 0) return p;
      const session: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        preview: p.chats[0].text.substring(0, 40) + '...',
        messages: [...p.chats]
      };
      return {
        ...p,
        chats: [],
        archivedChats: [session, ...p.archivedChats].slice(0, 50) // Keep last 50
      };
    });
  }, []);

  const restoreSession = useCallback((session: ChatSession) => {
    setState(p => ({
      ...p,
      chats: session.messages
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState(p => ({
      ...p,
      archivedChats: p.archivedChats.filter(s => s.id !== id)
    }));
  }, []);

  useEffect(() => {
    const reconcileBackgroundTime = () => {
      setState(p => {
        if (!p.chrono.isActive || !p.chrono.endTime) return p;
        
        const now = Date.now();
        if (now >= p.chrono.endTime) {
          const finishedType = p.chrono.type;
          const addedMinutes = finishedType === 'focus' ? p.rituals.pomodoroLength : 0;
          if (p.rituals.soundEnabled) soundEngine.playPing(p.rituals.soundVolume);
          
          let nextState = {
            ...p,
            stats: {
              ...p.stats,
              focusMinutes: p.stats.focusMinutes + addedMinutes,
              sessionsCompleted: p.stats.sessionsCompleted + (finishedType === 'focus' ? 1 : 0),
              xp: p.stats.xp + (finishedType === 'focus' ? 150 : 0)
            },
            chrono: { ...p.chrono, isActive: false, startTime: null, endTime: null }
          };

          if (finishedType === 'focus' && p.rituals.autoStartBreaks) {
             const length = p.rituals.breakLength;
             const start = Date.now();
             nextState.chrono = { isActive: true, type: 'break', startTime: start, endTime: start + length * 60 * 1000, remainingAtLastPause: null };
          } else if ((finishedType === 'break' || finishedType === 'long-break') && p.rituals.autoStartFocus) {
             const length = p.rituals.pomodoroLength;
             const start = Date.now();
             nextState.chrono = { isActive: true, type: 'focus', startTime: start, endTime: start + length * 60 * 1000, remainingAtLastPause: null };
          }

          return nextState;
        }
        return p;
      });
    };

    reconcileBackgroundTime();
    const interval = setInterval(reconcileBackgroundTime, 1000);
    window.addEventListener('focus', reconcileBackgroundTime);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', reconcileBackgroundTime);
    };
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
    let baseBg = '#FBFBFD';
    
    // Glass Style Variables
    let glassBlur = '32px';
    let glassSaturate = '2.5';
    let cardBg = 'rgba(255, 255, 255, 0.7)';

    if (state.theme === 'glass') {
      switch (state.glassStyle) {
        case 'fusion': 
          baseBg = '#E8EBF2';
          gradient = `
            radial-gradient(at 0% 0%, ${hex}44 0px, transparent 50%),
            radial-gradient(at 100% 0%, #AF52DE44 0px, transparent 50%),
            radial-gradient(at 100% 100%, #34C75944 0px, transparent 50%),
            radial-gradient(at 0% 100%, #FF950044 0px, transparent 50%),
            radial-gradient(at 50% 50%, #FFFFFF 0px, transparent 80%)
          `; 
          glassBlur = '40px';
          glassSaturate = '2.5';
          cardBg = 'rgba(255, 255, 255, 0.35)';
          break;
          
        case 'prism': 
          baseBg = '#FFFFFF';
          gradient = `
            linear-gradient(45deg, #FF2D5522, #AF52DE22, #007AFF22, #34C75922, #FF950022),
            radial-gradient(circle at 20% 20%, #FF2D5544, transparent 40%),
            radial-gradient(circle at 80% 80%, #007AFF44, transparent 40%)
          `; 
          glassBlur = '20px';
          glassSaturate = '4.5';
          cardBg = 'rgba(255, 255, 255, 0.25)';
          break;
          
        case 'deep': 
          baseBg = '#2C3E50';
          gradient = `
            radial-gradient(circle at 50% 50%, ${hex}66, #000000),
            linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)
          `; 
          glassBlur = '100px';
          glassSaturate = '1.2';
          cardBg = 'rgba(255, 255, 255, 0.12)';
          break;
          
        case 'pure': 
          baseBg = '#F8F9FA';
          gradient = `
            linear-gradient(135deg, #FFFFFF 0%, #E9ECEF 100%),
            radial-gradient(at 0% 0%, ${hex}11 0px, transparent 50%)
          `; 
          glassBlur = '15px';
          glassSaturate = '1.1';
          cardBg = 'rgba(255, 255, 255, 0.82)';
          break;
      }
    } else if (state.theme === 'midnight') {
      baseBg = '#000000';
      gradient = `radial-gradient(circle at 50% -20%, ${hex}44 0%, #000000 80%)`;
      glassBlur = '40px';
      glassSaturate = '2.8';
      cardBg = 'rgba(28, 28, 30, 0.65)';
    } else if (state.theme === 'light') {
       baseBg = '#FBFBFD';
       gradient = 'none';
       glassBlur = '20px';
       glassSaturate = '1.5';
       cardBg = 'rgba(255, 255, 255, 0.8)';
    }

    root.style.setProperty('--glass-blur', glassBlur);
    root.style.setProperty('--glass-saturate', glassSaturate);
    root.style.setProperty('--card-bg', cardBg);
    
    bgLayer.style.backgroundColor = baseBg;
    bgLayer.style.backgroundImage = gradient;
    bgLayer.style.opacity = '1';
    
    const { recentlyDeletedTask, ...persistState } = state;
    localStorage.setItem('aura_state', JSON.stringify(persistState));
  }, [state.theme, state.accentColor, state.glassStyle, state]);

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

  const cancelChrono = () => {
    setState(p => {
      if (p.rituals.soundEnabled) soundEngine.playTick(p.rituals.soundVolume);
      return {
        ...p,
        chrono: { ...p.chrono, isActive: false, startTime: null, endTime: null }
      };
    });
  };

  return { 
    state, 
    setState: (u: any) => setState(p => ({ ...p, ...u })), 
    toggleTask, 
    deleteTask: (id: string) => setState(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id), recentlyDeletedTask: p.tasks.find(t => t.id === id) || null })), 
    addTasks: (newTasks: Task[]) => setState(p => ({ ...p, tasks: [...newTasks, ...p.tasks] })), 
    updateSortPreference: (pref: any) => setState(p => ({ ...p, sortPreference: pref })), 
    updateTask: (id: string, updates: Partial<Task>) => setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })), 
    undoDelete: () => setState(p => p.recentlyDeletedTask ? { ...p, tasks: [p.recentlyDeletedTask, ...p.tasks], recentlyDeletedTask: null } : p), 
    addRoutine: (r: RoutineBlueprint) => setState(p => ({ ...p, routines: [...p.routines, r] })), 
    deleteRoutine: (id: string) => setState(p => ({ ...p, routines: p.routines.filter(r => r.id !== id) })), 
    toggleRoutineActive: (id: string) => setState(p => ({ ...p, routines: p.routines.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r) })),
    updateRoutine: (id: string, u: any) => setState(p => ({ ...p, routines: p.routines.map(r => r.id === id ? { ...r, ...u } : r) })),
    startChrono,
    cancelChrono,
    toggleSubtask: (tid: string, sid: string) => {},
    archiveCurrentChat,
    restoreSession,
    deleteSession
  };
};
