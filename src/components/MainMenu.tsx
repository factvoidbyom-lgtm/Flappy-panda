import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ShoppingBag, Settings as SettingsIcon, Trophy, Coins, Award, ChevronRight, X, CheckCircle2, Sparkles } from 'lucide-react';
import { SKIN_LIST, PandaSkin, DailyMission } from '../types';
import PandaAvatar from './PandaAvatar';
import { playClick } from '../utils/audio';

interface MainMenuProps {
  equippedSkinId: string;
  coins: number;
  highScore: number;
  missions: DailyMission[];
  onClaimReward: (missionId: string, rewardCoins: number) => void;
  onNavigate: (screen: 'DIFFICULTY' | 'SHOP' | 'SETTINGS' | 'GAME' | 'STORY_LEVELS') => void;
  onStartDirectly?: () => void;
}

export default function MainMenu({ 
  equippedSkinId, 
  coins, 
  highScore, 
  missions = [], 
  onClaimReward, 
  onNavigate 
}: MainMenuProps) {
  const currentSkin = SKIN_LIST.find((s) => s.id === equippedSkinId) || SKIN_LIST[0];
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);

  const handleNav = (screen: 'DIFFICULTY' | 'SHOP' | 'SETTINGS' | 'STORY_LEVELS') => {
    playClick();
    onNavigate(screen);
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const completedAndUnclaimedCount = missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div 
      id="main-menu"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-[#fff5f6] text-rose-950 p-6 select-none overflow-hidden"
    >
      {/* Background Ambience Orbs (Cute soft pinks and creams) */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[110px]" />
        <div className="absolute top-[40%] left-[20%] w-[45%] h-[45%] rounded-full bg-[#ffb3c1]/30 blur-[90px]" />
      </div>

      {/* Top Bar (Stats Summary) */}
      <div className="flex items-center justify-between z-10 w-full pt-2">
        {/* High Score Badge */}
        <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-md py-1.5 px-3.5 rounded-full border border-rose-200/55 shadow-md">
          <Trophy className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
          <span className="text-[10px] font-mono tracking-widest font-bold text-rose-800">BEST: {highScore}</span>
        </div>

        {/* Coins Counter */}
        <div className="flex items-center space-x-1.5 bg-white/70 backdrop-blur-md py-1.5 px-4 rounded-full border border-rose-200/55 shadow-md">
          <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/15 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-mono font-bold text-rose-900">{coins}</span>
        </div>
      </div>

      {/* Center Branding Block */}
      <div className="flex flex-col items-center justify-center flex-grow space-y-6 z-10 py-4">
        {/* Animated Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center"
        >
          <h1 className="text-5xl font-black tracking-[0.25em] leading-none flex flex-col gap-2 select-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-rose-450 drop-shadow-[0_2px_10px_rgba(251,113,133,0.15)]">PANDA</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300">FLAP</span>
          </h1>
        </motion.div>

        {/* Flying Panda Avatar Preview */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Subtle wing flaps or rings around */}
          <div className="absolute inset-2 bg-rose-400/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-rose-100 bg-white/50 backdrop-blur-[5px]" />
          <PandaAvatar
            skinType={currentSkin.type}
            size={currentSkin.type === 'astro' ? 105 : 95}
            isFlying={true}
          />
        </div>

        {/* Guidance Prompt */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6 }}
          className="text-[9px] font-bold tracking-[0.3em] text-rose-500/70 uppercase font-mono animate-pulse"
        >
          TAP TO FLY &bull; DODGE BAMBOO
        </motion.p>
      </div>

      {/* Primary Actions Grid */}
      <div className="flex flex-col gap-3 z-10 w-full pb-4">
        {/* Daily Missions Teaser Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => { playClick(); setIsMissionsOpen(true); }}
          className="relative z-10 w-full bg-white/80 hover:bg-white/95 border border-rose-200/60 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-md transition-colors backdrop-blur-md"
        >
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-8.5 h-8.5 bg-rose-100 border border-rose-200/50 text-rose-500 rounded-xl">
              <Award className="w-4.5 h-4.5 text-rose-500" />
              {completedAndUnclaimedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
              {completedAndUnclaimedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black tracking-wider uppercase text-rose-900">Daily Missions</h3>
              <p className="text-[9px] text-rose-500/60 font-mono mt-0.5 font-bold">
                {completedCount === 3 ? "ALL COMPLETED!" : `${completedCount}/3 OBJECTIVES MET`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {completedAndUnclaimedCount > 0 ? (
              <span className="text-[9px] font-mono font-bold text-rose-600 animate-pulse bg-rose-100 border border-rose-200/40 px-2 py-0.5 rounded-full tracking-wider">
                {completedAndUnclaimedCount} CLAIMABLE
              </span>
            ) : (
              <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold">
                VIEW
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-rose-400/60" />
          </div>
        </motion.div>

        {/* Story Mode - Gold/Orange with pulsing glow */}
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleNav('STORY_LEVELS')}
          className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl font-extrabold text-sm tracking-[0.25em] uppercase shadow-[0_12px_30px_rgba(245,158,11,0.25)] border border-amber-300/30 cursor-pointer overflow-hidden transition-all duration-300"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          <Sparkles className="w-4 h-4 text-amber-100 fill-amber-100 animate-pulse" />
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">STORY MODE</span>
        </motion.button>

        {/* Play Button - Giant & Primary */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleNav('DIFFICULTY')}
          className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl font-bold text-sm tracking-[0.25em] uppercase shadow-[0_8px_24px_rgba(244,63,94,0.18)] border border-rose-400/20 cursor-pointer overflow-hidden transition-all duration-300"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          <Play className="w-4 h-4 fill-current text-white" />
          <span>PLAY GAME</span>
        </motion.button>

        {/* Secondary buttons row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Shop */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNav('SHOP')}
            className="flex items-center justify-center space-x-2 py-3 bg-white/70 hover:bg-white/90 active:bg-rose-50 backdrop-blur-md text-rose-800 rounded-xl font-bold text-[10px] tracking-wider uppercase border border-rose-200/60 shadow-md cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
            <span>PANDA SHOP</span>
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNav('SETTINGS')}
            className="flex items-center justify-center space-x-2 py-3 bg-white/70 hover:bg-white/90 active:bg-rose-50 backdrop-blur-md text-rose-800 rounded-xl font-bold text-[10px] tracking-wider uppercase border border-rose-200/60 shadow-md cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>SETTINGS</span>
          </motion.button>
        </div>
      </div>

      {/* Footer Branding Accent */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1 z-10 shrink-0">
        <p className="text-[8px] font-mono font-black text-rose-450 tracking-[0.25em] uppercase text-center animate-pulse">
          Created by OM BRAHMAN
        </p>
      </div>

      {/* Daily Missions Drawer Overlay */}
      <AnimatePresence>
        {isMissionsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMissionsOpen(false)}
              className="absolute inset-0 bg-rose-950/25 backdrop-blur-sm z-40 cursor-pointer"
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-white border-t border-rose-100 rounded-t-[32px] p-6 pb-8 z-50 flex flex-col space-y-4 shadow-[0_-15px_40px_rgba(251,113,133,0.1)] backdrop-blur-xl"
            >
              {/* Inner bezel border accent */}
              <div className="absolute inset-0 rounded-t-[32px] border-t border-x border-rose-50 pointer-events-none" />

              {/* Drawer Handle Accent */}
              <div className="w-10 h-1 bg-rose-200 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-center justify-between w-full">
                <div className="text-left space-y-0.5">
                  <h2 className="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-800 to-rose-600 uppercase">Daily Missions</h2>
                  <p className="text-[9px] text-rose-400 uppercase tracking-widest font-mono font-bold">Resets daily &bull; Earn extra coins</p>
                </div>
                <button
                  onClick={() => { playClick(); setIsMissionsOpen(false); }}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 rounded-full border border-rose-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Missions list */}
              <div className="flex flex-col space-y-3 overflow-y-auto pr-1 max-h-[350px]">
                {missions.map((mission) => {
                  const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                  
                  return (
                    <div
                      key={mission.id}
                      className={`relative overflow-hidden p-3.5 rounded-2xl border transition-all ${
                        mission.claimed
                          ? 'bg-rose-50/10 border-rose-100/50 opacity-60 text-rose-900'
                          : mission.completed
                          ? 'bg-emerald-500/[0.03] border-emerald-200 text-rose-900 shadow-[0_4px_16px_rgba(16,185,129,0.05)]'
                          : 'bg-white border-rose-100/80 text-rose-900 shadow-sm'
                      }`}
                    >
                      {/* Claimed/Completed watermarks or highlights */}
                      {mission.completed && !mission.claimed && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                      )}

                      <div className="flex justify-between items-start mb-2.5">
                        <div className="space-y-0.5 text-left pr-4">
                          <h4 className="text-xs font-extrabold text-rose-950 tracking-wide leading-tight flex items-center space-x-1.5">
                            <span>{mission.title}</span>
                            {mission.completed && !mission.claimed && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </h4>
                          <p className="text-[10px] text-rose-500 font-bold leading-relaxed">
                            {mission.description}
                          </p>
                        </div>

                        {/* Reward Badge */}
                        <div className="flex items-center space-x-1 bg-yellow-500/10 border border-yellow-300/30 px-2 py-0.5 rounded-lg shrink-0">
                          <Coins className="w-3 h-3 text-yellow-600 fill-yellow-500/10" />
                          <span className="text-[10px] font-mono font-bold text-yellow-600">+{mission.reward}</span>
                        </div>
                      </div>

                      {/* Progress bar and claiming action */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Progress slider */}
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between text-[9px] font-mono font-bold text-rose-400 tracking-wider">
                            <span>PROGRESS</span>
                            <span>{mission.progress} / {mission.target}</span>
                          </div>
                          
                          {/* Outer Track */}
                          <div className="w-full h-1.5 bg-rose-100/50 rounded-full overflow-hidden border border-rose-100/20">
                            {/* Fill */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                mission.completed 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                  : 'bg-gradient-to-r from-rose-400 to-pink-400'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Button Action */}
                        <div className="shrink-0">
                          {mission.claimed ? (
                            <div className="flex items-center space-x-1 py-1.5 px-2.5 text-rose-400/60 font-mono font-bold text-[9px] tracking-wider uppercase">
                              <CheckCircle2 className="w-3 h-3 text-rose-400/40" />
                              <span>CLAIMED</span>
                            </div>
                          ) : mission.completed ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onClaimReward(mission.id, mission.reward)}
                              className="relative overflow-hidden bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-black text-[9px] tracking-widest py-1.5 px-3 rounded-xl shadow-[0_4px_12px_rgba(234,179,8,0.2)] border border-yellow-400/20 cursor-pointer uppercase transition-colors"
                            >
                              CLAIM
                            </motion.button>
                          ) : (
                            <div className="bg-rose-50 border border-rose-100 text-rose-400 font-mono font-bold text-[9px] tracking-wider py-1.5 px-2.5 rounded-xl">
                              {percent}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
