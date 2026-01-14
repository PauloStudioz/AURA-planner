
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuraState } from './hooks/useAuraState';
import { TaskListView } from './components/views/TaskListView';
import { ManualEntryView } from './components/views/ManualEntryView';
import { NeuralChatView } from './components/views/NeuralChatView';
import { SettingsView } from './components/views/SettingsView';
import { RoutineView } from './components/views/RoutineView';
import { ChronoView } from './components/views/ChronoView';
import ModelActionSheet from './components/ModelActionSheet';
import EditTaskSheet from './components/EditTaskSheet';
import ChatHistorySheet from './components/ChatHistorySheet';
import { processAIInput } from './services/geminiService';
import { soundEngine } from './services/soundService';
import { QUOTES } from './services/quotes';
import { GoogleGenAI } from "@google/genai";
import { Task } from './types';

const LoadingScreen: React.FC<{ onComplete: () => void, theme: string }> = ({ onComplete, theme }) => {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage(2); 
          return 100;
        }
        return prev + 0.8; 
      });
    }, 20);

    const tFinal = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => { clearTimeout(t1); clearTimeout(tFinal); clearInterval(interval); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[500] flex flex-col items-center justify-center p-12 overflow-hidden transition-colors duration-1000 ${theme === 'midnight' ? 'bg-black' : 'bg-[#FBFBFD]'}`}>
      <div className="relative z-10 flex flex-col items-center w-full text-center">
        <div className="w-24 h-24 mb-12 relative flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/5 dark:text-white/5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="283" strokeDashoffset={283 - (283 * progress / 100)} strokeLinecap="round" className="transition-all duration-100 ease-linear" />
            </svg>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_15px_var(--accent)]" />
        </div>
        <p className={`text-[18px] font-bold tracking-tight leading-relaxed max-w-xs transition-all duration-1000 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>"{quote.text}"</p>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-accent opacity-70">{quote.author}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    state, setState, toggleTask, toggleSubtask, deleteTask, addTasks, 
    updateSortPreference, updateTask, undoDelete, addRoutine, deleteRoutine, 
    toggleRoutineActive, updateRoutine, startChrono, cancelChrono,
    archiveCurrentChat, restoreSession, deleteSession
  } = useAuraState();
  
  const [view, setView] = useState<'today' | 'manual' | 'settings' | 'neural' | 'routine' | 'chrono'>('today');
  const [ui, setUi] = useState({ 
    picker: false, 
    showHistory: false,
    model: 'gemini-3-flash-preview', 
    editingTask: null as Task | null, 
    isAppReady: false 
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualData, setManualData] = useState({ title: '', duration: 30, category: 'work' as any, startTime: '09:00', date: new Date().toISOString(), difficulty: 1, isBoss: false, subTasks: [] });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.recentlyDeletedTask) {
      const timer = setTimeout(() => { setState({ recentlyDeletedTask: null }); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.recentlyDeletedTask, setState]);

  const showErrorMessage = (msg: string) => {
    setError(msg);
    // Auto clear error after 5s unless it's a critical auth error
    if (!msg.includes('403')) {
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAIAction = async () => {
    const sanitizedInput = (input || '').trim();
    if (!sanitizedInput) return;
    
    if (!state.apiKey) {
      showErrorMessage("Neural key missing. Access Settings.");
      soundEngine.playTick(state.rituals.soundVolume);
      return;
    }

    setLoading(true);
    setError(null);
    soundEngine.playNeural(state.rituals.soundVolume);
    const currentInput = sanitizedInput; 
    setInput('');

    try {
      if (view === 'neural') {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const response = await ai.models.generateContent({ 
          model: ui.model, 
          contents: currentInput,
          config: { systemInstruction: "You are Aura AI, a high-intelligence productivity mentor. Be concise, stoic, and helpful." }
        });
        setState({ chats: [...(state.chats || []), { role: 'user', text: currentInput, timestamp: Date.now() }, { role: 'model', text: response.text || 'Complete.', timestamp: Date.now() }] });
      } else {
        const result = await processAIInput(state.apiKey, currentInput, state.aiMode, state.tasks, state.energyLevel);
        if (result && result.tasks) {
          addTasks(result.tasks.map((t: any) => ({ 
            ...t, 
            id: t.id || Math.random().toString(36).substr(2, 9), 
            completed: false,
            subTasks: t.subTasks || []
          })));
          setView('today');
          soundEngine.playPing(state.rituals.soundVolume);
        }
      }
    } catch (e: any) {
      console.error(e);
      showErrorMessage(e.message || "Action failed.");
      // On error, we put the text back so user doesn't lose it
      setInput(currentInput);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    archiveCurrentChat();
  };

  if (!ui.isAppReady) return <LoadingScreen theme={state.theme} onComplete={() => setUi(u => ({ ...u, isAppReady: true }))} />;

  return (
    <div className="min-h-screen flex flex-col relative animate-view-enter overflow-x-hidden">
      <header className="px-8 pt-16 pb-6 sticky top-0 z-[100] flex justify-between items-end backdrop-blur-[40px] border-b border-black/5 dark:border-white/5 shrink-0 transition-colors duration-500"
              style={{ backgroundColor: 'rgba(var(--bg-rgb, 251, 251, 253), 0.9)' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          :root { --bg-rgb: 251, 251, 253; }
          .theme-midnight { --bg-rgb: 0, 0, 0; }
          .theme-glass { --bg-rgb: 232, 235, 242; }
        `}} />
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-main">
            {view === 'today' ? 'Flow' : view === 'neural' ? 'Neural' : view === 'manual' ? 'Goal' : view === 'routine' ? 'Protocols' : view === 'chrono' ? 'Chrono' : 'Aura'}
          </h1>
          <p className="text-[10px] text-accent font-black tracking-[0.2em] uppercase mt-1">Aura Level {state.stats.level}</p>
        </div>
        <div className="flex space-x-2">
          {['manual', 'routine', 'chrono', 'neural', 'settings'].map((v: any) => (
            <button 
              key={v} 
              onClick={() => { setView(view === v ? 'today' : v); soundEngine.playClick(state.rituals.soundVolume); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${view === v ? 'bg-accent text-white shadow-lg' : 'bg-black/5 dark:bg-white/5 text-main opacity-40'}`}
            >
              {v === 'manual' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>}
              {v === 'routine' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
              {v === 'chrono' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              {v === 'neural' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
              {v === 'settings' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.3 4.3c.4-1.7 2.9-1.7 3.3 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001.1 2.6c1.7.4 1.7 2.9 0 3.3a1.7 1.7 0 00-1.1 2.6c.9 1.5-.8 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1.1c-.4 1.7-2.9 1.7-3.3 0a1.7 1.7 0 00-2.6-1.1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 00-1.1-2.6c-1.7-.4-1.7-2.9 0-3.3a1.7 1.7 0 001.1-2.6c-.9-1.5.8-3.3 2.4-2.4.3-.2.3-.2.3-.2zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-8 relative">
          {view === 'today' && <TaskListView tasks={state.tasks || []} stats={state.stats} history={state.history} sortPreference={state.sortPreference} onSortChange={updateSortPreference} onToggle={toggleTask} onDelete={deleteTask} onToggleSubtask={toggleSubtask} onLongPress={(t) => setUi({ ...ui, editingTask: t })} />}
          {view === 'routine' && <RoutineView routines={state.routines} onAdd={addRoutine} onDelete={deleteRoutine} onToggleActive={toggleRoutineActive} onUpdate={updateRoutine} volume={state.rituals.soundVolume} />}
          {view === 'chrono' && <ChronoView chrono={state.chrono} stats={state.stats} rituals={state.rituals} onStart={startChrono} onCancel={cancelChrono} onUpdateRituals={(u: any) => setState({ rituals: u })} />}
          {view === 'manual' && <ManualEntryView data={manualData} setData={setManualData} onAdd={() => { addTasks([{...manualData, id: Math.random().toString(36).substr(2, 9), completed: false}]); setView('today'); soundEngine.playPing(state.rituals.soundVolume); }} volume={state.rituals.soundVolume} />}
          {view === 'neural' && <NeuralChatView loading={loading} chats={state.chats || []} model={ui.model} onShowPicker={() => setUi({...ui, picker: true})} onShowHistory={() => setUi({...ui, showHistory: true})} onClear={handleClearChat} chatEndRef={chatEndRef} volume={state.rituals.soundVolume} />}
          {view === 'settings' && <SettingsView theme={state.theme} onSetTheme={(t:any) => setState({ theme: t })} accentColor={state.accentColor} onSetAccent={(c:any) => setState({ accentColor: c })} glassStyle={state.glassStyle} onSetGlassStyle={(s:any) => setState({ glassStyle: s })} apiKey={state.apiKey} onSetApiKey={(k:any) => setState({ apiKey: k })} aiMode={state.aiMode} onSetAiMode={(m:any) => setState({ aiMode: m })} rituals={state.rituals} onUpdateRituals={(r:any) => setState({ rituals: r })} />}
      </main>

      {/* Persistent AI Input Bar */}
      {(view === 'today' || view === 'neural') && (
        <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 z-[200] pointer-events-none">
          <div className={`card-ui ios-blur rounded-[2.5rem] p-2 flex items-center pointer-events-auto max-w-lg mx-auto shadow-2xl transition-all duration-300 ${error ? 'error-shake ring-2 ring-rose-500/50 border-rose-500/50' : 'border-white/10'}`}>
            <input 
              value={input} 
              onChange={e => { setInput(e.target.value); if(error) setError(null); }} 
              placeholder={error || "Neural command..."} 
              className={`flex-1 bg-transparent px-6 py-4 outline-none text-[16px] font-bold transition-colors ${error ? 'text-rose-500 placeholder:text-rose-500/40' : 'text-main placeholder:opacity-30'}`} 
              onKeyPress={e => e.key === 'Enter' && handleAIAction()} 
            />
            <button 
              onClick={handleAIAction} 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 ${error ? 'bg-rose-500' : 'bg-accent'} text-white`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : error ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              )}
            </button>
          </div>
        </div>
      )}

      {ui.picker && <ModelActionSheet selected={ui.model} onSelect={(m:string) => setUi({...ui, model: m, picker: false})} onClose={() => setUi({...ui, picker: false})} volume={state.rituals.soundVolume} />}
      {ui.editingTask && <EditTaskSheet task={ui.editingTask} onUpdate={(u) => updateTask(ui.editingTask!.id, u)} onClose={() => setUi({ ...ui, editingTask: null })} volume={state.rituals.soundVolume} />}
      {ui.showHistory && <ChatHistorySheet sessions={state.archivedChats} onRestore={restoreSession} onDelete={deleteSession} onClose={() => setUi({...ui, showHistory: false})} volume={state.rituals.soundVolume} />}
      
      {error && !input && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-view-enter pointer-events-none">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
