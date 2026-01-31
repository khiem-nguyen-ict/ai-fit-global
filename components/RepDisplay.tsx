
import React from 'react';

interface RepDisplayProps {
  count: number;
  status: string;
  label: string;
  statusLabel: string;
}

const RepDisplay: React.FC<RepDisplayProps> = ({ count, status, label }) => {
  return (
    <div className="absolute top-6 left-6 flex flex-col items-start z-50 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] border border-white/20 flex flex-col items-center justify-center min-w-[200px] md:min-w-[240px] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <span className="text-white/50 text-xl uppercase tracking-[0.3em] font-black mb-1">{label}</span>
        <span className="text-[10rem] md:text-[12rem] font-black text-white leading-none drop-shadow-[0_0_30px_rgba(79,70,229,0.8)]">
          {count}
        </span>
        <div className={`mt-4 px-8 py-3 rounded-full border-2 transition-all duration-300 ${
          status === 'DOWN' ? 'bg-pink-600 border-pink-300 scale-105' : 'bg-indigo-600 border-indigo-400'
        }`}>
           <span className="text-white text-2xl font-black uppercase italic tracking-tighter">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default RepDisplay;
