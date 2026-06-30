import { motion } from 'motion/react';
import { ArrowLeft, Lock, Trophy, Zap, CloudSnow, Sun, Moon, Sparkles } from 'lucide-react';
import { StoryLevel, STORY_LEVELS, UserStats } from '../types';
import { playClick } from '../utils/audio';

interface StoryLevelsSelectProps {
  stats: UserStats;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export default function StoryLevelsSelect({ stats, onSelectLevel, onBack }: StoryLevelsSelectProps) {
  const currentUnlocked = stats.storyLevelProgress || 1;

  const getThemeIcon = (theme: string, className: string) => {
    switch (theme) {
      case 'sunrise':
        return <Sun className={className} />;
      case 'snow':
        return <CloudSnow className={className} />;
      case 'mist':
        return <Sparkles className={className} />;
      case 'twilight':
        return <Moon className={className} />;
      case 'tempest':
        return <Zap className={className} />;
      default:
        return <Sun className={className} />;
    }
  };

  const getThemeColorClass = (theme: string) => {
    switch (theme) {
      case 'sunrise':
        return 'from-amber-400/20 to-orange-500/20 border-orange-200/50 text-orange-700';
      case 'snow':
        return 'from-sky-400/20 to-blue-500/20 border-blue-200/50 text-blue-700';
      case 'mist':
        return 'from-slate-300/20 to-slate-500/20 border-slate-300/50 text-slate-700';
      case 'twilight':
        return 'from-indigo-400/20 to-indigo-900/20 border-indigo-300/30 text-indigo-300';
      case 'tempest':
        return 'from-purple-500/20 to-slate-900/40 border-purple-500/30 text-purple-400';
      default:
        return 'from-rose-400/20 to-pink-500/20 border-rose-200/50 text-rose-700';
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 relative overflow-hidden bg-gradient-to-b from-[#fff0f3] to-[#fff5f6]">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-rose-200/30 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 rounded-full bg-orange-100/30 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 shrink-0">
        <motion.button
          id="story-select-back"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            playClick();
            onBack();
          }}
          className="p-2.5 rounded-full bg-white/80 border border-rose-200/50 shadow-sm text-rose-900 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center cursor-pointer pointer-events-auto"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <h1 className="text-xl font-black text-rose-950 tracking-tight drop-shadow-sm text-center flex-1 pr-8">
          STORY MODE
        </h1>
      </div>

      {/* Levels list with glassmorphism scrolling container */}
      <div className="flex-1 overflow-y-auto my-4 pr-1.5 space-y-3.5 z-10 custom-scrollbar py-2">
        {STORY_LEVELS.map((level, index) => {
          const isLocked = level.id > currentUnlocked;
          const isCompleted = level.id < currentUnlocked;
          const themeColor = getThemeColorClass(level.theme);

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={isLocked ? {} : { y: -2, scale: 1.01 }}
              whileTap={isLocked ? { shake: 2 } : { scale: 0.98 }}
              onClick={() => {
                if (!isLocked) {
                  playClick();
                  onSelectLevel(level.id);
                }
              }}
              className={`relative flex flex-col p-4 rounded-2xl border backdrop-blur-md shadow-sm transition-all overflow-hidden cursor-pointer ${
                isLocked
                  ? 'bg-slate-100/50 border-slate-200/50 text-slate-400 opacity-65 cursor-not-allowed'
                  : isCompleted
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-200/50 hover:shadow-md'
                  : 'bg-gradient-to-r from-white/95 to-rose-50/50 border-rose-200/60 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Inner ambient colored lighting on card */}
              {!isLocked && (
                <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${themeColor.split(' ')[0]} opacity-25 blur-xl pointer-events-none`} />
              )}

              <div className="flex items-start justify-between">
                {/* Level Number & Name */}
                <div className="flex items-center space-x-3 z-10">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${
                      isLocked
                        ? 'bg-slate-200 text-slate-500'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    L{level.id}
                  </div>
                  <div>
                    <h3
                      className={`font-black text-sm tracking-tight ${
                        isLocked ? 'text-slate-500' : isCompleted ? 'text-emerald-900' : 'text-rose-950'
                      }`}
                    >
                      {level.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          level.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : level.difficulty === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}
                      >
                        {level.difficulty}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400/80">•</span>
                      <span className="text-[9px] font-mono font-semibold text-slate-500 flex items-center">
                        <Trophy className="w-2.5 h-2.5 text-amber-500 mr-0.5" /> Goal: {level.targetScore} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lock or Level Icon status */}
                <div className="z-10">
                  {isLocked ? (
                    <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center border border-slate-300/40">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  ) : isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600">
                      <Trophy className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 animate-pulse" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 animate-bounce`}>
                      {getThemeIcon(level.theme, 'w-4 h-4 text-rose-500')}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                className={`text-[11px] font-medium leading-relaxed mt-2.5 z-10 ${
                  isLocked ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {level.description}
              </p>

              {/* Level progress bar */}
              {!isLocked && (
                <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden z-10 border border-slate-200/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '15%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-rose-400'}`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Elegant Creator Credit footer */}
      <div className="flex items-center justify-between shrink-0 z-10 pt-2 border-t border-rose-100/50">
        <span className="text-[9px] font-mono text-slate-500">
          Unlocked {currentUnlocked}/5 Levels
        </span>
        <span className="text-[8px] font-mono font-black text-rose-900/50 tracking-[0.25em] uppercase">
          Created by OM BRAHMAN
        </span>
      </div>
    </div>
  );
}
