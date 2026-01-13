
import React from 'react';
import { soundEngine } from '../services/soundService';

const ALL_MODELS = [
  { group: 'Preview', items: [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', status: 'Preview', desc: 'Reasoning' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', status: 'Preview', desc: 'Fast Multimodal' }
  ]},
  { group: 'Stable', items: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', status: 'Stable', desc: 'Advanced' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', status: 'Stable', desc: 'Efficiency' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', status: 'Stable', desc: 'Low Latency' }
  ]}
];

const ModelActionSheet = ({ selected, onSelect, onClose, volume = 0.5 }: any) => (
  <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div 
      className="w-full card-ui rounded-t-[3rem] p-8 pb-12 animate-view-enter shadow-2xl border-t border-black/10 dark:border-white/10" 
      style={{ backgroundColor: 'var(--bg-color)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-8" />
      <h2 className="text-center font-black text-xl mb-8 uppercase tracking-widest text-main">Neural Engine</h2>
      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
        {ALL_MODELS.map(g => (
          <div key={g.group}>
            <p className="text-[11px] font-black uppercase text-blue-500 mb-4 px-2 tracking-widest">{g.group}</p>
            <div className="bg-black/5 dark:bg-white/5 rounded-[2.2rem] overflow-hidden border border-black/5 dark:border-white/5">
              {g.items.map((it, idx) => (
                <button 
                  key={it.id} 
                  onClick={() => {
                    soundEngine.playClick(volume);
                    onSelect(it.id);
                  }} 
                  className={`w-full p-6 flex items-center justify-between active:bg-blue-500 group transition-all duration-300 ${idx !== g.items.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold group-active:text-white text-main">{it.name}</p>
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 group-active:bg-white/20 group-active:text-white uppercase tracking-tighter">{it.status}</span>
                    </div>
                    <p className="text-[10px] opacity-40 font-bold uppercase mt-1 group-active:text-white/60 text-main">{it.desc}</p>
                  </div>
                  {selected === it.id && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ModelActionSheet;
