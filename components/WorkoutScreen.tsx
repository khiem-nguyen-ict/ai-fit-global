import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  calculateAngle, 
  SQUAT_DOWN_THRESHOLD, SQUAT_UP_THRESHOLD,
  PUSHUP_DOWN_THRESHOLD, PUSHUP_UP_THRESHOLD,
  LUNGE_DOWN_THRESHOLD, LUNGE_UP_THRESHOLD,
  isUserTooClose
} from '../services/poseService';
import { speak, initSpeech, createSpeechRecognition } from '../services/speechService';
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
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isPoseLoading, setIsPoseLoading] = useState(true);
  const [poseError, setPoseError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [userTooClose, setUserTooClose] = useState(false);
  
  const [workout, setWorkout] = useState<WorkoutState>({
    reps: 0,
    status: 'INIT',
    lastFeedback: translations[lang].ready,
    currentExercise: exercise
  });

  const t = translations[lang];

  // Initialize camera preview on mount
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (!videoRef.current || !mounted) return;
      
      try {
        // Check if mediaDevices API is available (requires secure context)
        if (!navigator.mediaDevices) {
          throw new Error('Camera access requires HTTPS or localhost. Please use a secure connection.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
        
        if (!mounted || !videoRef.current) {
          // Component unmounted, stop the stream
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = async () => {
          if (!mounted || !videoRef.current) return;
          try {
            await videoRef.current.play();
            if (mounted) {
              setCameraReady(true);
            }
          } catch (playError) {
            console.error('Video play error:', playError);
          }
        };
        
      } catch (error: any) {
        console.error('Camera initialization failed:', error);
        if (mounted) {
          setCameraReady(false);
          // Provide specific error messages for common issues
          if (error.message?.includes('HTTPS') || error.message?.includes('secure')) {
            setPoseError('Camera access requires HTTPS. Please access the site via a secure connection.');
          } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDenied') {
            setPoseError('Camera access denied. Please allow camera permissions in your browser settings.');
          } else if (error.name === 'NotFoundError') {
            setPoseError('No camera found. Please connect a camera and try again.');
          } else {
            setPoseError('Camera access denied. Please allow camera access or use HTTPS.');
          }
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Load pose detection model on mount
  useEffect(() => {
    let mounted = true;
    
    const loadPose = async () => {
      // Wait a bit to ensure MediaPipe scripts are fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!mounted) return;
      
      try {
        setIsPoseLoading(true);
        setPoseError(null);
        
        // Check if Pose is available
        // @ts-ignore
        if (typeof window.Pose === 'undefined') {
          throw new Error('MediaPipe Pose library not loaded');
        }

        // @ts-ignore
        const pose = new window.Pose({ 
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` 
        });
        
        // Set up a promise to wait for actual initialization
        let poseReady = false;
        
        pose.setOptions({ 
          modelComplexity: 1, 
          smoothLandmarks: true, 
          minDetectionConfidence: 0.5, 
          minTrackingConfidence: 0.5 
        });

        // Set up a test callback to verify pose is actually working
        pose.onResults((results: any) => {
          if (!poseReady) {
            poseReady = true;
            console.log('Pose detection initialized successfully');
          }
        });

        // Send a test frame to trigger initialization
        if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = 10;
          canvas.height = 10;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, 10, 10);
            try {
              await pose.send({ image: canvas });
            } catch (e) {
              console.log('Test frame send error (expected):', e);
            }
          }
        }

        // Wait for pose to actually be ready (max 5 seconds)
        let waited = 0;
        while (!poseReady && waited < 5000 && mounted) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waited += 100;
        }

        if (!mounted) {
          pose.close();
          return;
        }

        // Final delay to ensure everything is stable
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!mounted) {
          pose.close();
          return;
        }

        poseRef.current = pose;
        console.log('Pose service fully loaded and ready');
        setIsPoseLoading(false);
        setPoseError(null);
      } catch (error) {
        console.error('Pose loading failed:', error);
        if (mounted) {
          setPoseError('Failed to load pose detection. Please refresh the page.');
          setIsPoseLoading(false);
        }
      }
    };

    loadPose();

    return () => {
      mounted = false;
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (e) {
          console.log('Pose cleanup error:', e);
        }
      }
    };
  }, []);

  const handleStartWorkout = useCallback(() => {
    if (!poseRef.current || isPoseLoading || !cameraReady) {
      console.log('Cannot start: pose or camera not ready', { 
        hasPose: !!poseRef.current, 
        isPoseLoading, 
        cameraReady 
      });
      return;
    }
    
    setIsCountingDown(true);
    setCountdown(3);
    
    // Small delay to let speech init complete, then start countdown
    setTimeout(() => {
      speak("3", lang);
    }, 100);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next > 0) {
          speak(`${next}`, lang);
        } else if (next === 0) {
          speak(t.workoutStart, lang);
        }
        return next;
      });
    }, 1000);
    
    // After 3 seconds, start the workout
    setTimeout(() => {
      clearInterval(countdownInterval);
      setIsCountingDown(false);
      setIsActive(true);
    }, 3000);
  }, [lang, t, isPoseLoading, cameraReady]);

  const startVoiceSystem = useCallback(() => {
    if (recognitionRef.current) return;

    const recognition = createSpeechRecognition((cmd) => {
      const match = (list: string[]) => list.some(word => cmd.includes(word));
      
      // Listen for "start" command to trigger workout
      if (match(t.cmd_start)) {
        if (!isActive && !isCountingDown && !isPoseLoading && cameraReady) {
          handleStartWorkout();
        }
      }
      
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
        if (!voiceError) {
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
  }, [lang, t, onExerciseChange, voiceError, isActive, isCountingDown, isPoseLoading, cameraReady, handleStartWorkout]);

  // Start voice recognition when component mounts
  useEffect(() => {
    // Initialize speech and start voice system after a short delay
    const timer = setTimeout(() => {
      initSpeech();
      startVoiceSystem();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startVoiceSystem]);

  useEffect(() => {
    setWorkout(prev => ({ ...prev, reps: 0, status: 'INIT', currentExercise: exercise }));
    if (isActive) speak(t[exercise], lang);
  }, [exercise, lang, isActive, t]);

  // Control background music based on workout state
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    if (isActive) {
      // Small delay to ensure previous pause completes
      const playTimeout = setTimeout(() => {
        audio.play().catch(err => {
          // Ignore if error is due to rapid pause/play
          if (!err.message?.includes('interrupted')) {
            console.log('Audio play error:', err);
          }
        });
      }, 100);
      
      return () => clearTimeout(playTimeout);
    } else {
      // Pause and reset
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0;
    }
  }, [isActive]);

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

      // Check if user is too close to camera
      const frameWidth = canvasRef.current.width;
      const frameHeight = canvasRef.current.height;
      const tooClose = isUserTooClose(results.poseLandmarks, frameWidth, frameHeight);
      setUserTooClose(tooClose);

      // If user is too close, don't count reps and show feedback
      if (tooClose) {
        setWorkout(prev => {
          if (prev.lastFeedback !== t.tooClose) {
            speak(t.tooClose, lang);
            return { ...prev, status: 'INIT', lastFeedback: t.tooClose };
          }
          return prev;
        });
        canvasCtx.restore();
        return;
      }

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
        let shouldSpeak = false;
        let message = '';

        if (angle < downThresh && prev.status !== 'DOWN') {
          newStatus = 'DOWN';
          shouldSpeak = true;
          message = t.up;
        } 
        
        if (angle > upThresh && prev.status === 'DOWN') {
          newStatus = 'UP';
          newReps += 1;
          shouldSpeak = true;
          
          // Prepare the rep count message
          message = `${newReps}`;
          
          // Check for milestones
          if (newReps === 5) {
            message = t.milestone5;
          } else if (newReps === 10) {
            message = t.milestone10;
          } else if (newReps === 15) {
            message = t.milestone15;
          } else if (newReps === 20) {
            message = t.milestone20;
          } else if (newReps === 25) {
            message = t.milestone25;
          } else if (newReps % 5 !== 0) {
            // Add random encouragement for non-milestone reps
            const encouragement = t.encouragements[Math.floor(Math.random() * t.encouragements.length)];
            message = `${newReps}. ${encouragement}`;
          }
        }

        // Only speak if status actually changed
        if (newStatus !== prev.status || newReps !== prev.reps) {
          if (shouldSpeak && message) {
            // Speak only once per state change
            speak(message, lang);
          }
          return { ...prev, status: newStatus, reps: newReps };
        }
        return prev;
      });
    }
    canvasCtx.restore();
  }, [lang, t, exercise, userTooClose]);

  useEffect(() => {
    if (!isActive || !poseRef.current || !videoRef.current) return;

    const pose = poseRef.current;
    pose.onResults(onResults);

    let camera: any = null;
    let animationFrameId: number | null = null;
    
    const startCamera = async () => {
      try {
        // @ts-ignore
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => { 
            if (videoRef.current && isActive) {
              await pose.send({ image: videoRef.current }); 
            }
          },
          width: 1280, 
          height: 720
        });
        await camera.start();
        cameraRef.current = camera;
      } catch (error) {
        console.error('Camera start error:', error);
      }
    };

    startCamera();

    return () => { 
      if (camera) {
        try {
          camera.stop();
        } catch (e) {
          console.log('Camera stop error:', e);
        }
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, onResults]);

  const handleManualStart = () => {
    // Initialize speech synthesis on user click (required for Chrome)
    initSpeech();
    handleStartWorkout();
  };

  const isStartDisabled = isPoseLoading || !cameraReady || !!poseError;

  return (
    <div className="relative w-full flex-1 min-h-0 bg-black rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] border-4 border-white/10 ring-1 ring-white/10 transition-all duration-700">
      {/* Background Music */}
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
        onLoadedData={() => {
          if (audioRef.current) {
            audioRef.current.volume = 0.3; // Set volume to 30%
          }
        }}
      >
        <source src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Video preview - visible when not active */}
      <video 
        ref={videoRef} 
        className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] ${isActive ? 'hidden' : 'block'}`}
        playsInline 
      />
      
      {/* Canvas for pose detection - visible when active */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] ${isActive ? 'block' : 'hidden'}`}
        width={1280}
        height={720}
      />
      
      {/* Exercise Title Overlay (Bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/60 backdrop-blur-3xl px-8 py-3 rounded-2xl border-2 border-white/20 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
            {t[exercise]}
          </h2>
        </div>
      </div>

      {/* Voice Status Indicator (Top Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/20 z-40">
        <div className={`w-4 h-4 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : (voiceError ? 'bg-orange-500' : 'bg-gray-600')}`}></div>
        <span className="text-sm font-black text-white uppercase tracking-wider">
          {voiceError ? 'MIC ERROR' : (isListening ? 'LISTENING' : 'VOICE OFF')}
        </span>
      </div>

      {/* Countdown Overlay */}
      {isCountingDown && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl z-50">
          <div className="text-[12rem] md:text-[16rem] font-black text-white animate-pulse drop-shadow-[0_0_60px_rgba(99,102,241,0.8)]">
            {countdown > 0 ? countdown : '🏃'}
          </div>
          <p className="text-3xl md:text-4xl font-bold text-indigo-400 uppercase tracking-wider mt-4">
            {countdown > 0 ? 'Get Ready!' : 'GO!'}
          </p>
        </div>
      )}

      {/* Intro Overlay */}
      {!isActive && !isCountingDown && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
              {t[exercise]}
            </h2>
            
            {poseError && !cameraReady ? (
              <div className="mb-6 bg-red-900/80 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-red-500">
                <p className="text-xl font-bold text-red-200 uppercase mb-3">⚠️ {poseError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3 rounded-xl font-black uppercase transition-all"
                >
                  Refresh Page
                </button>
              </div>
            ) : poseError && cameraReady ? (
              <div className="mb-6 bg-red-900/80 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-red-500">
                <p className="text-xl font-bold text-red-200 uppercase mb-3">⚠️ Pose Detection Error</p>
                <p className="text-sm text-red-300 mb-3">{poseError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3 rounded-xl font-black uppercase transition-all"
                >
                  Refresh Page
                </button>
              </div>
            ) : isPoseLoading ? (
              <div className="mb-8 bg-indigo-900/80 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-indigo-400">
                <p className="text-2xl font-bold text-indigo-200 uppercase mb-2">Loading Pose Detection...</p>
                <div className="w-64 h-2 bg-indigo-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 animate-pulse w-3/4"></div>
                </div>
              </div>
            ) : !cameraReady ? (
              <div className="mb-8 bg-yellow-900/80 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-yellow-400">
                <p className="text-2xl font-bold text-yellow-200 uppercase">Initializing Camera...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-green-900/60 backdrop-blur-md px-6 py-3 rounded-xl border-2 border-green-400">
                  <p className="text-xl font-bold text-green-200 uppercase">✓ Position yourself in frame</p>
                </div>
                
                {voiceError === 'mic-denied' ? (
                  <div className="mb-6 bg-orange-900/80 backdrop-blur-md px-8 py-4 rounded-xl border-2 border-orange-500">
                    <p className="text-xl font-bold text-orange-200 uppercase mb-3">Microphone Access Denied</p>
                    <p className="text-sm text-orange-300 mb-3">Voice commands won't work, but you can still use the button</p>
                  </div>
                ) : (
                  <p className="text-2xl md:text-3xl font-bold text-indigo-400 mb-2 uppercase animate-pulse drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">
                    {t.voiceCommands}
                  </p>
                )}
                
                <p className="text-lg md:text-xl font-bold text-white/80 mb-8 uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                  Say "Start" or click below
                </p>
              </>
            )}

            <button
              onClick={handleManualStart}
              disabled={isStartDisabled}
              className={`text-2xl md:text-3xl px-12 py-6 rounded-2xl font-black uppercase tracking-wider shadow-[0_0_60px_rgba(255,255,255,0.4)] transform transition-all ${
                isStartDisabled 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-white text-black hover:scale-110 active:scale-95 cursor-pointer'
              }`}
            >
              {isPoseLoading ? 'Please Wait...' : (!cameraReady ? 'Please Wait...' : t.start)}
            </button>
        </div>
      )}

      {/* Rep Count Overlay */}
      {isActive && (
        <>
          <RepDisplay 
            count={workout.reps} 
            status={workout.status} 
            label={t.reps} 
            statusLabel={t.status}
          />
          
          {/* Too Close Warning Overlay */}
          {userTooClose && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-40">
              <div className="bg-red-600/90 backdrop-blur-md px-8 py-6 rounded-2xl border-4 border-red-400 shadow-2xl animate-pulse">
                <p className="text-4xl font-black text-white uppercase tracking-wider mb-2">⚠️ {t.tooClose}
                </p>
                <p className="text-lg font-bold text-white/80 mt-3 uppercase tracking-wide text-center">
                  Step back to fit your whole body in frame
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkoutScreen;