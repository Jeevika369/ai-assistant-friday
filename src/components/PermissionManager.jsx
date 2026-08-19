import React from 'react';
import { ShieldCheck, ShieldAlert, FileText, Terminal, Globe, Cpu, Headphones, Lock } from 'lucide-react';

export default function PermissionManager({ permissions, onTogglePermission }) {
  const defaultPermissions = permissions || [
    { id: 'FILES_READ', name: 'File Reading', description: 'Search and read project files and documents', granted: true, scope: 'SAFE', icon: FileText },
    { id: 'FILES_WRITE', name: 'File Editing', description: 'Create and modify project files and code', granted: true, scope: 'MODERATE', icon: FileText },
    { id: 'TERMINAL_EXECUTE', name: 'Terminal Execution', description: 'Run shell, npm, python, and git commands', granted: true, scope: 'DANGEROUS', icon: Terminal },
    { id: 'BROWSER_AUTOMATION', name: 'Browser Agent', description: 'Navigate, search, click, and extract web pages', granted: true, scope: 'SAFE', icon: Globe },
    { id: 'SYSTEM_CONTROL', name: 'System Operations', description: 'Launch apps, monitor RAM/CPU, volume control', granted: true, scope: 'MODERATE', icon: Cpu },
    { id: 'DEVICE_CONTROL', name: 'Connected Devices', description: 'Inspect Bluetooth, headphones, and smart devices', granted: false, scope: 'SAFE', icon: Headphones },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-emerald font-mono">Security Gatekeeper</span>
            <span className="text-xs text-slate-400">Granular User Permission Control</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> FRIDAY Permission Scopes & Risk Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Friday never performs dangerous or sensitive actions silently. Review and customize allowed capabilities.
          </p>
        </div>
      </div>

      {/* Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultPermissions.map((perm) => {
          const Icon = perm.icon;
          return (
            <div key={perm.id} className="glass-card p-5 border border-white/5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-slate-900 border border-white/10 rounded-xl text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-extrabold text-white">{perm.name}</h4>
                    <span className={`badge text-[10px] ${
                      perm.scope === 'DANGEROUS' ? 'badge-rose' :
                      perm.scope === 'MODERATE' ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {perm.scope}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{perm.description}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => onTogglePermission && onTogglePermission(perm.id)}
                className={`w-12 h-6 rounded-full transition-all relative p-1 ${
                  perm.granted ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  perm.granted ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
