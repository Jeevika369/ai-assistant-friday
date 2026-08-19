import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import FridayOrb from './components/FridayOrb';
import VoiceVisualizer from './components/VoiceVisualizer';
import ChatStream from './components/ChatStream';
import ConfirmationModal from './components/ConfirmationModal';
import ScreenShareModal from './components/ScreenShareModal';
import CodingWorkspace from './components/CodingWorkspace';
import DsaCoachView from './components/DsaCoachView';
import MemoryInspector from './components/MemoryInspector';
import PermissionManager from './components/PermissionManager';
import AuditLogView from './components/AuditLogView';
import { AudioService } from './services/audioService';
import { Sliders, Volume2, Sparkles, Check, X } from 'lucide-react';

const WAKE_WORDS = ['hi friday', 'hello friday', 'hey friday', 'okay friday', 'ok friday', 'friday', 'hi mj', 'hey mj', 'mj'];
const SLEEP_WORDS = ['thanks friday', 'thank you friday', 'bye friday', 'goodbye friday', 'sleep friday', 'activate sleep mode', 'go to sleep', 'sleep mode', 'deactivate friday', 'thanks mj', 'thank you mj'];

export default function App() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [assistantState, setAssistantState] = useState('IDLE');
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState('');
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Speech parameters tuned to normal natural human conversational speed
  const [speechRate, setSpeechRate] = useState(1.0); // 1.0x = Normal conversational human cadence (~140 wpm)
  const [speechPitch, setSpeechPitch] = useState(1.0); // 1.0x = Natural human voice tone

  const [messages, setMessages] = useState([
    {
      sender: 'friday',
      text: "Hello! I am Friday, your autonomous desktop AI companion powered by Grok AI & Gemini. Click the mic button to activate 24/7 hands-free listening! Say 'Hey Friday' to wake me up or ask me to launch apps, search, fix code, and manage your tasks.",
      timestamp: new Date().toLocaleTimeString(),
      toolExecutions: []
    }
  ]);

  const [confirmationRequest, setConfirmationRequest] = useState(null);
  const [memories, setMemories] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const wsRef = useRef(null);
  const audioServiceRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const lastFridayResponseRef = useRef(''); // Cache last Friday spoken response to prevent self-hearing echo

  // Initialize WebSockets connection to Express Backend
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:3001`;
    console.log('[Friday] Connecting to WebSocket backend:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Friday] Connected to Friday Backend Service');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        console.error('[Friday] Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[Friday] WebSocket connection closed.');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Initialize AudioService
  useEffect(() => {
    audioServiceRef.current = new AudioService(
      (speechText) => {
        handleSpeechInput(speechText);
      },
      (level) => {
        setAudioLevel(level);
      },
      (errMessage) => {
        setMicError(errMessage);
      },
      (state) => {
        setAssistantState(state);
      }
    );

    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.stopMicrophone();
      }
    };
  }, []);

  // Speech input processor with Self-Hearing Filter, Wake-Word, and Sleep-Word support
  const handleSpeechInput = (speechText) => {
    if (synthRef.current && synthRef.current.speaking) {
      console.log('[Friday Speech Engine] Suppressed speech input while TTS speaking');
      return;
    }

    const cleanLower = (speechText || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const lastLower = (lastFridayResponseRef.current || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // SELF-HEARING ECHO FILTER: Discard input if speech matches Friday's own recent response output!
    if (lastLower && (cleanLower.includes(lastLower) || lastLower.includes(cleanLower))) {
      console.log('[Friday Speech Engine] Filtered out self-hearing echo match:', cleanLower);
      return;
    }

    console.log(`[Friday Speech Engine] Input: "${speechText}" -> Clean: "${cleanLower}" (SleepMode: ${isSleepMode})`);

    // Check Interrupt Keywords
    if (cleanLower === 'wait' || cleanLower === 'stop' || cleanLower === 'quiet' || cleanLower === 'pause') {
      stopSpeaking();
      return;
    }

    // Check Sleep-Word Activation ("Thanks Friday", "Thank you Friday", "Bye Friday", "Go to sleep")
    const isSleepWordSpoken = SLEEP_WORDS.some(sw => cleanLower.includes(sw));
    if (isSleepWordSpoken) {
      setIsSleepMode(true);
      setAssistantState('IDLE');
      const sleepResponse = "You're welcome! Entering sleep mode. Say 'Hey Friday' whenever you need me!";
      speak(sleepResponse);
      return;
    }

    // Check Wake-Word Activation ("Hey Friday", "Hi Friday", "Hello Friday", "Friday")
    const isWakeWordSpoken = WAKE_WORDS.some(ww => cleanLower.includes(ww));
    if (isWakeWordSpoken || isSleepMode) {
      if (isWakeWordSpoken) {
        setIsSleepMode(false);
        let cleanCommand = cleanLower;
        WAKE_WORDS.forEach(ww => {
          cleanCommand = cleanCommand.replace(new RegExp(`^${ww}\\s*`, 'i'), '').trim();
        });

        if (cleanCommand.length > 2) {
          handleSendMessage(cleanCommand);
        } else {
          speak("I'm awake and ready. How can I assist you?");
        }
        return;
      } else if (isSleepMode) {
        console.log('[Friday Sleep Mode] Ignoring speech input until wake-word is spoken.');
        return;
      }
    }

    // Active Mode: Process Command Directly!
    setIsSleepMode(false);
    handleSendMessage(speechText);
  };

  // Toggle Microphone State with explicit User Gesture
  const handleToggleMic = async () => {
    if (privacyMode) return;

    if (micEnabled) {
      setMicEnabled(false);
      if (audioServiceRef.current) {
        audioServiceRef.current.stopMicrophone();
      }
    } else {
      setMicError('');
      if (audioServiceRef.current) {
        const success = await audioServiceRef.current.startMicrophone();
        if (success) {
          setMicEnabled(true);
          setIsSleepMode(false);
        }
      }
    }
  };

  // Handle incoming backend WS messages
  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'RESPONSE':
        setAssistantState('SPEAKING');
        const newMessage = {
          sender: 'friday',
          text: data.text,
          provider: data.provider || 'grok',
          timestamp: new Date().toLocaleTimeString(),
          toolExecutions: data.toolExecutions || []
        };
        setMessages(prev => [...prev, newMessage]);

        // Cache response text to filter out self-hearing echo
        lastFridayResponseRef.current = data.text;

        // Trigger TTS voice output at normal human conversational speed
        speak(data.text);
        break;

      case 'CONFIRMATION_REQUIRED':
        setAssistantState('WAITING_FOR_CONFIRMATION');
        setConfirmationRequest(data.request);
        break;

      case 'STATE_CHANGE':
        setAssistantState(data.state);
        break;

      case 'AUDIT_LOG':
        setAuditLogs(prev => [data.log, ...prev]);
        break;

      case 'MEMORY_UPDATE':
        setMemories(data.memories);
        break;

      case 'PERMISSIONS_UPDATE':
        setPermissions(data.permissions);
        break;

      default:
        break;
    }
  };

  // Speak text using Web Speech Synthesis tuned to NORMAL HUMAN CONVERSATIONAL SPEED & PITCH
  const speak = (text) => {
    if (!synthRef.current || privacyMode) return;
    synthRef.current.cancel();

    if (audioServiceRef.current) {
      audioServiceRef.current.pauseListening();
    }

    const cleanSpeechText = (text || '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Emojis
      .replace(/[\*\_\#\~\`\`\`\>\-\+\=]+/g, ' ') // Markdown symbols
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    // Set speech speed and pitch to normal human standards
    utterance.rate = speechRate; // Default 1.0 (Normal Human Conversational Speed)
    utterance.pitch = speechPitch; // Default 1.0 (Natural Human Pitch, non-robotic)

    const voices = synthRef.current.getVoices();

    const femaleVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      const isMale = name.includes('male') || name.includes('david') || name.includes('ravi') || name.includes('mark') || name.includes('george') || name.includes('sean') || name.includes('richard') || name.includes('stefan');
      return !isMale;
    });

    let selectedVoice = femaleVoices.find(v => 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('jenny') || 
      v.name.toLowerCase().includes('aria') || 
      v.name.toLowerCase().includes('google us english') || 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('victoria') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('karen') || 
      v.lang.includes('en-US') ||
      v.lang.includes('en-GB')
    ) || femaleVoices[0] || voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.pauseListening();
      }
    };

    utterance.onend = () => {
      setAssistantState('IDLE');
      if (audioServiceRef.current) {
        audioServiceRef.current.resumeListening(2500); // 2.5s post-speech buffer
      }
    };

    utterance.onerror = () => {
      setAssistantState('IDLE');
      if (audioServiceRef.current) {
        audioServiceRef.current.resumeListening(2500);
      }
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setAssistantState('IDLE');
      if (audioServiceRef.current) {
        audioServiceRef.current.resumeListening(500);
      }
    }
  };

  // Test Voice Function for user
  const handleTestVoice = () => {
    speak("Hello! I am Friday, speaking at a normal human conversational cadence. Ready for your command.");
  };

  // Send message to server
  const handleSendMessage = (text, imagePayload = null) => {
    const cleanLower = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const isSleepWordSpoken = SLEEP_WORDS.some(sw => cleanLower.includes(sw));
    const isWakeWordSpoken = WAKE_WORDS.some(ww => cleanLower.includes(ww));
    
    // If user says "Thanks, Friday." -> enter sleep mode
    if (isSleepWordSpoken) {
      stopSpeaking();
      const userMsg = {
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsSleepMode(true);
      setAssistantState('IDLE');
      speak("You're welcome! Going to sleep mode. Say 'Hey Friday' whenever you need me!");
      return;
    }

    // Reset sleep mode on any wake word or active command
    if (isWakeWordSpoken || isSleepMode) {
      setIsSleepMode(false);
    }

    stopSpeaking();

    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setAssistantState('THINKING');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'USER_INPUT',
        text: text,
        image: imagePayload
      }));
    } else {
      setTimeout(() => {
        handleServerMessage({
          type: 'RESPONSE',
          text: "I have received that command. Let's get to work.",
          provider: 'local-fallback',
          toolExecutions: []
        });
      }, 800);
    }
  };

  const handleAnalyzeScreen = ({ image, prompt }) => {
    setActiveTab('assistant');
    handleSendMessage(prompt, image);
  };

  const handleConfirmAction = () => {
    if (confirmationRequest && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'CONFIRM_AUTHORIZATION',
        requestId: confirmationRequest.id,
        approved: true
      }));
    }
    setConfirmationRequest(null);
    setAssistantState('WORKING');
  };

  const handleCancelAction = () => {
    if (confirmationRequest && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'CONFIRM_AUTHORIZATION',
        requestId: confirmationRequest.id,
        approved: false
      }));
    }
    setConfirmationRequest(null);
    setAssistantState('IDLE');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        micEnabled={micEnabled}
        setMicEnabled={handleToggleMic}
        assistantState={isSleepMode ? 'SLEEP MODE' : micEnabled ? 'ACTIVE & LISTENING' : assistantState}
        onOpenScreenShare={() => setIsScreenShareOpen(true)}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
      />

      {/* Confirmation Modal overlay for sensitive operations */}
      <ConfirmationModal
        confirmationRequest={confirmationRequest}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Screen Share Vision Modal */}
      <ScreenShareModal
        isOpen={isScreenShareOpen}
        onClose={() => setIsScreenShareOpen(false)}
        onAnalyzeScreen={handleAnalyzeScreen}
      />

      {/* Voice & Speech Speed Settings Modal */}
      {isVoiceSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 border border-cyan-500/40 rounded-2xl relative shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Voice & Speech Tuning</h3>
                  <p className="text-xs text-slate-400">Normal Human Cadence & Multi-Model Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVoiceSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Engine Status */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Active Reasoning Engine
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Grok AI (xAI)
                </span>
                <span className="text-slate-500 text-xs">+</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  Gemini Multi-Model
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grok AI deduces audio input into automated tasks, with Gemini for multimodal reasoning and failover.
              </p>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Speech Speed (Rate)
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {speechRate.toFixed(2)}x {speechRate === 1.0 ? '(Normal Human)' : ''}
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.75x (Calm)</span>
                <span className="text-cyan-400 font-semibold">1.0x (Normal Conversational)</span>
                <span>1.35x (Brisk)</span>
              </div>
            </div>

            {/* Speech Pitch Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Voice Pitch</span>
                <span className="font-mono text-purple-300 font-bold">
                  {speechPitch.toFixed(2)}x {speechPitch === 1.0 ? '(Natural)' : ''}
                </span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.20"
                step="0.05"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.85x (Deeper)</span>
                <span className="text-purple-400 font-semibold">1.0x (Natural Human Tone)</span>
                <span>1.20x (Higher)</span>
              </div>
            </div>

            {/* Test Voice & Close Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={handleTestVoice}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Friday Voice</span>
              </button>
              <button
                onClick={() => setIsVoiceSettingsOpen(false)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Orb & Visualizer Column */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl flex flex-col items-center justify-between border-t-2 border-t-cyan-400 min-h-[520px] shadow-2xl">
              <div className="text-center w-full">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono mb-2 inline-block ${
                  !micEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isSleepMode 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                }`}>
                  {!micEnabled 
                    ? 'CLICK MIC BUTTON TO START' 
                    : isSleepMode 
                    ? 'SLEEP MODE (Say "Hey Friday" to wake)' 
                    : 'ACTIVE & LISTENING'}
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-wide">FRIDAY COMPANION</h2>
                <p className="text-xs text-slate-400 mt-1">Autonomous Desktop AI & Grok Task Engine</p>
              </div>

              {/* Dynamic Animated Canvas Orb */}
              <div className="my-4">
                <FridayOrb state={isSleepMode ? 'IDLE' : assistantState} audioLevel={audioLevel} isMuted={privacyMode || !micEnabled || isSleepMode} />
              </div>

              {/* Voice Soundwave & Mic Controller */}
              <div className="w-full">
                <VoiceVisualizer
                  isListening={micEnabled && !isSleepMode}
                  audioLevel={audioLevel}
                  isMuted={privacyMode || isSleepMode}
                  onToggleListen={handleToggleMic}
                  micError={micError}
                />
              </div>
            </div>

            {/* Right Chat Stream Column */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-t-2 border-t-purple-500 shadow-2xl">
              <ChatStream
                messages={messages}
                onSendMessage={handleSendMessage}
                isListening={micEnabled && !isSleepMode}
                onToggleListen={handleToggleMic}
                isSpeaking={assistantState === 'SPEAKING'}
                onStopSpeaking={stopSpeaking}
                micError={micError}
              />
            </div>
          </div>
        )}

        {activeTab === 'coding' && (
          <CodingWorkspace
            onRunDiagnostics={() => handleSendMessage("Scan workspace diagnostics")}
            onRunTests={() => handleSendMessage("Run tests in terminal")}
          />
        )}

        {activeTab === 'dsa' && (
          <DsaCoachView
            onAskTopic={(topic) => {
              setActiveTab('assistant');
              handleSendMessage(topic);
            }}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryInspector
            memories={memories}
            onDeleteMemory={(id) => setMemories(prev => prev.filter(m => m.id !== id))}
            onClearAll={() => setMemories([])}
          />
        )}

        {activeTab === 'permissions' && (
          <PermissionManager
            permissions={permissions}
            onTogglePermission={(id) => {
              setPermissions(prev => prev.map(p => p.id === id ? { ...p, granted: !p.granted } : p));
            }}
          />
        )}

        {activeTab === 'logs' && (
          <AuditLogView
            auditLogs={auditLogs}
            onClearLogs={() => setAuditLogs([])}
          />
        )}
      </main>
    </div>
  );
}
