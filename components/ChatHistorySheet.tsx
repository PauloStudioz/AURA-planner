
import React from 'react';
import { ChatSession } from '../types';
import { soundEngine } from '../services/soundService';

interface ChatHistorySheetProps {
  sessions: ChatSession[];
  onRestore: (session: ChatSession) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  volume?: number;
}

const ChatHistorySheet: React.FC<ChatHistorySheetProps> = ({ sessions, onRestore, onDelete, onClose, volume = 0.5 }) => {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full card-ui rounded-t-[3rem] p-8 pb-12 animate-view-enter shadow-2xl h-[70vh] flex flex-col" 
        style={{ backgroundColor: 'var(--bg-color)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-8 shrink-0" />
        
        <div className="flex items-center justify-between mb-6 shrink-0">
           <h2 className="text-xl font-black text-main uppercase tracking-widest">Neural Archives</h2>
           <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{sessions.length} sessions</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {sessions.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-20">
                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No saved protocols</p>
             </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id} 
                className="group relative bg-black/5 dark:bg-white/5 rounded-[2rem] p-5 active:scale-[0.98] transition-all duration-300 border border-transparent hover:border-accent/20 cursor-pointer"
                onClick={() => { onRestore(session); soundEngine.playPing(volume); onClose(); }}
              >
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-full">
                     {new Date(session.timestamp).toLocaleDateString()}
                   </span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(session.id); soundEngine.playTick(volume); }}
                     className="opacity-20 hover:opacity-100 text-rose-500 transition-opacity p-2 -mr-2 -mt-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </div>
                <p className="text-[13px] font-bold text-main leading-relaxed line-clamp-2 opacity-80">
                  {session.preview}
                </p>
                <div className="flex items-center space-x-2 mt-3 opacity-30">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                   <span className="text-[9px] font-bold uppercase tracking-widest">{session.messages.length} exchanges</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistorySheet;
