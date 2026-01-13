
import React, { useState } from 'react';
import TimePickerWheel from '../TimePickerWheel';
import { soundEngine } from '../../services/soundService';
import { RoutineBlueprint } from '../../types';

interface RoutineViewProps {
  routines: RoutineBlueprint[];
  onAdd: (r: RoutineBlueprint) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onUpdate: (id: string, updates: Partial<RoutineBlueprint>) => void;
  volume?: number;
}

export const RoutineView: React.FC<RoutineViewProps> = ({ 
  routines, onAdd, onDelete, onToggleActive, onUpdate, volume = 0.5 
}) => {
  const [showAdder, setShowAdder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Partial<RoutineBlueprint>>({});

  const handleAdd = () => {
    const newR = {
      title: editBuffer.title || 'New Protocol',
      startTime: editBuffer.startTime || '08:00',
      duration: editBuffer.duration || 30,
      category: editBuffer.category || 'health' as any,
      difficulty: editBuffer.difficulty || 1 as any,
      isActive: true,
      id: Math.random().toString(36).substr(2, 9)
    };
    onAdd(newR);
    setEditBuffer({});
    setShowAdder(false);
    soundEngine.playPing(volume);
  };

  const startEditing = (r: RoutineBlueprint) => {
    setEditingId(r.id);
    setEditBuffer(r);
    soundEngine.playClick(volume);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editBuffer);
      setEditingId(null);
      setEditBuffer({});
      soundEngine.playPing(volume);
    }
  };

  return (
    <div className="animate-view-enter pb-48 pt-2">
      <div className="mb-10 text-center px-4">
        <h2 className="text-xl font-black text-main uppercase tracking-widest">Blueprint Protocols</h2>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em] mt-2">Active templates spawn daily</p>
      </div>

      <div className="space-y-6">
        {routines.map(r => (
          <div key={r.id} className="card-ui rounded-[2.5rem] p-6 relative group overflow-hidden border-dashed">
             {editingId === r.id ? (
                <div className="space-y-4 animate-view-enter">
                  <input 
                    value={editBuffer.title}
                    onChange={e => setEditBuffer({...editBuffer, title: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 p-4 rounded-2xl font-bold text-main outline-none"
                  />
                  <TimePickerWheel value={editBuffer.startTime!} onChange={t => setEditBuffer({...editBuffer, startTime: t})} volume={volume} />
                  <div className="flex space-x-2">
                    <button onClick={saveEdit} className="flex-1 py-4 bg-accent text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest">Update</button>
                    <button onClick={() => setEditingId(null)} className="px-6 py-4 bg-black/5 dark:bg-white/5 text-main font-bold rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button>
                  </div>
                </div>
             ) : (
                <div className="flex items-center justify-between">
                  <div onClick={() => startEditing(r)} className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[8px] font-black uppercase text-accent bg-accent/5 px-2 py-0.5 rounded-full">Lvl {r.difficulty}</span>
                        <span className="text-[8px] font-black uppercase opacity-30 tracking-widest">{r.category}</span>
                    </div>
                    <h3 className={`font-bold text-[17px] tracking-tight ${!r.isActive ? 'opacity-20' : 'text-main'}`}>{r.title}</h3>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">{r.startTime} • {r.duration}m</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleActive(r.id); soundEngine.playTick(volume); }}
                      className={`w-12 h-7 rounded-full transition-all duration-300 relative flex items-center ${r.isActive ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'}`}
                    >
                      <div 
                        className="absolute w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm"
                        style={{ transform: r.isActive ? 'translateX(24px)' : 'translateX(4px)' }} 
                      />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(r.id); soundEngine.playTick(volume); }} className="text-rose-500 opacity-20 hover:opacity-100 p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.8 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
             )}
          </div>
        ))}

        {showAdder ? (
          <div className="card-ui rounded-[2.5rem] p-8 space-y-6 animate-view-enter">
            <input 
              value={editBuffer.title || ''}
              onChange={e => setEditBuffer({...editBuffer, title: e.target.value})}
              placeholder="Protocol Name..."
              className="w-full input-ui p-6 font-black text-main outline-none placeholder:opacity-20"
            />
            <TimePickerWheel value={editBuffer.startTime || '08:00'} onChange={t => setEditBuffer({...editBuffer, startTime: t})} volume={volume} />
            <div className="flex space-x-2">
               <button onClick={handleAdd} className="flex-1 py-5 bg-accent text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-lg">Activate</button>
               <button onClick={() => setShowAdder(false)} className="px-8 py-5 bg-black/5 dark:bg-white/5 text-main font-black uppercase text-[10px] tracking-widest rounded-3xl">Cancel</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => { 
              setEditBuffer({ title: '', startTime: '08:00', duration: 30, difficulty: 1, category: 'health' });
              setShowAdder(true); 
              soundEngine.playClick(volume); 
            }}
            className="w-full py-10 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.5em] opacity-30 hover:opacity-60 transition-all hover:bg-black/5"
          >
            + Create New Protocol
          </button>
        )}
      </div>

      <div className="mt-12 p-8 text-center opacity-20">
         <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed">
           Protocols are blueprint templates.<br/>Toggling one "Active" manifests it in your Flow for today.
         </p>
      </div>
    </div>
  );
};
