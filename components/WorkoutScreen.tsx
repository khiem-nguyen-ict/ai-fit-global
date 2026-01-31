
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  calculateAngle, 
  SQUAT_DOWN_THRESHOLD, SQUAT_UP_THRESHOLD,
  PUSHUP_DOWN_THRESHOLD, PUSHUP_UP_THRESHOLD,
  LUNGE_DOWN_THRESHOLD, LUNGE_UP_THRESHOLD
} from '../services/poseService';
import { speak, createSpeechRecognition } from '../services/speechService';
import { translations } from '../i18n';
import { Language, WorkoutState, ExerciseType } from '../types';
import RepDisplay from './RepDisplay';

interface WorkoutScreenProps {
  lang: Language;
  exercise: ExerciseType;
  onExerciseChange: (ex: ExerciseType) => void;
}

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ lang, exercise, onExerciseChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const [workout, setWorkout] = useState<WorkoutState>({
    reps: 0,
    status: 'INIT',
    lastFeedback: translations[lang].ready,
    currentExercise: exercise
  });

  const t = translations[lang];

  const startVoiceSystem = useCallback(() => {
    if (recognitionRef.current) return;

    const recognition = createSpeechRecognition((cmd) => {
      const match = (list: string[]) => list.some(word => cmd.includes(word));
      if (match(t.cmd_start)) setIsActive(true);
      if (match(t.cmd_stop)) setIsActive(false);
      if (match(t.cmd_squat)) onExerciseChange(ExerciseType.SQUAT);
      if (match(t.cmd_pushup)) onExerciseChange(ExerciseType.PUSH_UP);
      if (match(t.cmd_lunge)) onExerciseChange(ExerciseType.LUNGE);
    });

    if (recognition) {
      recognition.lang = lang;
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') setVoiceError('mic-denied');
        setIsListening(false);
      };
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };
      recognition.onend = () => {
        if (isActive || !voiceError) {
          try { recognition.start(); } catch(e) {}
        }
      };
      
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error("Speech start failed", e);
      }
    }
  }, [lang, t, onExerciseChange, isActive, voiceError]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    setWorkout(prev => ({ ...prev, reps: 0, status: 'INIT', currentExercise: exercise }));
    if (isActive) speak(t[exercise], lang);
  }, [exercise, lang, isActive]);

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (results.poseLandmarks) {
      // @ts-ignore
      window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#00F0FF', lineWidth: 6 });
      // @ts-ignore
      window.drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF00A8', lineWidth: 3, radius: 6 });

      let angle = 180;
      let downThresh = 0;
      let upThresh = 180;

      switch (exercise) {
        case ExerciseType.SQUAT:
          angle = calculateAngle(results.poseLandmarks[23], results.poseLandmarks[25], results.poseLandmarks[27]);
          downThresh = SQUAT_DOWN_THRESHOLD;
          upThresh = SQUAT_UP_THRESHOLD;
          break;
        case ExerciseType.PUSH_UP:
          angle = calculateAngle(results.poseLandmarks[11], results.poseLandmarks[13], results.poseLandmarks[15]);
          downThresh = PUSHUP_DOWN_THRESHOLD;
          upThresh = PUSHUP_UP_THRESHOLD;
          break;
        case ExerciseType.LUNGE:
          angle = calculateAngle(results.poseLandmarks[23], results.poseLandmarks[25], results.poseLandmarks[27]);
          downThresh = LUNGE_DOWN_THRESHOLD;
          upThresh = LUNGE_UP_THRESHOLD;
          break;
      }

      setWorkout(prev => {
        let newStatus = prev.status;
        let newReps = prev.reps;

        if (angle < downThresh && prev.status !== 'DOWN') {
          newStatus = 'DOWN';
          speak(t.up, lang);
        } 
        
        if (angle > upThresh && prev.status === 'DOWN') {
          newStatus = 'UP';
          newReps += 1;
          speak(`${newReps}`, lang);
        }

        if (newStatus !== prev.status || newReps !== prev.reps) {
          return { ...prev, status: newStatus, reps: newReps };
        }
        return prev;
      });
    }
    canvasCtx.restore();
  }, [lang, t, exercise]);

  useEffect(() => {
    if (!isActive) return;
    // @ts-ignore
    const pose = new window.Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    pose.onResults(onResults);

    let camera: any = null;
    if (videoRef.current) {
      // @ts-ignore
      camera = new window.Camera(videoRef.current, {
        onFrame: async () => { if (videoRef.current) await pose.send({ image: videoRef.current }); },
        width: 1280, height: 720
      });
      camera.start();
    }
    return () => { if (camera) camera.stop(); pose.close(); };
  }, [isActive, onResults]);

  const handleManualStart = () => {
    startVoiceSystem();
    setIsActive(true);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] border-[12px] border-white/10 ring-1 ring-white/10 transition-all duration-700">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        width={1280}
        height={720}
      />
      
      {/* Exercise Title Overlay (Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/60 backdrop-blur-3xl px-12 py-6 rounded-[3rem] border-2 border-white/20 shadow-2xl">
          <h2 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
            {t[exercise]}
          </h2>
        </div>
      </div>

      {/* Voice Status Indicator (Top Right) */}
      <div className="absolute top-8 right-8 flex items-center gap-4 bg-black/40 backdrop-blur-2xl px-6 py-4 rounded-full border border-white/20 z-40">
        <div className={`w-6 h-6 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : (voiceError ? 'bg-orange-500' : 'bg-gray-600')}`}></div>
        <span className="text-xl font-black text-white uppercase tracking-[0.2em]">
          {voiceError ? 'MIC ERROR' : (isListening ? 'LISTENING' : 'VOICE OFF')}
        </span>
      </div>

      {/* Intro Overlay */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl z-50 p-6 text-center">
            <h2 className="text-7xl md:text-[8rem] font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
              {t[exercise]}
            </h2>
            
            {voiceError === 'mic-denied' ? (
              <div className="mb-8">
                 <p className="text-2xl font-bold text-red-400 uppercase mb-4">Microphone Access Denied</p>
                 <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white text-xl px-10 py-4 rounded-2xl font-black uppercase"
                 >
                   Refresh & Allow Mic
                 </button>
              </div>
            ) : (
              <p className="text-3xl md:text-5xl font-bold text-indigo-400 mb-12 uppercase animate-pulse">
                 {t.voiceCommands}
              </p>
            )}

            <button
              onClick={handleManualStart}
              className="bg-white text-black text-3xl md:text-4xl px-16 py-8 rounded-[3rem] font-black uppercase tracking-[0.2em] shadow-[0_0_60px_rgba(255,255,255,0.4)] transform hover:scale-110 active:scale-95 transition-all"
            >
              {t.start}
            </button>
        </div>
      )}

      {/* Rep Count Overlay */}
      {isActive && (
        <RepDisplay 
          count={workout.reps} 
          status={workout.status} 
          label={t.reps} 
          statusLabel={t.status}
        />
      )}
    </div>
  );
};

export default WorkoutScreen;
