
import { Language } from '../types';

export const speak = (text: string, lang: Language) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
  if (voice) utterance.voice = voice;
  utterance.lang = lang;
  utterance.rate = 1.1;
  window.speechSynthesis.speak(utterance);
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
