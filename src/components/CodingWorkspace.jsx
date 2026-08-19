import React, { useState } from 'react';
import { Code2, Play, Terminal as TerminalIcon, GitBranch, AlertCircle, FileCode, CheckCircle2, RefreshCw } from 'lucide-react';

export default function CodingWorkspace({ projectContext, onRunDiagnostics, onRunTests }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const mockProject = projectContext || {
    name: 'Friday Desktop AI Voice Companion',
    path: window.location.origin,
    techStack: ['Grok AI', 'Gemini', 'Node.js', 'React', 'Vite', 'Playwright', 'Express'],
    gitBranch: 'main',
    gitStatus: 'Clean',
    lastError: null,
    recentFiles: ['package.json', 'src/App.jsx', 'server/index.js', 'src/components/FridayOrb.jsx']
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="glass-panel p-6 border-l-4 border-l-cyan-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan font-mono">Coding Companion Mode</span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" /> {mockProject.gitBranch}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" /> {mockProject.name}
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">{mockProject.path}</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onRunDiagnostics}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Project</span>
          </button>
          <button 
            onClick={onRunTests}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Tests</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Tech Stack & Files */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" /> Active Workspace Files
          </h3>
          <div className="space-y-2">
            {mockProject.recentFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs font-mono text-slate-300 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <span>{file}</span>
                <span className="text-[10px] text-cyan-400 font-sans">Open</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Detected Tech Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              {mockProject.techStack.map((tech, idx) => (
                <span key={idx} className="badge badge-purple text-[10px]">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Column: Terminal & Error Diagnostic view */}
        <div className="md:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-purple-400" /> Diagnostics & Terminal Output
            </h3>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dev Server Active (Port 3001)
            </span>
          </div>

          {mockProject.lastError ? (
            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" /> Detected Build/Compiler Error
              </div>
              <pre className="text-xs font-mono text-rose-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
                {mockProject.lastError}
              </pre>
              <button className="btn-primary text-xs mt-2">
                Ask Friday to Fix This Error
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-slate-300 space-y-1.5 h-64 overflow-y-auto">
              <p className="text-slate-500">// Terminal output feed...</p>
              <p className="text-emerald-400">[INFO] Vite server running at http://localhost:5173</p>
              <p className="text-cyan-400">[INFO] Express backend running at http://localhost:3001</p>
              <p className="text-purple-400">[INFO] Grok AI + Gemini Task Deduction Engine ready</p>
              <p className="text-slate-400">[INFO] Friday Voice VAD active ("Hey Friday")</p>
              <p className="text-slate-300">$ npm run dev</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
