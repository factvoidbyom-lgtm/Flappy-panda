import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Zap, Flame, Skull, Sparkles } from 'lucide-react';
import { Difficulty, SKIN_LIST } from '../types';
import PandaAvatar from './PandaAvatar';

interface PreGameLoadingProps {
  difficulty: Difficulty;
  equippedSkinId: string;
  onComplete: () => void;
}

const TIPS = [
  "Collect coins to unlock new Pandas.",
  "Golden Bamboo gives bonus rewards.",
  "Heart Bamboo restores one ❤️.",
  "Perfect passes increase your combo.",
  "Tap with rhythm to traverse narrow bamboo gaps.",
  "Watch out for moving tempest clouds!",
  "Equip rare skins in the Panda Shop for spectacular custom visual trails."
];

export default function PreGameLoading({ difficulty, equippedSkinId, onComplete }: PreGameLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState("");

  // Select a random tip on mount
  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setCurrentTip(randomTip);
  }, []);

  // Progress simulation (takes exactly 3 seconds)
  useEffect(() => {
    const duration = 3000; // 3 seconds
    const intervalTime = 30;
    const increment = (100 / duration) * intervalTime;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Wait a tiny moment at 100% for smooth entry transition
          setTimeout(onComplete, 200);
          return 100;
        }
        return Math.min(100, prev + increment);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Find skin info
  const currentSkin = SKIN_LIST.find((s) => s.id === equippedSkinId) || SKIN_LIST[0];

  // Theme configuration for the selected difficulty
  const config = {
    EASY: {
      label: 'Easy Mode 🌿',
      icon: Compass,
      textColor: 'text-emerald-500',
      barColor: 'from-emerald-400 via-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/25'
    },
    MEDIUM: {
      label: 'Medium Mode 🍃',
      icon: Zap,
      textColor: 'text-amber-500',
      barColor: 'from-amber-400 via-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/25'
    },
    HARD: {
      label: 'Hard Mode 🔥',
      icon: Flame,
      textColor: 'text-rose-500',
      barColor: 'from-rose-400 via-rose-500 to-pink-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/25'
    },
    INSANE: {
      label: 'Insane Mode ☠️',
      icon: Skull,
      textColor: 'text-red-600',
      barColor: 'from-red-600 via-red-500 to-black',
      badgeBg: 'bg-red-500/10 border-red-500/20'
    }
  }[difficulty];

  const DifficultyIcon = config.icon;

  return (
    <div 
      id="pre-game-loading"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-slate-950 text-white p-6 select-none overflow-hidden"
    >
      {/* Background Stormy/Cosmic Ambience Orbs */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-indigo-900/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-rose-950/20 blur-[120px]" />
      </div>

      {/* Top Header Mode Indicator */}
      <div className="flex justify-between items-center z-10 pt-4">
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono font-black">SYSTEM STATUS</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/90 font-bold">
            <span className="animate-pulse">●</span>
            <span>LEVEL READY</span>
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono font-black">MISSION CODE</span>
          <span className="text-[10px] font-bold text-indigo-300 font-mono tracking-wider">PANDA_READY_0{difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : difficulty === 'HARD' ? 3 : 4}</span>
        </div>
      </div>

      {/* Main Flying Panda Stage */}
      <div className="flex flex-col items-center justify-center flex-grow space-y-8 z-10 py-6">
        {/* Animated Flying Panda Avatar Container */}
        <motion.div
          animate={{
            y: [-12, 12, -12],
            rotate: [-1.5, 1.5, -1.5]
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative flex items-center justify-center w-40 h-40"
        >
          {/* Pulsating glowing halo matching skin theme */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div className="absolute inset-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-[5px]" />
          
          <PandaAvatar
            skinType={currentSkin.type}
            size={currentSkin.type === 'astro' ? 115 : 105}
            isFlying={true}
          />

          {/* Sparkly speed streaks around the flying panda */}
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-indigo-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </motion.div>

        {/* Selected Difficulty Notice */}
        <div className="space-y-2 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.badgeBg}`}
          >
            <DifficultyIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
            <span className="text-[10px] font-bold tracking-widest font-mono uppercase text-slate-200">
              Loading {config.label}
            </span>
          </motion.div>
          <p className="text-[10px] font-medium text-slate-400/80 font-mono tracking-wider uppercase">
            CALIBRATING FORESTRY COEFFICIENTS...
          </p>
        </div>
      </div>

      {/* Bottom Progress Block & Tips */}
      <div className="space-y-6 z-10 pb-8">
        {/* Random Tip Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center backdrop-blur-sm"
          >
            <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase font-mono block mb-1">
              GAMEPLAY TIP
            </span>
            <p className="text-xs font-semibold text-slate-200 leading-relaxed px-2">
              "{currentTip}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic loading progress bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-white/10 relative overflow-hidden rounded-full border border-white/5">
            <motion.div 
              className={`absolute left-0 top-0 h-full bg-gradient-to-r ${config.barColor} shadow-[0_0_12px_rgba(99,102,241,0.5)]`}
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold tracking-widest">
            <span>PREPARING PANDA RUNTIME</span>
            <span className="text-slate-300 font-extrabold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Created by OM BRAHMAN brand stamp in Bottom-Right Corner */}
      <div className="absolute bottom-4 right-6 z-20">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold leading-none">DEVELOPED BY</span>
          <span className="text-[9px] font-black text-rose-500/80 font-mono tracking-widest uppercase leading-none animate-pulse">
            OM BRAHMAN
          </span>
        </div>
      </div>
    </div>
  );
}
