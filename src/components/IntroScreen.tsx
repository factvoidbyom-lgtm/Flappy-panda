import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [phase, setPhase] = useState<'flare' | 'omg' | 'subtitle' | 'fadeout'>('flare');

  useEffect(() => {
    // Cinematic orchestration timers
    const t1 = setTimeout(() => {
      setPhase('omg');
    }, 1200); // Ring flare shows for 1.2s

    const t2 = setTimeout(() => {
      setPhase('subtitle');
    }, 2200); // Subtitle fades in after OMG shows for 1s

    const t3 = setTimeout(() => {
      setPhase('fadeout');
    }, 4000); // Start fading out at 4.0s

    const t4 = setTimeout(() => {
      onComplete();
    }, 4600); // Complete and transition at 4.6s

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      id="intro-screen"
      onClick={onComplete}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white select-none overflow-hidden cursor-pointer"
    >
      {/* Tap to skip hint - subtle and placed at the bottom */}
      <div className="absolute top-6 right-6 font-mono text-[9px] text-zinc-600 tracking-widest uppercase pointer-events-none opacity-40">
        Tap to Skip
      </div>

      <AnimatePresence>
        {phase !== 'fadeout' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex flex-col items-center justify-center w-full h-full"
          >
            {/* BACKGROUND STARFIELD / PARTICLES */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              {/* Subtle ambient fog */}
              <motion.div
                animate={{
                  opacity: [0.1, 0.2, 0.1],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute w-[200px] h-[200px] bg-white/5 rounded-full blur-[80px]"
              />
            </div>

            {/* PHASE 1: LENS FLARE / RING BLAST */}
            {phase === 'flare' && (
              <div className="relative flex items-center justify-center w-full h-full">
                {/* Glowing Outer Halo */}
                <motion.div
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ scale: [1, 1.2], opacity: [0, 1, 0.8] }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full bg-white/10 blur-[40px] pointer-events-none"
                />

                {/* Inner Ring */}
                <motion.div
                  initial={{ scale: 0.1, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: [0, 1, 1], rotate: 0 }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-28 h-28 rounded-full border-8 border-white flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 50px 15px rgba(255,255,255,0.95), inset 0 0 30px 8px rgba(255,255,255,0.95)',
                  }}
                >
                  {/* Central Core Blast */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="w-8 h-8 rounded-full bg-white shadow-[0_0_40px_10px_rgba(255,255,255,1)]"
                  />
                </motion.div>

                {/* Horizontal Flare beam */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1.5, 1], opacity: [0, 1, 0.7] }}
                  transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                  className="absolute w-[90%] h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                />

                {/* Vertical Flare beam */}
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: [0, 1.3, 1], opacity: [0, 0.9, 0.6] }}
                  transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
                  className="absolute h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
                />

                {/* Diagonal Sparkles */}
                <motion.div
                  initial={{ opacity: 0, rotate: 45, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0.4], scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute w-[40%] h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                />
                <motion.div
                  initial={{ opacity: 0, rotate: -45, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0.4], scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute w-[40%] h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                />
              </div>
            )}

            {/* PHASE 2 & 3: OMG TEXT & SUBTITLE */}
            {(phase === 'omg' || phase === 'subtitle') && (
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* Glow ring dissipating in background */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute w-28 h-28 rounded-full border-4 border-white pointer-events-none"
                  style={{
                    boxShadow: '0 0 35px 8px rgba(255,255,255,0.8)',
                  }}
                />

                {/* Radial Flash Light Burst on appear */}
                <motion.div
                  initial={{ scale: 0.2, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute w-32 h-32 rounded-full bg-white blur-md pointer-events-none"
                />

                {/* "OMG" Title */}
                <motion.h1
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 14,
                    duration: 0.6,
                  }}
                  className="text-7xl md:text-8xl font-black text-white tracking-[0.12em] font-sans drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] select-none pl-[0.12em]"
                >
                  OMG
                </motion.h1>

                {/* Divider Line */}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 140, opacity: 0.4 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="h-[1px] bg-white"
                />

                {/* Subtitle: "Made by OM BRAHMAN" */}
                <div className="h-6 flex items-center justify-center">
                  <AnimatePresence>
                    {phase === 'subtitle' && (
                      <motion.p
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 0.85 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="text-[11px] md:text-xs font-semibold text-zinc-300 tracking-[0.45em] uppercase font-sans text-center pl-[0.45em]"
                      >
                        Made by OM BRAHMAN
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
