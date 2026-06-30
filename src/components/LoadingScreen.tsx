import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import { initAudio, playCoin } from '../utils/audio';
// @ts-ignore
import pandaFlapLogo from '../assets/images/panda_flap_logo_1782813212938.jpg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Beautiful progressive load simulator (about 2.5 seconds)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoaded(true);
          return 100;
        }
        // Jump progress by natural random steps
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(100, prev + step);
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleEnterGame = () => {
    // Crucial step: Initialize audio context on first direct user interaction
    initAudio();
    playCoin();
    onComplete();
  };

  return (
    <div 
      id="loading-screen"
      className="fixed inset-0 flex flex-col items-center justify-between bg-[#fff0f3] text-rose-900 select-none p-6 overflow-hidden"
    >
      {/* Background Ambience Orbs (Cute soft pinks and creams) */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[100px]" />
        <div className="absolute top-[30%] right-[5%] w-[45%] h-[45%] rounded-full bg-[#ffb3c1]/30 blur-[90px]" />
      </div>

      {/* Top Margin Header */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-0.5">
          <div className="text-[9px] uppercase tracking-[0.25em] text-rose-400 font-mono font-bold">System Status</div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-rose-700/80">
            <span className="text-rose-500 animate-pulse">●</span>
            <span>ONLINE</span>
            <span className="text-rose-200">|</span>
            <span className="text-rose-500/60">SOUL_NODE</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] uppercase tracking-[0.25em] text-rose-400 font-mono font-bold">Protocol</div>
          <div className="text-[10px] font-bold text-rose-700 font-mono tracking-wider">ZENITH_OS</div>
        </div>
      </div>

      {/* Centerpiece Frosted Card container */}
      <div className="relative z-10 w-full max-w-[380px] my-auto px-6 py-10 rounded-[36px] border border-white/80 bg-white/70 backdrop-blur-[25px] shadow-[0_20px_40px_-10px_rgba(251,113,133,0.15)] flex flex-col items-center text-center space-y-8">
        <div className="absolute inset-0 rounded-[36px] border border-white/45 pointer-events-none" />

        {/* Glow-enhanced Sacred symbol */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="relative flex items-center justify-center w-28 h-28 rounded-full bg-white/60 border border-rose-200/50 shadow-[0_8px_24px_rgba(251,113,133,0.08)] overflow-hidden"
        >
          {/* Pulsating soft pink aura */}
          <div className="absolute inset-0 rounded-full animate-pulse bg-rose-400/10 blur-xl" />
          <img 
            src={pandaFlapLogo} 
            alt="Panda Flap Logo" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Dynamic loading mantra */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-2.5"
        >
          <h2 className="text-2xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-rose-700 via-rose-600 to-rose-500 drop-shadow-sm font-sans uppercase">
            OM BRAHMAN
          </h2>
          <p className="text-[10px] text-rose-400 font-mono tracking-[0.3em] uppercase font-bold">
            Synchronizing Soul Core
          </p>
        </motion.div>

        {/* Progress & Interaction Block inside the glass container */}
        <div className="w-full pt-2">
          <AnimatePresence mode="wait">
            {!loaded ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center space-y-4"
              >
                {/* Micro frosted glass bar */}
                <div className="w-full h-1.5 bg-rose-100 relative overflow-hidden rounded-full border border-white">
                  <motion.div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between w-full text-[9px] font-mono text-rose-400 tracking-[0.2em] uppercase font-bold">
                  <span>SYSTEM LOADING</span>
                  <span className="text-rose-600 font-bold">{progress}%</span>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="enter-btn"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleEnterGame}
                className="group relative flex items-center justify-center space-x-3 w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl font-bold tracking-[0.2em] shadow-[0_8px_24px_rgba(244,63,94,0.2)] border border-rose-400/30 cursor-pointer overflow-hidden transition-all duration-300 uppercase text-xs"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <Play className="w-4 h-4 fill-current text-white" />
                <span>TAP TO ENTER</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer system indicators */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10">
        <p className="text-[9px] text-rose-400/60 tracking-[0.3em] uppercase font-mono font-bold leading-none">
          Panda Flap &bull; Zenith Edition
        </p>
        <p className="text-[8px] text-rose-400/40 uppercase tracking-widest font-mono font-bold">
          Build v0.98 &copy; 2026
        </p>
      </div>
    </div>
  );
}
