
import React, { useState } from 'react';
import TimePickerWheel from '../TimePickerWheel';
import DatePickerWheel from '../DatePickerWheel';
import { soundEngine } from '../../services/soundService';

interface ManualEntryViewProps {
  data: any;
  setData: (data: any) => void;
  onAdd: () => void;
  volume?: number;
}

export const ManualEntryView: React.FC<ManualEntryViewProps> = ({ data, setData, onAdd, volume = 0.5 }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDifficultySelect = (lvl: number) => {
    setData({...data, difficulty: lvl});
    soundEngine.playTick(volume);
  };

  const handleBossToggle = () => {
    setData({...data, isBoss: !data.isBoss});
    soundEngine.playTick(volume);
  };

  const addSubtask = () => {
    const sanitized = (newSubtask || '').trim();
    if (!sanitized) return;
    const sub = {
      id: Math.random().toString(36).substr(2, 9),
      title: sanitized,
      completed: false
    };
    setData({
      ...data,
      subTasks: [...(data.subTasks || []), sub]
    });
    setNewSubtask('');
    soundEngine.playTick(volume);
  };

  const removeSubtask = (id: string) => {
    setData({
      ...data,
      subTasks: (data.subTasks || []).filter((s: any) => s.id !== id)
    });
    soundEngine.playTick(volume);
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return "1:00 AM";
    const [h, m] = time.split(':');
    const hours = parseInt(h);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${m} ${suffix}`;
  };

  return (
    <div className="animate-view-enter space-y-6 pb-48 pt-2">
      <div className="card-ui rounded-[3rem] p-8 space-y-8">
        <div className="space-y-3">
          <label className="protocol-label ml-1">Objective Title</label>
          <input 
            value={data.title || ''} 
            onChange={e => setData({...data, title: e.target.value})} 
            placeholder="Plan evolution..." 
            className="w-full input-ui p-6 outline-none font-black text-lg placeholder:opacity-20" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="protocol-label ml-1">Initiation</label>
            <button 
              onClick={() => { setShowTimePicker(!showTimePicker); soundEngine.playClick(volume); }}
              className={`w-full p-5 rounded-3xl transition-all flex items-center justify-center font-black ${showTimePicker ? 'bg-accent text-white shadow-lg scale-105' : 'bg-black/5 dark:bg-white/5 opacity-70'}`}
              style={showTimePicker ? { backgroundColor: 'var(--accent)' } : {}}
            >
              <span className="text-[10px] tracking-widest">{formatDisplayTime(data.startTime)}</span>
            </button>
            <div className={`transition-all duration-300 ease-out overflow-hidden ${showTimePicker ? 'max-h-64 mt-2 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'}`}>
              <TimePickerWheel 
                value={data.startTime || "09:00"} 
                onChange={(time) => setData({...data, startTime: time})} 
                volume={volume}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="protocol-label ml-1">Date</label>
            <button 
              onClick={() => { setShowDatePicker(!showDatePicker); soundEngine.playClick(volume); }}
              className={`w-full p-5 rounded-3xl transition-all flex items-center justify-center font-black ${showDatePicker ? 'bg-accent text-white shadow-lg scale-105' : 'bg-black/5 dark:bg-white/5 opacity-70'}`}
              style={showDatePicker ? { backgroundColor: 'var(--accent)' } : {}}
            >
              <span className="text-[10px] tracking-widest">
                {data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
              </span>
            </button>
            <div className={`transition-all duration-300 ease-out overflow-hidden ${showDatePicker ? 'max-h-64 mt-2 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'}`}>
              <DatePickerWheel 
                value={data.date || new Date().toISOString()} 
                onChange={(date) => setData({...data, date})} 
                volume={volume}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="protocol-label ml-1">Sub-Objectives</label>
          <div className="flex space-x-2">
            <input 
              value={newSubtask} 
              onChange={e => setNewSubtask(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && addSubtask()}
              placeholder="Break it down..." 
              className="flex-1 input-ui px-6 py-5 outline-none font-bold text-xs placeholder:opacity-20" 
            />
            <button 
              onClick={addSubtask}
              className="bg-accent text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
            {(data.subTasks || []).map((st: any) => (
              <div key={st.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-5 rounded-2xl animate-view-enter">
                <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter">{st.title}</span>
                <button onClick={() => removeSubtask(st.id)} className="text-rose-500 opacity-40 hover:opacity-100 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="protocol-label ml-1">Complexity</label>
          <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-1.5 rounded-full">
            {[1, 2, 3, 4, 5].map(lvl => (
              <button 
                key={lvl}
                onClick={() => handleDifficultySelect(lvl)}
                className={`w-12 h-12 rounded-full font-black text-[10px] transition-all duration-300 ${
                  data.difficulty === lvl 
                  ? 'bg-accent text-white shadow-xl scale-110' 
                  : 'opacity-20'
                }`}
                style={data.difficulty === lvl ? { backgroundColor: 'var(--accent)' } : {}}
              >
                L{lvl}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleBossToggle}
          className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
            data.isBoss 
            ? 'bg-rose-600 text-white shadow-xl border-rose-900/10 scale-[1.02]' 
            : 'bg-black/5 dark:bg-white/5 opacity-30'
          }`}
        >
          {data.isBoss ? '🔥 Boss Challenge Locked' : 'Set as Boss Challenge'}
        </button>
      </div>

      <button 
        onClick={onAdd} 
        className="w-full py-7 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Commit Protocol
      </button>
    </div>
  );
};
