import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Coins, Gift, RefreshCw, Timer } from 'lucide-react';
import { playClick, playUnlock, playCoin } from '../utils/audio';

interface LuckySpinProps {
  coins: number;
  unlockedSkins: string[];
  luckySpinsRemaining: number;
  nextSpinAvailableAt: number;
  onBack: () => void;
  onWinCoins: (amount: number) => void;
  onWinSkin: (skinId: string) => void;
  onDeductSpin: () => void;
  onAwardFreeSpin: () => void;
}

const PRIZES = [
  { id: 'coins_50', name: '50 Gold Coins', type: 'COINS', value: 50, color: '#f43f5e' },
  { id: 'xp_100', name: '100 XP scroll', type: 'XP', value: 100, color: '#ec4899' },
  { id: 'coins_100', name: '100 Gold Coins', type: 'COINS', value: 100, color: '#a855f7' },
  { id: 'shield_boost', name: 'Shield power-up', type: 'POWERUP', value: 1, color: '#8b5cf6' },
  { id: 'coins_250', name: '250 Gold Coins', type: 'COINS', value: 250, color: '#3b82f6' },
  { id: 'xp_250', name: '250 XP scroll', type: 'XP', value: 250, color: '#06b6d4' },
  { id: 'golden_chest', name: 'Golden chest 🪙', type: 'COINS', value: 400, color: '#10b981' },
  { id: 'jackpot_skin', name: 'JACKPOT SKIN! 👑', type: 'SKIN', value: 1, color: '#fbbf24' }
];

export default function LuckySpin({
  coins,
  unlockedSkins,
  luckySpinsRemaining,
  nextSpinAvailableAt,
  onBack,
  onWinCoins,
  onWinSkin,
  onDeductSpin,
  onAwardFreeSpin
}: LuckySpinProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('24:00:00');

  // Exact 24h Ticking Timer
  useEffect(() => {
    if (luckySpinsRemaining > 0 || !nextSpinAvailableAt) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = nextSpinAvailableAt - now;

      if (diff <= 0) {
        onAwardFreeSpin();
        setTimeLeftStr('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [luckySpinsRemaining, nextSpinAvailableAt, onAwardFreeSpin]);

  const handleBack = () => {
    if (isSpinning) return;
    playClick();
    onBack();
  };

  const handleSpin = () => {
    if (isSpinning || luckySpinsRemaining <= 0) {
      playClick();
      return;
    }

    playUnlock();
    setIsSpinning(true);
    onDeductSpin();

    // Pick random prize index
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const degreesPerSlice = 360 / PRIZES.length;
    
    // To align properly with top ticker selector pointing downwards,
    // we want index slice to face up. Since segment is clockwise, target is:
    const targetAngle = 360 - (prizeIndex * degreesPerSlice) - (degreesPerSlice / 2);

    // Always spin forward mathematically! Avoid backwards/stuttering spins
    const currentAngle = rotation % 360;
    let diff = targetAngle - currentAngle;
    if (diff <= 0) {
      diff += 360;
    }
    const finalRotation = rotation + diff + (5 * 360); // 5 full loops

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = PRIZES[prizeIndex];
      setWonPrize(prize);

      // Award prize
      if (prize.type === 'COINS') {
        onWinCoins(prize.value);
        playCoin();
      } else if (prize.type === 'SKIN') {
        const potentialSkins = ['sakura', 'frosty', 'sprite'].filter(id => !unlockedSkins.includes(id));
        if (potentialSkins.length > 0) {
          onWinSkin(potentialSkins[0]);
        } else {
          onWinCoins(1000); // alternate jackpot
        }
        playUnlock();
      } else {
        // XP scroll directly added as Gold Coins multiplier
        onWinCoins(prize.value * 1.5);
        playCoin();
      }

      setShowPrizeModal(true);
    }, 4500); // 4.5 seconds feel-good spin speed curve
  };

  const closePrizeModal = () => {
    playClick();
    setShowPrizeModal(false);
    setWonPrize(null);
  };

  return (
    <div 
      id="lucky-spin-panel"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-[#fff5f6] text-rose-950 p-6 select-none overflow-hidden"
    >
      {/* Background Ambience Orbs */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between z-10 w-full pt-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            disabled={isSpinning}
            className="p-2.5 bg-white/85 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4 text-rose-600" />
          </button>
          <div>
            <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950 leading-none block">Lucky Spin</span>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-rose-400 mt-0.5 block">Daily Rewards Hub</span>
          </div>
        </div>

        {/* Current Spins Count */}
        <div className="flex items-center space-x-1.5 bg-rose-100/90 border border-rose-200 py-1.5 px-3.5 rounded-full shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${isSpinning ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-mono font-black text-rose-800">
            {luckySpinsRemaining > 0 ? `${luckySpinsRemaining} LEFT` : '0 LEFT'}
          </span>
        </div>
      </div>

      {/* Center Interactive Spinning Wheel */}
      <div className="flex-grow flex flex-col items-center justify-center z-10 py-4 relative">
        
        {/* Ticker Selector Needle (Top Center pointing down) */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-6 h-7 z-30 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-500 drop-shadow-md" />
          <div className="w-2.5 h-2.5 bg-amber-600 rounded-full -mt-2.5 shadow-sm" />
        </div>

        {/* Outer Wheel Light Ring Frame */}
        <div className="relative w-76 h-76 rounded-full border-8 border-rose-100 bg-[#ffe5ec] shadow-[0_15px_45px_rgba(251,113,133,0.35)] flex items-center justify-center p-1.5 overflow-hidden">
          
          {/* Glowing Inner Ring */}
          <div className="absolute inset-2 rounded-full border border-white/60 pointer-events-none z-10" />

          {/* Wheel canvas background using pure CSS segments */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: isSpinning ? 4.5 : 0.1, ease: [0.15, 0.85, 0.35, 1.0] }}
            className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center shadow-inner border border-rose-200/50"
          >
            {/* Draw 8 colorful slices with text */}
            {PRIZES.map((prize, idx) => {
              const rotationAngle = idx * 45;
              return (
                <div
                  key={prize.id}
                  style={{
                    transform: `rotate(${rotationAngle}deg)`,
                    transformOrigin: '50% 50%'
                  }}
                  className="absolute inset-0 flex flex-col items-center pt-2 w-full h-full"
                >
                  {/* Slice Divider Lines */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-1/2 w-0.5 bg-white/30" />
                  
                  {/* Text alignment rotated slightly so it falls in the center of the conic slice */}
                  <div 
                    className="text-[9px] font-mono font-black tracking-wider uppercase text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] z-10 w-24 text-center select-none"
                    style={{ transform: 'rotate(22.5deg)', transformOrigin: 'center bottom', marginTop: '16px' }}
                  >
                    <span className="block">{prize.name.split(' ')[0]}</span>
                    <span className="block text-[7px] text-white/90 mt-0.5">{prize.name.split(' ').slice(1).join(' ')}</span>
                  </div>
                  
                  {/* Segment Pie slice background representation */}
                  <div
                    className="absolute inset-0 -z-0 opacity-90"
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%, ${prize.color} 45deg, transparent 45deg)`,
                      transform: 'rotate(-22.5deg)'
                    }}
                  />
                </div>
              );
            })}

            {/* Inner Golden Hub Center Cap */}
            <div className="absolute w-14 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-4 border-white shadow-md z-20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Guidance Tip / Countdown Timer display */}
        <div className="mt-6 flex flex-col items-center justify-center space-y-1 h-12">
          {luckySpinsRemaining > 0 ? (
            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider animate-pulse">
              TAP &apos;SPIN THE WHEEL&apos; TO TEST YOUR LUCK!
            </p>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-1.5 text-rose-500 bg-rose-50 border border-rose-200/55 px-3 py-1 rounded-lg">
                <Timer className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                <span className="text-xs font-mono font-black tracking-wider text-rose-600">
                  {timeLeftStr}
                </span>
              </div>
              <span className="text-[8px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                UNTIL NEXT FREE SPIN
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Spin Action */}
      <div className="pb-6 z-10 w-full flex flex-col space-y-4">
        {luckySpinsRemaining > 0 ? (
          <motion.button
            whileHover={!isSpinning ? { scale: 1.02 } : {}}
            whileTap={!isSpinning ? { scale: 0.98 } : {}}
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-[0.25em] uppercase border transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg ${
              !isSpinning
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white border-rose-400 shadow-[0_8px_24px_rgba(244,63,94,0.25)]'
                : 'bg-rose-50/50 text-rose-400 border-rose-100 cursor-not-allowed opacity-50 shadow-none'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            <span>SPIN THE WHEEL</span>
          </motion.button>
        ) : (
          <div className="w-full py-4 rounded-2xl bg-rose-100/40 border border-rose-200/50 text-center flex flex-col items-center justify-center space-y-1 shadow-inner">
            <span className="text-rose-400 font-black text-[11px] tracking-widest uppercase">
              NEXT SPIN CHARGING
            </span>
            <div className="flex items-center space-x-1 text-[10px] font-mono text-rose-500 font-extrabold">
              <span>{timeLeftStr}</span>
            </div>
          </div>
        )}

        <p className="text-center text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold">
          Free spin awarded every 24 hours &bull; 100% Prizes
        </p>
      </div>

      {/* Won Prize Celebration Modal */}
      <AnimatePresence>
        {showPrizeModal && wonPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/45 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 15 }}
              className="bg-white border-2 border-amber-400 w-full max-w-sm rounded-[32px] p-6 text-center space-y-5 shadow-[0_30px_75px_rgba(251,113,133,0.3)] flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl animate-pulse" />

              <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full border border-amber-300 shadow-sm animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  WHEEL PRIZE CLAIMED!
                </span>
                <h3 className="text-lg font-black text-rose-950 uppercase tracking-wide leading-tight">
                  {wonPrize.name}
                </h3>
                <p className="text-[10px] font-mono font-extrabold text-rose-500 uppercase tracking-widest">
                  Successfully credited to pocket
                </p>
              </div>

              <button
                onClick={closePrizeModal}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-450 text-white rounded-xl font-black text-[11px] tracking-widest uppercase cursor-pointer border border-amber-400 shadow-md"
              >
                GREAT!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
