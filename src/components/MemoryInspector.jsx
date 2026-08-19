import React, { useState } from 'react';
import { BrainCircuit, Search, Trash2, Plus, Clock, FolderGit2, UserCheck, HardDrive } from 'lucide-react';

export default function MemoryInspector({ memories, onAddMemory, onDeleteMemory, onClearAll }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const defaultMemories = memories || [
    { id: 'mem_1', category: 'preference', key: 'Preferred Languages', value: 'JavaScript, Python, TypeScript', timestamp: '2026-08-19 12:30' },
    { id: 'mem_2', category: 'project', key: 'Active Project', value: 'Friday Desktop AI Voice Companion', timestamp: '2026-08-19 13:10' },
    { id: 'mem_3', category: 'semantic', key: 'Workflow Preference', value: 'Prefers concise responses and automated test verification before completion', timestamp: '2026-08-19 11:00' },
    { id: 'mem_4', category: 'episodic', key: 'Core Engines', value: 'Grok AI (xAI) + Gemini Multi-Model Task Deduction', timestamp: '2026-08-19 13:15' }
  ];

  const filteredMemories = defaultMemories.filter((m) => {
    const matchesSearch = m.key.toLowerCase().includes(searchTerm.toLowerCase()) || m.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-cyan-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan font-mono">Deep Memory Engine</span>
            <span className="text-xs text-slate-400">Structured User & Project Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" /> FRIDAY Long-Term Memory & Activity Log
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Friday persists preferences, project details, and past workflows so you never need to repeat context.
          </p>
        </div>

        <button 
          onClick={onClearAll}
          className="btn-danger text-xs flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Memories</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          {['all', 'preference', 'project', 'semantic', 'episodic'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memories..."
            className="glass-input w-full pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Memory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-2 glass-card p-12 text-center text-slate-500">
            No memories match your query. Say "Remember this..." to add new preferences.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div key={mem.id} className="glass-card p-4 border border-white/5 space-y-2 relative group">
              <div className="flex items-center justify-between">
                <span className={`badge text-[10px] ${
                  mem.category === 'preference' ? 'badge-purple' :
                  mem.category === 'project' ? 'badge-cyan' : 'badge-emerald'
                }`}>
                  {mem.category}
                </span>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {mem.timestamp}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-200">{mem.key}</h4>
              <p className="text-xs font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                {mem.value}
              </p>

              <button
                onClick={() => onDeleteMemory && onDeleteMemory(mem.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 text-slate-500 hover:text-rose-400"
                title="Forget this memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
