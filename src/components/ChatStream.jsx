import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Sparkles, Wrench, Terminal, Play, Compass, Code, Cpu } from 'lucide-react';

export default function ChatStream({ 
  messages, 
  onSendMessage, 
  isListening, 
  onToggleListen, 
  isSpeaking, 
  onStopSpeaking,
  micError
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const quickPills = [
    { label: 'Launch VS Code', cmd: 'Open VS Code', icon: Code },
    { label: 'Search React Docs', cmd: 'Search Google for React docs', icon: Compass },
    { label: 'Check System RAM', cmd: 'Check system status', icon: Cpu },
    { label: 'DSA Two Sum Challenge', cmd: 'Give me a DSA challenge', icon: Play },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[480px]">
      {/* Quick Action Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Actions:
        </span>
        {quickPills.map((pill, idx) => {
          const Icon = pill.icon;
          return (
            <button
              key={idx}
              onClick={() => onSendMessage(pill.cmd)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-200 shrink-0"
            >
              <Icon className="w-3 h-3 text-cyan-400" />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-br-none'
                  : 'glass-card border border-white/10 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-75">
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  <span>{msg.sender === 'user' ? 'You' : 'FRIDAY'}</span>
                  {msg.provider && msg.sender !== 'user' && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {msg.provider}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px]">
                  {msg.timestamp || new Date().toLocaleTimeString()}
                </span>
              </div>

              {/* Text Body */}
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {msg.text}
              </p>

              {/* Tool Execution Cards */}
              {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5">
                  {msg.toolExecutions.map((tool, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-cyan-500/20 text-xs font-mono text-cyan-300"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{tool.name}</span>
                        <span className="text-slate-400 text-[10px]">({JSON.stringify(tool.args || {})})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                        tool.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Control Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5 glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl">
        {/* Voice Push-To-Talk Button */}
        <button
          type="button"
          onClick={onToggleListen}
          className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50 scale-105'
              : micError
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}
          title={isListening ? "Listening... Click to mute" : "Click to enable microphone voice input"}
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Input Text Box */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? "Listening... Speak naturally or type..." : "Ask Friday anything, launch apps, fix code, search web..."}
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 px-3 text-xs sm:text-sm font-sans"
        />

        {/* Interrupt Button */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5"
            title="Stop Friday from speaking"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Wait</span>
          </button>
        )}

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
