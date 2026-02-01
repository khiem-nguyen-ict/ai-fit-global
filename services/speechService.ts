
import { Language } from '../types';

let lastSpokenText = '';
let lastSpokenTime = 0;
let audioContext: AudioContext | null = null;

// Initialize audio context - must be called from user interaction
export const initSpeech = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('[TTS] Audio context initialized');
  }
  
  // Also try to unlock native speech synthesis
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    synth.cancel();
    // Speak empty string to unlock
    const unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    synth.speak(unlock);
  }
};

// Play a beep sound using Web Audio API
const playBeep = (frequency: number = 440, duration: number = 200) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
};

// Speak using native speech synthesis with beep fallback
export const speak = (text: string, lang: Language) => {
  if (typeof window === 'undefined') {
    console.warn('[TTS] Window not available');
    return;
  }
  
  // Debounce: prevent duplicate calls within 300ms
  const now = Date.now();
  if (text === lastSpokenText && now - lastSpokenTime < 300) {
    console.log(`[TTS] Skipping duplicate: "${text}"`);
    return;
  }
  lastSpokenText = text;
  lastSpokenTime = now;
  
  // Play a beep for numbers (countdown and rep counts)
  if (/^\d+$/.test(text)) {
    const num = parseInt(text);
    // Higher pitch for higher numbers
    playBeep(300 + num * 50, 150);
  }
  
  // Try native speech synthesis
  if ('speechSynthesis' in window) {
    const synth = window.speechSynthesis;
    
    // Cancel any pending speech (this causes "interrupted" which is expected)
    synth.cancel();
    
    // Small delay then speak
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      
      if (voices.length > 0) {
        // Prefer a local/offline voice
        const voice = voices.find(v => v.localService && v.lang.startsWith(lang)) ||
                      voices.find(v => v.lang.startsWith(lang)) ||
                      voices.find(v => v.localService) ||
                      voices[0];
        if (voice) {
          utterance.voice = voice;
        }
      }
      
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;
      
      // Only log errors that aren't "interrupted" (which is expected when we cancel)
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error(`[TTS] Error:`, e.error);
        }
      };
      
      synth.speak(utterance);
    }, 50);
  }
};

export const createSpeechRecognition = (onResult: (command: string) => void) => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  
  recognition.onresult = (event: any) => {
    const last = event.results.length - 1;
    const command = event.results[last][0].transcript.toLowerCase().trim();
    onResult(command);
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error', event.error);
  };

  return recognition;
};
