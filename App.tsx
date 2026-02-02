
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
    <div className="h-screen w-screen bg-[#020203] text-white flex flex-col font-sans overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-950/30 via-black to-pink-950/20 -z-10"></div>

      <header className="w-full flex justify-between items-center px-4 py-2 shrink-0">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic bg-white bg-clip-text text-transparent uppercase drop-shadow-xl">
            {t.welcome}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
            {weather ? (
              <>
                <span className="text-base md:text-lg font-bold text-white/90">
                  📍 {weather.city}, {weather.country}
                </span>
                <span className="text-sm font-black text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-xl border border-indigo-500/20">
                  {weather.temp}°C • {weather.condition}
                  {weather.windSpeed ? ` • 💨 ${weather.windSpeed} km/h` : ''}
                </span>
                <span className="text-xs font-medium text-yellow-400/80">
                  {weather.isCold ? `⚠️ ${t.warmupReminder}` : `💧 ${t.waterReminder}`}
                </span>
              </>
            ) : (
              <span className="text-sm font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-0.5 rounded-xl border border-indigo-500/20">
                Loading weather...
              </span>
            )}
          </div>
        </div>

        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as Language)}
          className="bg-white/10 border-2 border-white/20 text-white text-lg px-4 py-2 rounded-xl focus:ring-4 focus:ring-indigo-500 outline-none uppercase font-black tracking-tighter cursor-pointer appearance-none text-center shadow-xl"
        >
          <option value={Language.EN} className="bg-black">🇬🇧</option>
          <option value={Language.VI} className="bg-black">🇫🇮</option>
          <option value={Language.FI} className="bg-black">🇻🇳</option>
        </select>
      </header>

      <main className="flex-1 flex flex-col w-full gap-2 px-2 pb-2 overflow-hidden min-h-0">
        <WorkoutScreen 
          lang={lang} 
          exercise={exercise} 
          onExerciseChange={(ex) => setExercise(ex)}
        />

        <div className="grid grid-cols-3 gap-3 shrink-0 p-1">
          {[ExerciseType.SQUAT, ExerciseType.PUSH_UP, ExerciseType.LUNGE].map((ex) => (
            <button
              key={ex}
              onClick={() => setExercise(ex)}
              className={`py-3 md:py-4 rounded-xl border-2 transition-all font-black text-lg md:text-2xl uppercase tracking-tighter ${
                exercise === ex 
                  ? 'bg-indigo-600 text-white border-white shadow-[0_0_40px_rgba(79,70,229,0.4)]' 
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
