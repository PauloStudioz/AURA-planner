
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuraState } from './hooks/useAuraState';
import { TaskListView } from './components/views/TaskListView';
import { ManualEntryView } from './components/views/ManualEntryView';
import { NeuralChatView } from './components/views/NeuralChatView';
import { SettingsView } from './components/views/SettingsView';
import { RoutineView } from './components/views/RoutineView';
import ModelActionSheet from './components/ModelActionSheet';
import EditTaskSheet from './components/EditTaskSheet';
import { processAIInput } from './services/geminiService';
import { soundEngine } from './services/soundService';
import { GoogleGenAI } from "@google/genai";
import { Task } from './types';

const QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: "Da Vinci" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "Jobs" },
  { text: "Your mind is for having ideas, not holding them.", author: "Allen" },
  { text: "The secret of getting ahead is getting started.", author: "Twain" },
  { text: "Deep work is the superpower of the 21st century.", author: "Newport" },
  { text: "Action is the foundational key to all success.", author: "Picasso" },
  { text: "The best way to predict the future is to create it.", author: "Drucker" },
  { text: "Amor Fati. Love your fate.", author: "Nietzsche" },
  { text: "He who has a why to live can bear almost any how.", author: "Nietzsche" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
  { text: "Accept the things to which fate binds you, and love the people with whom fate brings you together.", author: "Marcus Aurelius" },
  { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius" },
  { text: "Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", author: "Marcus Aurelius" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "All cruelty springs from weakness.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "He who is brave is free.", author: "Seneca" },
  { text: "No man was ever wise by chance.", author: "Seneca" },
  { text: "Associates with people who are likely to improve you.", author: "Seneca" },
  { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
  { text: "While we wait for life, life passes.", author: "Seneca" },
  { text: "Life is long if you know how to use it.", author: "Seneca" },
  { text: "Man conquers the world by conquering himself.", author: "Zeno" },
  { text: "Happiness is a good flow of life.", author: "Zeno" },
  { text: "Steel your sensibilities, so that life shall hurt you as little as possible.", author: "Zeno" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Don't explain your philosophy. Embody it.", author: "Epictetus" },
  { text: "If you want to improve, be content to be thought foolish and stupid.", author: "Epictetus" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "Small-minded people blame others. Average people blame themselves. The wise see all blame as foolishness.", author: "Epictetus" },
  { text: "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.", author: "Epictetus" },
  { text: "There is only one way to happiness and that is to cease worrying about things which are beyond our control.", author: "Epictetus" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "A ship should not ride on a single anchor, nor life on a single hope.", author: "Epictetus" },
  { text: "To live a life of virtue, match your thoughts with your actions.", author: "Epictetus" },
  { text: "Know, first, who you are, and then adorn yourself accordingly.", author: "Epictetus" },
  { text: "Silence is better than unmeaning words.", author: "Pythagoras" },
  { text: "The beginning of every day is a new world.", author: "Hokusai" },
  { text: "To know yourself, you must sacrificed the illusion that you already do.", author: "Gurdjieff" },
  { text: "Great things are done by a series of small things brought together.", author: "Van Gogh" },
  { text: "I would rather die of passion than of boredom.", author: "Van Gogh" },
  { text: "The secret to life is to have no fear.", author: "Stravinsky" },
  { text: "Creativity takes courage.", author: "Matisse" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates" },
  { text: "Wonder is the beginning of wisdom.", author: "Socrates" },
  { text: "To find yourself, think for yourself.", author: "Socrates" },
  { text: "Strong minds discuss ideas, average minds discuss events, weak minds discuss people.", author: "Socrates" },
  { text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates" },
  { text: "Think like a man of action, act like a man of thought.", author: "Bergson" }
];

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
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(tFinal); clearInterval(interval); };
  }, [onComplete]);

  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30) - 90; 
    const isActive = progress >= (i / 11) * 100;
    return { angle, isActive, index: i };
  });

  return (
    <div className={`fixed inset-0 z-[500] flex flex-col items-center justify-center p-12 overflow-hidden transition-colors duration-1000 ${theme === 'midnight' ? 'bg-black' : 'bg-[#FBFBFD]'}`}>
      <style>{`
        .chrono-ring { position: relative; width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; }
        .task-tick { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0.15; }
        .task-tick.active { opacity: 1; transform: scale(1.8); box-shadow: 0 0 12px var(--accent-glow); }
        .runner { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: white; border: 2px solid var(--accent); box-shadow: 0 0 15px var(--accent-glow); transition: transform 0.1s linear; z-index: 10; }
      `}</style>
      
      <div className={`absolute inset-0 transition-opacity duration-[2000ms] ${stage >= 1 ? 'opacity-25' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full text-center">
        <div className={`chrono-ring transition-all duration-[1500ms] ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent/10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="264" strokeDashoffset={264 - (264 * progress / 100)} strokeLinecap="round" className="text-accent transition-all duration-100 ease-linear" />
          </svg>
          {ticks.map((t) => (
            <div key={t.index} className={`task-tick ${t.isActive ? 'active' : ''}`} style={{ transform: `rotate(${t.angle}deg) translate(42px) rotate(${-t.angle}deg) ${t.isActive ? 'scale(1.8)' : 'scale(1)'}` }} />
          ))}
          <div className="runner" style={{ transform: `rotate(${(progress * 3.6) - 90}deg) translate(42px) rotate(${-(progress * 3.6) + 90}deg)` }} />
          <div className={`transition-all duration-1000 ${stage >= 2 ? 'scale-110 opacity-100' : 'scale-90 opacity-40'}`}>
             <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full bg-accent transition-all duration-1000 ${stage >= 2 ? 'shadow-[0_0_30px_var(--accent)]' : ''}`} />
             </div>
          </div>
        </div>

        <div className={`mt-16 px-8 transition-all duration-1000 delay-500 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className={`text-[18px] md:text-[20px] font-bold tracking-tight leading-relaxed ${theme === 'midnight' ? 'text-white' : 'text-zinc-800'}`}>"{quote.text}"</p>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-accent opacity-70">{quote.author}</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { 
    state, setState, toggleTask, toggleSubtask, deleteTask, addTasks, 
    updateSortPreference, updateTask, undoDelete, addRoutine, deleteRoutine, toggleRoutineActive, updateRoutine 
  } = useAuraState();
  
  const [view, setView] = useState<'today' | 'manual' | 'settings' | 'neural' | 'routine'>('today');
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

  useEffect(() => {
    if (view === 'neural' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chats, view]);

  const showErrorMessage = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const handleAIAction = async () => {
    const sanitizedInput = (input || '').trim();
    if (!sanitizedInput) return;
    if (!state.apiKey) {
      showErrorMessage("Neural key missing. Check Settings.");
      return;
    }

    setLoading(true);
    soundEngine.playNeural(state.rituals.soundVolume);
    const currentInput = sanitizedInput; 
    setInput('');

    try {
      if (view === 'neural') {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const response = await ai.models.generateContent({ 
          model: ui.model, 
          contents: currentInput,
          config: { systemInstruction: "You are Aura AI, a high-intelligence productivity mentor. Be concise, stoic, and helpful. Use markdown for lists." }
        });
        setState({ chats: [...(state.chats || []), { role: 'user', text: currentInput, timestamp: Date.now() }, { role: 'model', text: response.text || 'Complete.', timestamp: Date.now() }] });
      } else {
        const result = await processAIInput(state.apiKey, currentInput, state.aiMode, state.tasks, state.energyLevel);
        if (result && result.tasks) {
          addTasks(result.tasks.map((t: any) => ({ ...t, id: Math.random().toString(36).substr(2, 9), completed: false })));
          setView('today');
          soundEngine.playPing(state.rituals.soundVolume);
        }
      }
    } catch (e: any) {
      showErrorMessage("Action failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!ui.isAppReady) return <LoadingScreen theme={state.theme} onComplete={() => setUi(u => ({ ...u, isAppReady: true }))} />;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden animate-view-enter">
      <header className="px-8 pt-16 pb-6 sticky top-0 z-30 flex justify-between items-end bg-transparent">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-main">
            {view === 'today' ? 'Flow' : view === 'neural' ? 'Neural' : view === 'manual' ? 'Goal' : view === 'routine' ? 'Protocols' : 'Aura'}
          </h1>
          <p className="text-[10px] text-accent font-black tracking-[0.2em] uppercase mt-1">Aura Level {state.stats.level}</p>
        </div>
        <div className="flex space-x-2">
          {['manual', 'routine', 'neural', 'settings'].map((v: any) => (
            <button 
              key={v} 
              onClick={() => { setView(view === v ? 'today' : v); soundEngine.playClick(state.rituals.soundVolume); }} 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${view === v ? 'bg-accent text-white' : 'bg-black/5 dark:bg-white/5 text-main opacity-40'}`}
            >
              {v === 'manual' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>}
              {v === 'routine' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
              {v === 'neural' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
              {v === 'settings' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.3 4.3c.4-1.7 2.9-1.7 3.3 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001.1 2.6c1.7.4 1.7 2.9 0 3.3a1.7 1.7 0 00-1.1 2.6c.9 1.5-.8 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1.1c-.4 1.7-2.9 1.7-3.3 0a1.7 1.7 0 00-2.6-1.1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 00-1.1-2.6c-1.7-.4-1.7-2.9 0-3.3a1.7 1.7 0 001.1-2.6c-.9-1.5.8-3.3 2.4-2.4.3-.2.3-.2.3-.2zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-8 py-4 pb-40 overflow-y-auto scrollbar-hide">
        {view === 'today' && <TaskListView tasks={state.tasks || []} stats={state.stats} history={state.history} sortPreference={state.sortPreference} onSortChange={updateSortPreference} onToggle={toggleTask} onDelete={deleteTask} onToggleSubtask={toggleSubtask} onLongPress={(t) => setUi({ ...ui, editingTask: t })} />}
        {view === 'routine' && <RoutineView routines={state.routines} onAdd={addRoutine} onDelete={deleteRoutine} onToggleActive={toggleRoutineActive} onUpdate={updateRoutine} volume={state.rituals.soundVolume} />}
        {view === 'manual' && <ManualEntryView data={manualData} setData={setManualData} onAdd={() => { addTasks([{...manualData, id: Math.random().toString(36).substr(2, 9), completed: false}]); setView('today'); soundEngine.playPing(state.rituals.soundVolume); }} volume={state.rituals.soundVolume} />}
        {view === 'neural' && <NeuralChatView loading={loading} chats={state.chats || []} model={ui.model} onShowPicker={() => setUi({...ui, picker: true})} onShowHistory={() => setUi({...ui, showHistory: true})} onClear={() => setState({ chats: [] })} chatEndRef={chatEndRef} volume={state.rituals.soundVolume} />}
        {view === 'settings' && <SettingsView theme={state.theme} onSetTheme={(t:any) => setState({ theme: t })} accentColor={state.accentColor} onSetAccent={(c:any) => setState({ accentColor: c })} glassStyle={state.glassStyle} onSetGlassStyle={(s:any) => setState({ glassStyle: s })} apiKey={state.apiKey} onSetApiKey={(k:any) => setState({ apiKey: k })} aiMode={state.aiMode} onSetAiMode={(m:any) => setState({ aiMode: m })} rituals={state.rituals} onUpdateRituals={(r:any) => setState({ rituals: r })} />}
      </main>

      {/* Undo Toast */}
      {state.recentlyDeletedTask && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-view-enter">
          <button 
            onClick={() => { undoDelete(); soundEngine.playPing(state.rituals.soundVolume); }}
            className="px-6 py-4 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center space-x-3 border border-white/10 active:scale-95 transition-transform"
          >
            <span>Task Removed</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-accent">Undo</span>
          </button>
        </div>
      )}

      {(view === 'today' || view === 'neural') && (
        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 z-40 pointer-events-none">
          <div className="card-ui ios-blur rounded-[2.5rem] p-2 flex items-center pointer-events-auto max-w-lg mx-auto shadow-2xl border-white/10">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Focus on..." className="flex-1 bg-transparent px-6 py-4 outline-none text-[16px] font-bold text-main placeholder:opacity-30" onKeyPress={e => e.key === 'Enter' && handleAIAction()} />
            <button onClick={handleAIAction} className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              )}
            </button>
          </div>
        </div>
      )}

      {ui.picker && <ModelActionSheet selected={ui.model} onSelect={(m:string) => setUi({...ui, model: m, picker: false})} onClose={() => setUi({...ui, picker: false})} volume={state.rituals.soundVolume} />}
      
      {ui.showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setUi({...ui, showHistory: false})}>
          <div className="w-full card-ui rounded-t-[3rem] p-8 pb-12 animate-view-enter shadow-2xl border-t border-black/10 dark:border-white/10 h-[70vh]" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-8" />
            <h2 className="text-center font-black text-xl mb-8 uppercase tracking-widest text-main">Neural Archive</h2>
            <div className="space-y-4 overflow-y-auto scrollbar-hide flex-1 pb-10">
              {state.chats.length === 0 ? (
                <div className="text-center opacity-30 py-10 uppercase text-[10px] font-black tracking-widest">Archive Empty</div>
              ) : (
                state.chats.filter(c => c.role === 'user').map((c, i) => (
                  <div key={i} className="p-5 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5">
                    <p className="text-[10px] opacity-40 font-black uppercase mb-2">{new Date(c.timestamp).toLocaleString()}</p>
                    <p className="text-xs font-bold text-main truncate">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {ui.editingTask && <EditTaskSheet task={ui.editingTask} onUpdate={(u) => updateTask(ui.editingTask!.id, u)} onClose={() => setUi({ ...ui, editingTask: null })} volume={state.rituals.soundVolume} />}
      
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-view-enter">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
