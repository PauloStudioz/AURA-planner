
import React, { useState } from 'react';
import { AILevel } from '../../types';
import { soundEngine } from '../../services/soundService';

interface SettingsViewProps {
  theme: string;
  onSetTheme: (t: string) => void;
  accentColor: string;
  onSetAccent: (c: string) => void;
  glassStyle: string;
  onSetGlassStyle: (s: any) => void;
  apiKey: string | null;
  onSetApiKey: (k: string) => void;
  aiMode: AILevel;
  onSetAiMode: (m: AILevel) => void;
  rituals: any;
  onUpdateRituals: (updates: any) => void;
}

const PRESET_ACCENTS = [
  { id: 'blue', color: '#007AFF' },
  { id: 'purple', color: '#AF52DE' },
  { id: 'pink', color: '#FF2D55' },
  { id: 'emerald', color: '#34C759' },
  { id: 'amber', color: '#FF9500' },
  { id: 'crimson', color: '#FF3B30' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  theme, onSetTheme, accentColor, onSetAccent, glassStyle, onSetGlassStyle, apiKey, onSetApiKey, rituals, onUpdateRituals 
}) => {
  const [customHex, setCustomHex] = useState(accentColor.startsWith('#') ? accentColor : '');

  const handleCustomColor = (val: string) => {
    setCustomHex(val);
    if (val.length >= 4 && /^#([A-Fa-f0-9]{3}){1,2}$/.test(val)) {
      onSetAccent(val);
    }
  };

  return (
    <div className="animate-view-enter space-y-10 pb-48 pt-4">
      <section>
        <h3 className="protocol-label mb-6 ml-4">Environment</h3>
        <div className="card-ui rounded-[2.5rem] p-2 flex bg-black/5 dark:bg-white/5 border-none">
          {['light', 'glass', 'midnight'].map(t => (
            <button key={t} onClick={() => { onSetTheme(t); soundEngine.playClick(rituals.soundVolume); }} 
              className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${theme === t ? 'segment-active' : 'opacity-40 text-main'}`}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {theme === 'glass' && (
        <section className="animate-view-enter">
          <h3 className="protocol-label mb-6 ml-4">Glass Physics</h3>
          <div className="card-ui rounded-[2.5rem] p-2 flex bg-black/5 dark:bg-white/5 border-none">
            {['pure', 'deep', 'prism', 'fusion'].map(s => (
              <button key={s} onClick={() => { onSetGlassStyle(s); soundEngine.playClick(rituals.soundVolume); }} 
                className={`flex-1 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-tight transition-all ${glassStyle === s ? 'segment-active' : 'opacity-40 text-main'}`}>
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="protocol-label mb-6 ml-4">Aura Hue</h3>
        <div className="card-ui rounded-[3rem] p-8 space-y-10">
          <div className="grid grid-cols-6 gap-3">
            {PRESET_ACCENTS.map(acc => (
              <button key={acc.id} onClick={() => onSetAccent(acc.id)}
                className={`w-full aspect-square rounded-full transition-all flex items-center justify-center ${accentColor === acc.id ? 'scale-110 shadow-lg' : 'opacity-40 scale-90'}`}
                style={{ backgroundColor: acc.color }}>
                {accentColor === acc.id && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-md" />}
              </button>
            ))}
          </div>

          <div className="space-y-6 pt-2 border-t border-black/5 dark:border-white/5">
            <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Custom Chroma (HEX)</label>
            <div className="flex items-center space-x-4">
              <input 
                value={customHex}
                onChange={e => handleCustomColor(e.target.value)}
                placeholder="#HEXCODE"
                className="flex-1 input-ui p-6 font-mono text-xs tracking-widest outline-none focus:border-accent"
              />
              <div 
                className="w-16 h-16 rounded-2xl shadow-inner border border-black/5 dark:border-white/10" 
                style={{ backgroundColor: accentColor.startsWith('#') ? accentColor : (PRESET_ACCENTS.find(p => p.id === accentColor)?.color || '#007AFF') }} 
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="protocol-label mb-6 ml-4">Feedback Engine</h3>
        <div className="card-ui rounded-[3rem] p-9 space-y-10">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-main">Acoustics</span>
            <button onClick={() => onUpdateRituals({...rituals, soundEnabled: !rituals.soundEnabled})}
              className={`w-14 h-8 rounded-full transition-all relative ${rituals.soundEnabled ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'}`}>
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${rituals.soundEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="relative pt-2">
            <input type="range" min="0" max="1" step="0.01" value={rituals.soundVolume} onChange={e => onUpdateRituals({...rituals, soundVolume: parseFloat(e.target.value)})}
              className="w-full h-1.5 appearance-none bg-black/5 dark:bg-white/10 rounded-full accent-accent" />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6 ml-4 mr-4">
            <h3 className="protocol-label !mb-0">Neural Enclave</h3>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center space-x-1"
            >
              <span>Get API Key</span>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
        </div>
        <div className="card-ui rounded-[3rem] p-9">
          <input type="password" value={apiKey || ''} onChange={e => onSetApiKey(e.target.value)} placeholder="sk-..." 
            className="w-full input-ui p-6 font-mono text-xs outline-none focus:border-accent" />
          <p className="mt-6 text-[9px] opacity-30 font-bold text-center leading-relaxed">
            Your key is stored locally on this device.<br/>Aura never transmits your secrets.
          </p>
        </div>
      </section>
    </div>
  );
};
