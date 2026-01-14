
import React from 'react';
import { soundEngine } from '../../services/soundService';

interface NeuralChatViewProps {
  chats: any[];
  onShowPicker: () => void;
  onShowHistory: () => void;
  onClear: () => void;
  model: string;
  chatEndRef: any;
  loading: boolean;
  volume?: number;
}

export const NeuralChatView: React.FC<NeuralChatViewProps> = ({ chats, onShowPicker, onShowHistory, onClear, model, chatEndRef, loading, volume = 0.5 }) => (
  <div className="animate-view-enter pb-64 pt-4">
    <div className="flex items-center space-x-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 mb-8">
      <button 
        onClick={() => { soundEngine.playClick(volume); onShowHistory(); }} 
        className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-full text-blue-500 shadow-sm active:scale-90 transition-transform"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h8m-8 6h16" /></svg>
      </button>
      <div className="flex-1 text-center">
        <button 
          onClick={() => { soundEngine.playClick(volume); onShowPicker(); }} 
          className="px-4 py-2 bg-white/50 dark:bg-zinc-800/50 rounded-full inline-flex items-center space-x-2 group active:scale-95 transition-all border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-main opacity-80">{model.replace('gemini-', 'G').toUpperCase()}</span>
          <svg className="w-3 h-3 opacity-30 group-hover:translate-y-0.5 transition-transform text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <button 
        onClick={() => { soundEngine.playClick(volume); onClear(); }} 
        className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-full text-rose-500 shadow-sm active:scale-90 transition-transform"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.8 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>

    <div className="space-y-4">
      {chats.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center opacity-10 space-y-4 text-center">
           <svg className="w-12 h-12 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-main">Neural Link Standby</p>
        </div>
      ) : (
        chats.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'} animate-view-enter`}>
            <div className={`max-w-[88%] p-5 rounded-[2.2rem] text-sm font-bold shadow-sm leading-relaxed ${
              c.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none border border-white/10' 
                : 'card-ui rounded-tl-none text-main border border-black/5 dark:border-white/5'
            }`}>
              {c.text}
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="flex justify-start animate-view-enter">
          <div className="card-ui p-4 rounded-[1.8rem] rounded-tl-none border border-black/5">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} className="h-4" />
    </div>
  </div>
);
