import React, { useState } from 'react';
import { Terminal, Clock, CheckCircle2, AlertTriangle, Shield, Trash2, Filter } from 'lucide-react';

export default function AuditLogView({ auditLogs, onClearLogs }) {
  const [filterLevel, setFilterLevel] = useState('ALL');

  const mockLogs = auditLogs || [
    { id: 'log_1', timestamp: '13:17:45', action: 'SYSTEM_STARTUP', tool: 'FridayCore', status: 'SUCCESS', details: 'FRIDAY Desktop AI Core initialized with Grok + Gemini' },
    { id: 'log_2', timestamp: '13:18:00', action: 'LAUNCH_APP', tool: 'open_application', status: 'SUCCESS', details: 'Launched VS Code (Executable: code.cmd)' },
    { id: 'log_3', timestamp: '13:18:15', action: 'BROWSER_SEARCH', tool: 'browser_search', status: 'SUCCESS', details: 'Playwright searched Google for "React documentation"' },
    { id: 'log_4', timestamp: '13:18:30', action: 'TERMINAL_EXECUTE', tool: 'run_terminal', status: 'SUCCESS', details: 'Executed "npm run dev" in workspace directory' },
    { id: 'log_5', timestamp: '13:18:45', action: 'MEMORY_SYNC', tool: 'memoryStore', status: 'SUCCESS', details: 'Persisted project state and working memory' },
  ];

  const filteredLogs = mockLogs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.status === filterLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-purple-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-purple font-mono">Immutable Audit Log</span>
            <span className="text-xs text-slate-400">Local Activity Recording</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-purple-400" /> Action Execution Audit Feed
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Every tool invocation, command execution, and browser interaction is logged locally for full operational transparency.
          </p>
        </div>

        <button 
          onClick={onClearLogs}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
                <th className="p-3">Tool</th>
                <th className="p-3">Details</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors text-slate-300">
                  <td className="p-3 text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {log.timestamp}
                  </td>
                  <td className="p-3 font-semibold text-cyan-300">{log.action}</td>
                  <td className="p-3 text-purple-300">{log.tool}</td>
                  <td className="p-3 text-slate-300 max-w-md truncate">{log.details}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
