
import React, { useState, useEffect } from 'react';
import WorkoutScreen from './components/WorkoutScreen';
import { getLocalWeather } from './services/weatherService';
import { Language, WeatherInfo, ExerciseType } from './types';
import { translations } from './i18n';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.EN);
  const [exercise, setExercise] = useState<ExerciseType>(ExerciseType.SQUAT);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    getLocalWeather().then(setWeather).catch(console.error);
  }, []);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#020203] text-white flex flex-col font-sans p-4 md:p-8 overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-950/30 via-black to-pink-950/20 -z-10"></div>

      <header className="w-full max-w-screen-xl mx-auto flex justify-between items-center mb-6 px-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic bg-white bg-clip-text text-transparent uppercase drop-shadow-xl">
            {t.welcome}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1 rounded-xl border border-indigo-500/20">
              {weather ? `${weather.temp}°C • ${weather.isCold ? t.warmupReminder : t.waterReminder}` : 'AI TRAINING'}
            </span>
          </div>
        </div>

        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as Language)}
          className="bg-white/10 border-2 border-white/20 text-white text-xl px-6 py-3 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500 outline-none uppercase font-black tracking-tighter cursor-pointer appearance-none text-center shadow-xl"
        >
          <option value={Language.EN} className="bg-black">EN</option>
          <option value={Language.VI} className="bg-black">VI</option>
          <option value={Language.FI} className="bg-black">FI</option>
        </select>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-screen-xl mx-auto gap-8 overflow-hidden">
        <WorkoutScreen 
          lang={lang} 
          exercise={exercise} 
          onExerciseChange={(ex) => setExercise(ex)}
        />

        <div className="grid grid-cols-3 gap-6 mb-4">
          {[ExerciseType.SQUAT, ExerciseType.PUSH_UP, ExerciseType.LUNGE].map((ex) => (
            <button
              key={ex}
              onClick={() => setExercise(ex)}
              className={`py-6 rounded-[2rem] border-4 transition-all font-black text-xl md:text-3xl uppercase tracking-tighter ${
                exercise === ex 
                  ? 'bg-indigo-600 text-white border-white shadow-[0_0_40px_rgba(79,70,229,0.4)] scale-105' 
                  : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10 hover:border-white/40'
              }`}
            >
              {t[ex]}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
