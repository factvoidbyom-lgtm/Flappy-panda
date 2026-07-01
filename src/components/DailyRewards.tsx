import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, CheckCircle2, Coins, Gift, Award, X } from 'lucide-react';
import { playClick, playUnlock, playCoin } from '../utils/audio';

interface DailyRewardsProps {
  coins: number;
  unlockedSkins: string[];
  lastDailyRewardCollected?: string;
  onBack: () => void;
  onClaimReward: (rewardCoins: number, awardSkinId?: string, isSpinReward?: boolean) => void;
}

const WEEKLY_BOARD = [
  { day: 1, name: 'Day 1', reward: '50 Coins', type: 'COINS', value: 50, icon: Coins },
  { day: 2, name: 'Day 2', reward: '100 Coins', type: 'COINS', value: 100, icon: Coins },
  { day: 3, name: 'Day 3', reward: '150 XP Scroll', type: 'COINS', value: 150, icon: Award }, // converted to coin-value credits
  { day: 4, name: 'Day 4', reward: '250 Coins', type: 'COINS', value: 250, icon: Coins },
  { day: 5, name: 'Day 5', reward: 'Lucky Ticket', type: 'SPIN', value: 1, icon: Gift },
  { day: 6, name: 'Day 6', reward: 'Gold Chest', type: 'COINS', value: 450, icon: Gift },
  { day: 7, name: 'Day 7', reward: 'Sakura Skin!', type: 'SKIN', value: 1, icon: Sparkles }
];

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function DailyRewards({
  coins,
  unlockedSkins,
  lastDailyRewardCollected,
  onBack,
  onClaimReward
}: DailyRewardsProps) {
  const todayStr = getTodayDateString();
  const alreadyClaimedToday = lastDailyRewardCollected === todayStr;

  // Let's determine the player's active day streak index (1-7)
  // Saved in local storage. Let's load the streak index
  const getStreakIndex = (): number => {
    try {
      const saved = localStorage.getItem('panda_daily_streak');
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 1 && val <= 7) return val;
      }
    } catch (e) {}
    return 1;
  };

  const [activeStreak, setActiveStreak] = useState<number>(getStreakIndex());
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [celebrateText, setCelebrateText] = useState('');

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleClaim = () => {
    if (alreadyClaimedToday) {
      playClick();
      return;
    }

    const currentReward = WEEKLY_BOARD[activeStreak - 1];
    
    // Process reward
    let coinsToAward = 0;
    let awardSkinId: string | undefined;
    let isSpinReward = false;

    if (currentReward.type === 'COINS') {
      coinsToAward = currentReward.value;
      playCoin();
      setCelebrateText(`You claimed ${currentReward.reward}!`);
    } else if (currentReward.type === 'SPIN') {
      isSpinReward = true;
      playUnlock();
      setCelebrateText(`You claimed 1 FREE SPIN ticket!`);
    } else if (currentReward.type === 'SKIN') {
      if (!unlockedSkins.includes('sakura')) {
        awardSkinId = 'sakura';
        setCelebrateText('You unlocked SAKURA PANDA character!');
      } else {
        coinsToAward = 800; // skin fallback refund
        setCelebrateText('You claimed 800 Gold Coins refund!');
      }
      playUnlock();
    }

    // Call callback to commit to main stats
    onClaimReward(coinsToAward, awardSkinId, isSpinReward);

    // Increment streak day (loop back to 1 if day 7 is finished)
    const nextStreak = activeStreak === 7 ? 1 : activeStreak + 1;
    setActiveStreak(nextStreak);
    
    try {
      localStorage.setItem('panda_daily_streak', nextStreak.toString());
    } catch (e) {}

    setShowCelebrate(true);
  };

  const closeCelebrate = () => {
    playClick();
    setShowCelebrate(false);
  };

  return (
    <div 
      id="daily-rewards-panel"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-[#fff5f6] text-rose-950 p-6 select-none overflow-hidden"
    >
      {/* Background Ambience Orbs */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex items-center space-x-4 pt-2 z-10">
        <button
          onClick={handleBack}
          className="p-2.5 bg-white/85 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-all duration-200"
        >
          <X className="w-4 h-4 text-rose-600" />
        </button>
        <div>
          <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950 leading-none block">Daily Rewards</span>
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-rose-400 mt-0.5 block">7-DAY LOYALTY TRACKER</span>
        </div>
      </div>

      {/* Calendar Grid Board */}
      <div className="flex-grow flex flex-col justify-center space-y-4 z-10 py-4">
        
        {/* Streak progress headline */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-black text-rose-950 uppercase">
            {alreadyClaimedToday ? "TODAY'S REWARD COMPCLAIMED" : `DAY ${activeStreak} REWARD STANDBY`}
          </h3>
          <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">
            Collect rewards consecutively to win the Sakura Character Skin!
          </p>
        </div>

        {/* 7-Day Board layout */}
        <div className="grid grid-cols-3 gap-2.5">
          {WEEKLY_BOARD.map((item) => {
            const isCompleted = item.day < activeStreak;
            const isToday = item.day === activeStreak;
            const isLocked = item.day > activeStreak;
            const Icon = item.icon;

            const isDay7 = item.day === 7;

            return (
              <div
                key={item.day}
                className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  isDay7 ? 'col-span-3 py-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border-amber-300' : ''
                } ${
                  isCompleted 
                    ? 'bg-emerald-500/[0.04] border-emerald-200 text-rose-900 opacity-60' 
                    : isToday 
                      ? 'bg-white border-rose-400 shadow-md ring-2 ring-rose-400/20 scale-102 font-bold text-rose-950 animate-pulse' 
                      : 'bg-white/75 border-rose-100 opacity-70'
                }`}
              >
                <span className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest">
                  {item.name}
                </span>

                <div className="my-2 text-rose-600">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 stroke-[3px]" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isToday ? 'text-rose-500 fill-rose-500/10' : 'text-rose-400'}`} />
                  )}
                </div>

                <span className="text-[9px] font-black tracking-wider uppercase text-rose-900">
                  {item.reward}
                </span>

                {isToday && !alreadyClaimedToday && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pb-6 z-10 w-full flex flex-col space-y-4">
        <motion.button
          whileHover={!alreadyClaimedToday ? { scale: 1.02 } : {}}
          whileTap={!alreadyClaimedToday ? { scale: 0.98 } : {}}
          onClick={handleClaim}
          disabled={alreadyClaimedToday}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-[0.25em] uppercase border transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg ${
            !alreadyClaimedToday
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white border-rose-400 shadow-[0_8px_24px_rgba(244,63,94,0.25)]'
              : 'bg-rose-50/50 text-rose-400 border-rose-100 cursor-not-allowed opacity-50 shadow-none'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{alreadyClaimedToday ? "ALREADY CLAIMED TODAY" : "CLAIM TODAY'S REWARD"}</span>
        </motion.button>

        <p className="text-center text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold">
          Resets daily at midnight local time
        </p>
      </div>

      {/* Congratulation Celebration screen */}
      <AnimatePresence>
        {showCelebrate && (
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
              className="bg-white border-2 border-amber-300 w-full max-w-sm rounded-[32px] p-6 text-center space-y-5 shadow-[0_30px_75px_rgba(251,113,133,0.3)] flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl" />

              <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full border border-amber-300 shadow-sm animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  DAILY GIFT UNLOCKED!
                </span>
                <h3 className="text-lg font-black text-rose-950 uppercase tracking-wide leading-tight">
                  {celebrateText}
                </h3>
                <p className="text-[10px] font-mono font-extrabold text-rose-500 uppercase tracking-widest">
                  See you tomorrow for the next streak!
                </p>
              </div>

              <button
                onClick={closeCelebrate}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-450 text-white rounded-xl font-black text-[11px] tracking-widest uppercase cursor-pointer border border-amber-400 shadow-md"
              >
                COLLECT REWARD
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
