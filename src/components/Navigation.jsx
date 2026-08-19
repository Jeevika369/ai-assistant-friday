import React from 'react';
import { 
  Bot, 
  Code2, 
  GraduationCap, 
  BrainCircuit, 
  ShieldCheck, 
  Terminal, 
  Mic, 
  MicOff, 
  EyeOff, 
  Monitor,
  Activity,
  Sliders
} from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  privacyMode, 
  setPrivacyMode, 
  micEnabled, 
  setMicEnabled,
  assistantState,
  onOpenScreenShare,
  onOpenVoiceSettings
}) {
  const tabs = [
    { id: 'assistant', label: 'FRIDAY Companion', icon: Bot },
    { id: 'coding', label: 'Coding Workspace', icon: Code2 },
    { id: 'dsa', label: 'Teaching & DSA', icon: GraduationCap },
    { id: 'memory', label: 'Memory', icon: BrainCircuit },
    { id: 'permissions', label: 'Security', icon: ShieldCheck },
    { id: 'logs', label: 'Audit Logs', icon: Terminal },
  ];

  return (
    <header className="glass-panel px-6 py-3.5 mb-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10 shadow-2xl">
      {/* Brand Logo & Live Status */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer" onClick={() => setActiveTab('assistant')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center font-extrabold text-sm text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform tracking-wider">
            FRIDAY
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
            privacyMode ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
          }`} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-wide text-white font-sans flex items-center gap-1.5">
              FRIDAY ASSISTANT
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              GROK + GEMINI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">{privacyMode ? 'PRIVACY MODE' : assistantState}</span>
          </p>
        </div>
      </div>

      {/* Futuristic Nav Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Voice & Speed Tuning Button */}
        <button
          onClick={onOpenVoiceSettings}
          title="Voice Settings & Human Speech Speed"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Voice</span>
        </button>

        {/* Screen Share / Vision Button */}
        <button
          onClick={onOpenScreenShare}
          title="Share Screen Frame with Friday Vision"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Share Screen</span>
        </button>

        {/* Mic Toggle */}
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
          className={`p-2.5 rounded-xl border transition-all duration-200 ${
            micEnabled
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 shadow-md shadow-cyan-500/10'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
        >
          {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Privacy Toggle */}
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            privacyMode
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/20'
              : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>{privacyMode ? 'PRIVACY' : 'PRIVACY'}</span>
        </button>
      </div>
    </header>
  );
}
