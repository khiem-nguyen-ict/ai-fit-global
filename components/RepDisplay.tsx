
import React from 'react';

interface RepDisplayProps {
  count: number;
  status: string;
  label: string;
  statusLabel: string;
}

const RepDisplay: React.FC<RepDisplayProps> = ({ count, status, label, statusLabel }) => {
  return (
    <div className="absolute top-4 left-4 flex flex-col items-start z-50 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-2xl p-4 md:p-6 rounded-2xl border border-white/20 flex flex-col items-center justify-center min-w-[140px] md:min-w-[180px] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <span className="text-white/50 text-sm uppercase tracking-widest font-black mb-1">{label}</span>
        <span className="text-7xl md:text-8xl font-black text-white leading-none drop-shadow-[0_0_30px_rgba(79,70,229,0.8)]">
          {count}
        </span>
        <div className={`mt-3 px-6 py-2 rounded-full border-2 transition-all duration-300 ${
          status === 'DOWN' ? 'bg-pink-600 border-pink-300 scale-105' : 'bg-indigo-600 border-indigo-400'
        }`}>
           <span className="text-white text-lg font-black uppercase italic tracking-tighter">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default RepDisplay;
