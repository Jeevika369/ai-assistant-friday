import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';

export default function ConfirmationModal({ confirmationRequest, onConfirm, onCancel }) {
  if (!confirmationRequest) return null;

  const { id, title, description, actionType, riskLevel = 'DANGEROUS', target } = confirmationRequest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-6 border-2 border-rose-500/40 shadow-2xl shadow-rose-950/50 rounded-2xl relative overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-rose font-bold tracking-wider">{riskLevel} ACTION</span>
              <span className="text-xs text-slate-400 font-mono">ID: {id || 'CONFIRM_01'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">{title || 'Confirmation Required'}</h2>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 mb-6 font-mono text-sm text-slate-300 leading-relaxed">
          <p className="mb-2 text-slate-200">{description || 'Friday is about to execute a potentially sensitive or destructive action.'}</p>
          {target && (
            <div className="mt-3 p-2.5 bg-rose-950/30 border border-rose-500/20 rounded-lg text-rose-300 text-xs break-all">
              <span className="font-semibold text-rose-400">Target: </span>{target}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary px-5 py-2.5 flex items-center gap-2 hover:border-slate-500"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-rose-500/30"
          >
            <Check className="w-4 h-4" />
            <span>Authorize Action</span>
          </button>
        </div>
      </div>
    </div>
  );
}
