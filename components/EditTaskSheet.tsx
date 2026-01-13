
import React, { useState } from 'react';
import TimePickerWheel from './TimePickerWheel';
import DatePickerWheel from './DatePickerWheel';
import { Task } from '../types';
import { soundEngine } from '../services/soundService';

interface EditTaskSheetProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
  volume?: number;
}

const EditTaskSheet: React.FC<EditTaskSheetProps> = ({ task, onUpdate, onClose, volume = 0.5 }) => {
  const [activeTab, setActiveTab] = useState<'time' | 'date' | 'meta'>('time');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full card-ui rounded-t-[3rem] p-8 pb-12 animate-view-enter shadow-2xl" 
        style={{ backgroundColor: 'var(--bg-color)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-8" />
        
        <div className="flex space-x-2 mb-8 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
          {(['time', 'date', 'meta'] as const).map(t => (
            <button 
              key={t}
              onClick={() => { setActiveTab(t); soundEngine.playClick(volume); }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-sm text-accent' : 'opacity-40'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-h-[220px]">
          {activeTab === 'time' && (
            <div className="animate-view-enter">
              <label className="protocol-label mb-4">Set Initiation Time</label>
              <TimePickerWheel 
                value={task.startTime || "09:00"} 
                onChange={(time) => onUpdate({ startTime: time })}
                volume={volume}
              />
            </div>
          )}
          
          {activeTab === 'date' && (
            <div className="animate-view-enter">
              <label className="protocol-label mb-4">Select Target Date</label>
              <DatePickerWheel 
                value={task.date || new Date().toISOString()} 
                onChange={(date) => onUpdate({ date })}
                volume={volume}
              />
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="animate-view-enter space-y-8">
              <div>
                <label className="protocol-label mb-4">Level Complexity</label>
                <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-1.5 rounded-full">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => { onUpdate({ difficulty: lvl as any }); soundEngine.playTick(volume); }}
                      className={`w-12 h-12 rounded-full font-black text-[10px] transition-all ${
                        task.difficulty === lvl ? 'bg-accent text-white shadow-xl scale-110' : 'opacity-20'
                      }`}
                      style={task.difficulty === lvl ? { backgroundColor: 'var(--accent)' } : {}}
                    >
                      L{lvl}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="protocol-label mb-4">Challenge Mode</label>
                <button 
                  onClick={() => { onUpdate({ isBoss: !task.isBoss }); soundEngine.playTick(volume); }}
                  className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    task.isBoss ? 'bg-rose-600 text-white shadow-xl' : 'bg-black/5 dark:bg-white/5 opacity-30'
                  }`}
                >
                  {task.isBoss ? '🔥 Boss Challenge Active' : 'Normal Task'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-6 mt-8 bg-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-lg"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Close Editor
        </button>
      </div>
    </div>
  );
};

export default EditTaskSheet;
