import { motion } from 'motion/react';
import { ArrowLeft, Zap, Flame, Compass, Skull } from 'lucide-react';
import { Difficulty } from '../types';
import { playClick } from '../utils/audio';

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export default function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  const options = [
    {
      id: 'EASY' as Difficulty,
      title: 'Easy Mode 🌿',
      desc: 'Slower bamboo, wider gaps. Perfect for warm-ups.',
      icon: Compass,
      color: 'from-emerald-500/15 to-emerald-400/5',
      iconColor: 'text-emerald-600',
      text: 'text-rose-950',
      bg: 'bg-white/80 hover:bg-white border-rose-100 hover:border-emerald-300 hover:shadow-[0_6px_20px_rgba(16,185,129,0.12)]'
    },
    {
      id: 'MEDIUM' as Difficulty,
      title: 'Medium Mode 🍃',
      desc: 'Balanced speed and challenge. The classic flap.',
      icon: Zap,
      color: 'from-amber-500/15 to-amber-400/5',
      iconColor: 'text-amber-600',
      text: 'text-rose-950',
      bg: 'bg-white/80 hover:bg-white border-rose-100 hover:border-amber-300 hover:shadow-[0_6px_20px_rgba(245,158,11,0.12)]'
    },
    {
      id: 'HARD' as Difficulty,
      title: 'Hard Mode 🔥',
      desc: 'Fast forest, tight gaps. Only for panda pros.',
      icon: Flame,
      color: 'from-rose-500/15 to-rose-400/5',
      iconColor: 'text-rose-600',
      text: 'text-rose-950',
      bg: 'bg-white/80 hover:bg-white border-rose-100 hover:border-rose-300 hover:shadow-[0_6px_20px_rgba(244,63,94,0.12)]'
    },
    {
      id: 'INSANE' as Difficulty,
      title: 'Insane Mode ☠️',
      desc: 'Hyperspeed bamboo, razor-thin gaps. Extreme reflexes!',
      icon: Skull,
      color: 'from-red-950/20 to-red-900/5',
      iconColor: 'text-red-700',
      text: 'text-red-950 font-black',
      bg: 'bg-red-50/70 hover:bg-red-50 border-red-200 hover:border-red-500 hover:shadow-[0_6px_20px_rgba(185,28,28,0.18)]'
    }
  ];

  const handleSelect = (diff: Difficulty) => {
    playClick();
    onSelect(diff);
  };

  const handleBack = () => {
    playClick();
    onBack();
  };

  return (
    <div 
      id="difficulty-select"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-[#fff5f6] text-rose-950 p-6 select-none overflow-hidden"
    >
      {/* Background Ambience Orbs */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[100px]" />
      </div>

      {/* Top Header */}
      <div className="flex items-center space-x-4 pt-2 z-10">
        <button
          onClick={handleBack}
          className="p-2.5 bg-white/85 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-rose-600" />
        </button>
        <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950">Choose Difficulty</span>
      </div>

      {/* Main selection cards list */}
      <div className="flex flex-col flex-grow justify-center space-y-4 my-8 z-10">
        {options.map((opt, idx) => {
          const IconComponent = opt.icon;
          return (
            <motion.div
              key={opt.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 100 }}
            >
              <button
                onClick={() => handleSelect(opt.id)}
                className={`flex items-start p-4.5 w-full rounded-2xl border backdrop-blur-md text-left cursor-pointer transition-all duration-300 ${opt.bg}`}
              >
                {/* Colorful Accent Icon Frame */}
                <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.color} ${opt.iconColor} border border-rose-100 shadow-sm shrink-0 mr-4`}>
                  <IconComponent className="w-5 h-5 fill-current" />
                </div>

                {/* Card Text Content */}
                <div className="flex-grow space-y-1">
                  <h3 className={`text-sm font-black tracking-wider uppercase ${opt.text}`}>
                    {opt.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-rose-700/80 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Small informative Footer */}
      <div className="text-center pb-6 z-10">
        <p className="text-[9px] font-mono text-rose-400 tracking-[0.2em] uppercase font-bold">
          Each mode calibrates speed, gravity, and physics coefficients.
        </p>
      </div>
    </div>
  );
}
