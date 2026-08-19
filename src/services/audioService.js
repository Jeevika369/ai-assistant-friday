/**
 * AudioService - Indestructible Continuous Web Speech Engine
 * Never stops listening once activated. Auto-restarts on all ends/errors.
 * Uses 3.0s post-speech cooldown delay to eliminate self-hearing loops.
 */

export class AudioService {
  constructor(onSpeechResult, onAudioLevel, onError, onStateChange) {
    this.onSpeechResult = onSpeechResult;
    this.onAudioLevel = onAudioLevel;
    this.onError = onError;
    this.onStateChange = onStateChange;

    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.animFrameId = null;
    
    this.isMicEnabled = false;
    this.isMicPermitted = false;
    this.isMutedForTTS = false;
    this.cooldownTimer = null;
    this.restartTimer = null;

    this.initSpeechRecognition();
  }

  /**
   * Initialize Web Speech API with automatic continuous restart
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[AudioService] Web Speech API not supported in this browser.');
      if (this.onError) this.onError('Speech Recognition not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('[AudioService] Speech Recognition Active & Listening 24/7');
      if (this.onStateChange && !this.isMutedForTTS) {
        this.onStateChange('LISTENING');
      }
    };

    this.recognition.onresult = (event) => {
      // Check HARDWARE synth state: if browser is physically speaking audio, discard input!
      const isBrowserSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;

      if (this.isMutedForTTS || isBrowserSpeaking) {
        console.log('[AudioService Suppressed Hardware Self-Audio Output]');
        return;
      }

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (interim && !this.isMutedForTTS && !isBrowserSpeaking && this.onStateChange) {
        this.onStateChange('LISTENING');
      }

      if (final.trim() && !this.isMutedForTTS && !isBrowserSpeaking) {
        console.log('[AudioService Speech Final Result]:', final.trim());
        if (this.onSpeechResult) {
          this.onSpeechResult(final.trim());
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[AudioService Speech Event Error]:', event.error);
      // Auto-restart on all transient recognition errors (no-speech, network, aborted)
      if (this.isMicEnabled) {
        this.scheduleRestart();
      }
    };

    this.recognition.onend = () => {
      console.log('[AudioService] Speech Recognition cycle ended. Auto-restarting...');
      if (this.isMicEnabled) {
        this.scheduleRestart();
      } else {
        if (this.onStateChange) this.onStateChange('IDLE');
      }
    };
  }

  scheduleRestart() {
    if (!this.isMicEnabled) return;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      if (this.isMicEnabled && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Already running or starting
        }
      }
    }, 250);
  }

  /**
   * Request explicit microphone permission and start Web Audio API level monitoring
   */
  async startMicrophone() {
    try {
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      this.isMicPermitted = true;
      this.isMicEnabled = true;
      this.isMutedForTTS = false;

      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this.analyser || !this.isMicEnabled) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const isBrowserSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
        const normalizedLevel = (this.isMutedForTTS || isBrowserSpeaking) ? 0 : Math.min(1, average / 128);

        if (this.onAudioLevel) {
          this.onAudioLevel(normalizedLevel);
        }

        this.animFrameId = requestAnimationFrame(updateLevel);
      };

      if (!this.animFrameId) {
        updateLevel();
      }

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Already running
        }
      }

      if (this.onStateChange) this.onStateChange('LISTENING');
      if (this.onError) this.onError('');
      return true;
    } catch (err) {
      console.error('[AudioService] Could not access microphone:', err);
      this.isMicPermitted = false;
      this.isMicEnabled = false;
      if (this.onError) this.onError('Click Mic to grant browser permission.');
      return false;
    }
  }

  /**
   * Soft mute transcript input while MJ is speaking (TTS active)
   */
  pauseListening() {
    console.log('[AudioService] Soft muting mic listener during TTS output');
    this.isMutedForTTS = true;
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    if (this.onAudioLevel) this.onAudioLevel(0);
  }

  /**
   * Unmute transcript input after post-speech cooldown delay
   * @param {number} delayMs Cooldown delay in milliseconds (default: 3000ms)
   */
  resumeListening(delayMs = 3000) {
    console.log(`[AudioService] Setting post-speech cooldown delay: ${delayMs}ms`);
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);

    this.cooldownTimer = setTimeout(() => {
      console.log('[AudioService] Cooldown complete. Unmuting mic listener for next speech turn.');
      this.isMutedForTTS = false;
      if (this.isMicEnabled && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Already running
        }
        if (this.onStateChange) this.onStateChange('LISTENING');
      }
    }, delayMs);
  }

  /**
   * Stop microphone and recognition completely
   */
  stopMicrophone() {
    console.log('[AudioService] Stopping microphone completely');
    this.isMicEnabled = false;
    this.isMutedForTTS = false;
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    if (this.restartTimer) clearTimeout(this.restartTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onStateChange) this.onStateChange('IDLE');
    if (this.onAudioLevel) this.onAudioLevel(0);
  }
}
