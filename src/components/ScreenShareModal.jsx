import React, { useState, useRef } from 'react';
import { Monitor, Camera, X, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function ScreenShareModal({ isOpen, onClose, onAnalyzeScreen }) {
  const [screenFrame, setScreenFrame] = useState(null);
  const [promptText, setPromptText] = useState('What am I looking at? Help me analyze this screen.');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen) return null;

  const handleCaptureScreen = async () => {
    try {
      setIsCapturing(true);
      // Prefer Entire Desktop Monitor Screen by default
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          cursor: 'always'
        },
        audio: false,
        preferCurrentTab: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Create high-res canvas snapshot of entire desktop screen
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Data = canvas.toDataURL('image/jpeg', 0.85);
      setScreenFrame(base64Data);

      // Stop stream tracks
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    } catch (err) {
      console.error('[ScreenShare] Error capturing screen:', err);
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl p-6 border border-cyan-500/40 rounded-2xl relative shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">FRIDAY Vision — Entire Desktop Screen Analyzer</h3>
              <p className="text-xs text-slate-400">Select "Entire Screen" to capture your whole desktop, apps, code & active windows</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Preview Container */}
        <div className="relative aspect-video bg-slate-950 rounded-xl border border-white/10 overflow-hidden flex flex-col items-center justify-center">
          {screenFrame ? (
            <img src={screenFrame} alt="Captured Desktop Screen" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-cyan-400/40 mx-auto animate-pulse" />
              <p className="text-xs text-slate-400">Click below to capture your <strong>Entire Desktop Screen</strong></p>
              <button
                onClick={handleCaptureScreen}
                disabled={isCapturing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
              >
                {isCapturing ? 'Opening Screen Picker...' : 'Capture Entire Desktop Screen'}
              </button>
            </div>
          )}
        </div>

        {/* Question Input */}
        {screenFrame && (
          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="What would you like Friday to inspect on this desktop screen?"
              className="glass-input w-full text-xs"
            />
            <div className="flex items-center justify-between">
              <button onClick={handleCaptureScreen} className="btn-secondary text-xs">
                Recapture Screen
              </button>
              <button
                onClick={() => {
                  if (screenFrame) {
                    onAnalyzeScreen({ image: screenFrame, prompt: promptText });
                    onClose();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Friday to Analyze Desktop</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
