
import React, { useState, useEffect, useMemo } from 'react';
import { soundEngine } from '../../services/soundService';
import { ChronoState, UserStats } from '../../types';
import { QUOTES } from '../../services/quotes';

interface ChronoViewProps {
  chrono: ChronoState;
  stats: UserStats;
  rituals: any;
  onStart: (type: 'focus' | 'break' | 'long-break') => void;
  onCancel: () => void;
  onUpdateRituals: (updates: any) => void;
}

export const ChronoView: React.FC<ChronoViewProps> = ({ 
  chrono, stats, rituals, onStart, onCancel, onUpdateRituals 
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const getCurrentLength = () => {
    if (chrono.type === 'focus') return rituals.pomodoroLength;
    if (chrono.type === 'break') return rituals.breakLength;
    return rituals.longBreakLength;
  };

  // Timer logic
  useEffect(() => {
    if (!chrono.isActive || !chrono.endTime) {
      setTimeLeft(getCurrentLength() * 60);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((chrono.endTime! - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chrono.isActive, chrono.endTime, chrono.type, rituals.pomodoroLength, rituals.breakLength, rituals.longBreakLength]);

  // Quote rotation logic: every 6.7 seconds
  useEffect(() => {
    if (!chrono.isActive) return;

    const rotationInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setFade(true);
      }, 500); // Wait for fade out
    }, 6700);

    return () => clearInterval(rotationInterval);
  }, [chrono.isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = chrono.isActive ? (1 - timeLeft / (getCurrentLength() * 60)) : 0;
  const currentQuote = useMemo(() => QUOTES[quoteIndex], [quoteIndex]);

  return (
    <div className="animate-view-enter flex flex-col space-y-6 pb-64 pt-2 px-1">
      {/* Performance Summary Card */}
      <div className="card-ui rounded-[2.5rem] p-6 flex items-center justify-around shrink-0">
        <div className="text-center">
          <p className="protocol-label mb-1">Total Focus</p>
          <p className="text-xl font-black text-main tracking-tight">{stats.focusMinutes}m</p>
        </div>
        <div className="w-px h-8 bg-black/5 dark:bg-white/5" />
        <div className="text-center">
          <p className="protocol-label mb-1">Rituals Done</p>
          <p className="text-xl font-black text-main tracking-tight">{stats.sessionsCompleted}</p>
        </div>
      </div>

      {/* Neural Core (Timer) */}
      <div className="relative w-52 h-52 mx-auto flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/5 dark:text-white/5" />
          <circle 
            cx="50" cy="50" r="46" fill="none" stroke="var(--accent)" strokeWidth="3.5" 
            strokeDasharray="289" strokeDashoffset={289 * (1 - progress)} 
            strokeLinecap="round" className="transition-all duration-1000 ease-linear shadow-[0_0_20px_var(--accent-glow)]" 
          />
        </svg>
        <div className="text-center z-10">
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-1">
            {chrono.isActive ? chrono.type.replace('-', ' ') : 'Standby'}
          </p>
          <h1 className="text-5xl font-black text-main tracking-tighter tabular-nums">
            {formatTime(timeLeft)}
          </h1>
        </div>
      </div>

      {/* Protocol Configuration Card */}
      <div className="card-ui rounded-[3rem] p-8 space-y-8 min-h-[340px] flex flex-col justify-center">
        {!chrono.isActive ? (
          <>
            <div className="space-y-4">
              <label className="protocol-label text-center block">Temporal Modifiers (min)</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Work', key: 'pomodoroLength' },
                  { label: 'Short', key: 'breakLength' },
                  { label: 'Long', key: 'longBreakLength' }
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <input 
                      type="number" 
                      value={rituals[item.key]} 
                      onChange={(e) => onUpdateRituals({...rituals, [item.key]: Math.max(1, parseInt(e.target.value) || 1)})}
                      className="w-full input-ui p-4 text-center font-black text-sm outline-none"
                    />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30 text-center block">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5 pt-2">
               <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Auto-Chain Breaks</span>
                 <button 
                  onClick={() => { onUpdateRituals({...rituals, autoStartBreaks: !rituals.autoStartBreaks}); soundEngine.playTick(rituals.soundVolume); }}
                  className={`w-11 h-6 rounded-full transition-all relative flex items-center ${rituals.autoStartBreaks ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'}`}
                 >
                   <div className="absolute w-4 h-4 bg-white rounded-full transition-all shadow-sm" style={{ transform: rituals.autoStartBreaks ? 'translateX(24px)' : 'translateX(4px)' }} />
                 </button>
               </div>
               <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Auto-Chain Focus</span>
                 <button 
                  onClick={() => { onUpdateRituals({...rituals, autoStartFocus: !rituals.autoStartFocus}); soundEngine.playTick(rituals.soundVolume); }}
                  className={`w-11 h-6 rounded-full transition-all relative flex items-center ${rituals.autoStartFocus ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'}`}
                 >
                   <div className="absolute w-4 h-4 bg-white rounded-full transition-all shadow-sm" style={{ transform: rituals.autoStartFocus ? 'translateX(24px)' : 'translateX(4px)' }} />
                 </button>
               </div>
            </div>
            
            <div className="flex flex-col gap-4 pt-4">
              <button 
                onClick={() => onStart('focus')}
                className="w-full py-7 bg-accent text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all text-[12px]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Commit Protocol
              </button>
              <button 
                onClick={() => onStart('break')}
                className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all text-[10px]"
              >
                Initiate Break
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 space-y-6 text-center animate-view-enter flex flex-col items-center justify-center flex-1">
             <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <div className="w-3 h-3 bg-accent rounded-full shadow-[0_0_20px_var(--accent)]" />
             </div>
             <div className={`transition-all duration-1000 px-4 max-w-xs ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <p className="text-[15px] font-bold text-main leading-relaxed tracking-tight italic">
                  "{currentQuote.text}"
                </p>
                <p className="text-[8px] font-black uppercase text-accent tracking-[0.3em] mt-3 opacity-60">
                  — {currentQuote.author}
                </p>
             </div>
             <button 
                onClick={onCancel}
                className="w-full py-6 mt-6 bg-rose-500 text-white rounded-[2.2rem] font-black uppercase tracking-[0.4em] shadow-xl active:scale-[0.98] transition-all text-[11px]"
              >
                Abort Ritual
              </button>
          </div>
        )}
      </div>
    </div>
  );
};
