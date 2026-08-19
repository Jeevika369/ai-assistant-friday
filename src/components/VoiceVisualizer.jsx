import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

export default function VoiceVisualizer({ isListening, audioLevel, isMuted, onToggleListen, micError }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 my-4">
      {/* Dynamic Sound Wave Bars */}
      <div className="flex items-center justify-center gap-1.5 h-10 px-6 py-2 bg-slate-900/60 rounded-full border border-white/10 backdrop-blur-md">
        {[
          'animate-wave-1',
          'animate-wave-2',
          'animate-wave-3',
          'animate-wave-4',
          'animate-wave-5',
        ].map((anim, idx) => (
          <div
            key={idx}
            className={`w-1 rounded-full transition-all duration-150 ${
              isListening && !isMuted
                ? 'bg-gradient-to-t from-cyan-400 to-purple-500 shadow-md shadow-cyan-500/50'
                : 'bg-slate-700 h-1.5'
            } ${isListening && !isMuted ? anim : ''}`}
            style={{
              height: isListening && !isMuted ? `${Math.max(6, audioLevel * 36)}px` : '6px'
            }}
          />
        ))}
      </div>

      {/* Voice Status Pill Button */}
      <button
        onClick={onToggleListen}
        className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-full font-medium text-xs tracking-wide transition-all duration-300 shadow-lg ${
          isListening && !isMuted
            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-cyan-500/30 hover:scale-105'
            : micError
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-slate-800/80 text-slate-300 border border-white/10 hover:bg-slate-700'
        }`}
      >
        <div className={`p-1 rounded-full ${isListening && !isMuted ? 'bg-white/20 animate-pulse' : 'bg-slate-700'}`}>
          {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-cyan-300" />}
        </div>
        <span>
          {micError ? micError : isListening ? 'Listening for "Hey Friday"...' : 'Click to Enable Mic Voice'}
        </span>
      </button>
    </div>
  );
}
