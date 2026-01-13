
import React, { useState, useMemo } from 'react';
import { UserStats } from '../types';
import { soundEngine } from '../services/soundService';

interface StatsWidgetProps {
  stats: UserStats;
  tasks?: any[];
  history?: Record<string, number>;
}

type Mode = 'summary' | 'attributes' | 'analytics';
type Interval = 'weekly' | 'monthly';

const StatsWidget: React.FC<StatsWidgetProps> = ({ stats, history = {} }) => {
  const [mode, setMode] = useState<Mode>('summary');
  const [interval, setInterval] = useState<Interval>('weekly');

  const cycleMode = () => {
    const next: Record<Mode, Mode> = {
      'summary': 'attributes',
      'attributes': 'analytics',
      'analytics': 'summary'
    };
    setMode(next[mode]);
    soundEngine.playClick(0.5);
  };

  const handleIntervalChange = (e: React.MouseEvent, i: Interval) => {
    e.stopPropagation();
    setInterval(i);
    soundEngine.playTick(0.4);
  };

  const renderSummary = () => (
    <div className="flex items-center justify-between animate-view-enter">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent opacity-60 mb-1">Aura Level</p>
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-bold tracking-tight">Lv.{stats.level}</h2>
          <span className="opacity-40 text-[11px] font-medium">{stats.xp} XP</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-orange-500 font-semibold text-[11px] bg-orange-500/5 px-3 py-1.5 rounded-full mb-1 inline-block">
          🔥 {stats.streak} Day Streak
        </div>
        <p className="opacity-40 text-[9px] font-semibold uppercase tracking-widest mt-1 text-main">Healthy Progress</p>
      </div>
    </div>
  );

  const renderAttributes = () => (
    <div className="animate-view-enter grid grid-cols-2 gap-5">
      {[
        { label: 'Focus', val: stats.focus, color: 'bg-blue-500' },
        { label: 'Discipline', val: stats.discipline, color: 'bg-rose-500' },
        { label: 'Consistency', val: stats.consistency, color: 'bg-emerald-500' },
        { label: 'Creativity', val: stats.creativity, color: 'bg-violet-500' }
      ].map((s, idx) => (
        <div key={s.label} className="animate-view-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
          <p className="text-[10px] font-semibold opacity-40 mb-2 tracking-wide uppercase text-main">{s.label}</p>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${s.color} opacity-80 transition-all duration-1000 ease-out`} 
              style={{ width: `${Math.min(100, s.val * 5)}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );

  const analyticsData = useMemo(() => {
    const today = new Date();
    
    if (interval === 'weekly') {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const current = Array(7).fill(0);
      const previous = Array(7).fill(0);
      
      const dayOfWeek = today.getDay(); // 0 is Sun
      const mondayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(today.getDate() - mondayOffset);

      for (let i = 0; i < 7; i++) {
        const curDate = new Date(startOfCurrentWeek);
        curDate.setDate(startOfCurrentWeek.getDate() + i);
        const curKey = curDate.toISOString().split('T')[0];
        current[i] = history[curKey] || 0;

        const prevDate = new Date(curDate);
        prevDate.setDate(curDate.getDate() - 7);
        const prevKey = prevDate.toISOString().split('T')[0];
        previous[i] = history[prevKey] || 0;
      }
      return { labels, current, previous };
    } else {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const current = Array(12).fill(0);
      const previous = Array(12).fill(0);
      const thisYear = today.getFullYear();
      
      Object.entries(history).forEach(([dateStr, count]) => {
        const d = new Date(dateStr);
        const m = d.getMonth();
        const y = d.getFullYear();
        if (y === thisYear) current[m] += count;
        if (y === thisYear - 1) previous[m] += count;
      });
      return { labels, current, previous };
    }
  }, [interval, history]);

  const renderAnalytics = () => {
    const { labels, current, previous } = analyticsData;
    const allVals = [...current, ...previous];
    const maxVal = Math.max(...allVals, 5); // Minimum scale of 5 for aesthetics

    return (
      <div className="animate-view-enter space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 text-main">Enclave Trends</h3>
            <span className="text-[14px] font-black text-emerald-500 mt-0.5">Live Reflection</span>
          </div>
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            {(['weekly', 'monthly'] as Interval[]).map((i) => (
              <button
                key={i}
                onClick={(e) => handleIntervalChange(e, i)}
                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  interval === i ? 'bg-white text-black shadow-sm' : 'opacity-40 text-main hover:opacity-100'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="h-36 flex items-end justify-between px-0.5 gap-1 pt-4">
          {labels.map((label, idx) => {
            const currentH = (current[idx] / maxVal) * 100;
            const prevH = (previous[idx] / maxVal) * 100;
            
            return (
              <div key={label} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div className="flex items-end justify-center w-full h-full gap-[2px]">
                  {/* Previous Period Bar */}
                  <div 
                    className="w-full max-w-[8px] bg-accent/20 rounded-t-[3px] origin-bottom"
                    style={{ 
                      height: `${prevH}%`,
                      animation: `appleReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.03}s forwards`,
                      transform: 'scaleY(0)',
                      animationFillMode: 'forwards'
                    }}
                  />
                  {/* Current Period Bar */}
                  <div 
                    className="w-full max-w-[8px] bg-accent rounded-t-[3px] origin-bottom shadow-[0_-2px_8px_rgba(0,122,255,0.15)]"
                    style={{ 
                      height: `${currentH}%`,
                      animation: `appleReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.03 + 0.1}s forwards`,
                      transform: 'scaleY(0)',
                      animationFillMode: 'forwards'
                    }}
                  />
                </div>
                <span className="text-[7px] font-black opacity-30 mt-3 uppercase tracking-tighter truncate w-full text-center">
                  {interval === 'weekly' ? label : label[0]}
                </span>
                
                {/* Micro-Tooltip */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[7px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold uppercase tracking-widest">
                  {current[idx]} pts
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center space-x-6 pt-2 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest text-main">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent/20" />
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest text-main">Legacy</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={cycleMode}
      className={`card-ui rounded-[2.5rem] p-7 mb-8 cursor-pointer active:scale-[0.99] transition-all duration-500 ease-out ${
        mode === 'analytics' ? 'shadow-2xl border-accent/10 ring-1 ring-accent/5' : ''
      }`}
    >
      {mode === 'summary' && renderSummary()}
      {mode === 'attributes' && renderAttributes()}
      {mode === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default StatsWidget;
