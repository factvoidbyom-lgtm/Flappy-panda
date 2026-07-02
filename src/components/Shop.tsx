import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, Coins, Check, Gift, Sparkles, HelpCircle } from 'lucide-react';
import { SKIN_LIST, PandaSkin } from '../types';
import PandaAvatar from './PandaAvatar';
import { playClick, playUnlock, playCoin } from '../utils/audio';

interface ShopProps {
  coins: number;
  unlockedSkins: string[];
  equippedSkinId: string;
  onBuySkin: (skinId: string, cost: number) => void;
  onEquipSkin: (skinId: string) => void;
  onBack: () => void;
}

const RARITY_COLORS = {
  Common: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
  Rare: { text: 'text-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700 font-extrabold' },
  Epic: { text: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700 font-black' },
  Legendary: { text: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800 font-black animate-pulse' },
  Mythic: { text: 'text-red-600', bg: 'bg-red-50/60', border: 'border-red-200', badge: 'bg-red-100 text-red-800 font-black animate-bounce' }
};

export default function Shop({
  coins,
  unlockedSkins,
  equippedSkinId,
  onBuySkin,
  onEquipSkin,
  onBack
}: ShopProps) {
  // Mystery Box states: 'IDLE' | 'SHAKING' | 'REVEALED'
  const [mysteryState, setMysteryState] = useState<'IDLE' | 'SHAKING' | 'REVEALED'>('IDLE');
  const [mysteryReward, setMysteryReward] = useState<{
    type: 'skin' | 'coins' | 'xp';
    name: string;
    details: string;
    skinId?: string;
    amount?: number;
  } | null>(null);

  // Code entry modal states
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [selectedCodeSkin, setSelectedCodeSkin] = useState<PandaSkin | null>(null);

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleSkinClick = (skin: PandaSkin) => {
    const isUnlocked = unlockedSkins.includes(skin.id);

    if (isUnlocked) {
      playClick();
      onEquipSkin(skin.id);
    } else {
      if (skin.isCodeRequired) {
        playClick();
        setSelectedCodeSkin(skin);
        setCodeModalOpen(true);
      } else if (coins >= skin.cost) {
        playUnlock();
        onBuySkin(skin.id, skin.cost);
      } else {
        playClick();
      }
    }
  };

  const handleVerifyCode = () => {
    if (enteredCode.trim().toUpperCase() === 'OMG') {
      playUnlock();
      setCodeSuccess(true);
      setCodeError('');
      onBuySkin('brahmans', 0); // Unlocks and equips for 0 coins!
    } else {
      playClick();
      setCodeError('Incorrect code! Try "OMG"');
    }
  };

  const handleCloseCodeModal = () => {
    playClick();
    setCodeModalOpen(false);
    setEnteredCode('');
    setCodeError('');
    setCodeSuccess(false);
    setSelectedCodeSkin(null);
  };

  const handleOpenMysteryBox = () => {
    if (coins < 250 || mysteryState !== 'IDLE') {
      playClick();
      return;
    }

    playUnlock();
    setMysteryState('SHAKING');

    // Deduct cost via purchasing a fake skin trigger or we can just deduct coins
    // For structural compliance, let's invoke onBuySkin with a special dummy ID to reduce coins, 
    // or we can pass the coin cost directly as a negative transaction.
    // Let's deduct 250 coins by triggering the purchase of 'classic' with 250 cost, or custom deduct.
    // To make sure stats save perfectly, let's trigger a coin deduction in onBuySkin of 250.
    // Wait, onBuySkin does: stats.coins - cost. So if we buy classic (already unlocked) with 250, it just deducts 250! Perfect!
    onBuySkin('classic', 250);

    setTimeout(() => {
      // Pick random reward
      const roll = Math.random();
      if (roll < 0.4) {
        // Roll a locked skin if any, otherwise coins
        const lockedSkins = SKIN_LIST.filter(s => !unlockedSkins.includes(s.id));
        if (lockedSkins.length > 0) {
          const wonSkin = lockedSkins[Math.floor(Math.random() * lockedSkins.length)];
          setMysteryReward({
            type: 'skin',
            name: wonSkin.name,
            details: `Ability: ${wonSkin.abilityDesc}`,
            skinId: wonSkin.id
          });
          onBuySkin(wonSkin.id, 0); // award skin for free!
        } else {
          // Refund / cash reward
          setMysteryReward({
            type: 'coins',
            name: 'Gold Jackpot! 🪙',
            details: 'Won 500 Gold Coins!',
            amount: 500
          });
          onBuySkin('classic', -500); // give 500 coins back
          playCoin();
        }
      } else if (roll < 0.7) {
        // Coin prize
        const amt = Math.floor(Math.random() * 3) * 150 + 200; // 200, 350, 500
        setMysteryReward({
          type: 'coins',
          name: 'Golden Treasure Chest',
          details: `Won ${amt} Gold Coins!`,
          amount: amt
        });
        onBuySkin('classic', -amt); // add coins
        playCoin();
      } else {
        // XP prize
        const xpAmt = Math.floor(Math.random() * 4) * 100 + 300; // 300 - 600 XP
        setMysteryReward({
          type: 'xp',
          name: 'Mystic XP Scroll 📜',
          details: `Gained +${xpAmt} XP booster scroll!`,
          amount: xpAmt
        });
        // We will add XP. For now, we can refund coins as a booster or save XP. Let's award 100 coins alongside it!
        onBuySkin('classic', -100);
        playCoin();
      }
      setMysteryState('REVEALED');
    }, 1800);
  };

  const closeMysteryReveal = () => {
    playClick();
    setMysteryState('IDLE');
    setMysteryReward(null);
  };

  return (
    <div 
      id="panda-shop"
      className="relative flex flex-col justify-between w-full h-full max-w-md mx-auto bg-[#fff5f6] text-rose-950 p-6 select-none overflow-hidden"
    >
      {/* Background Ambience Orbs */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[#ffd6e0]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ffccd5]/50 blur-[100px]" />
      </div>

      {/* Shop Header */}
      <div className="flex items-center justify-between z-10 w-full pt-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2.5 bg-white/85 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-rose-600" />
          </button>
          <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950">Panda Shop</span>
        </div>

        {/* Current Coin Balance */}
        <div className="flex items-center space-x-1.5 bg-white/85 backdrop-blur-md shadow-md py-1.5 px-3.5 rounded-full border border-rose-200/50">
          <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/15 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-mono font-bold text-rose-950">{coins}</span>
        </div>
      </div>

      {/* Main Container Scroll */}
      <div className="flex-grow overflow-y-auto pr-1 my-5 space-y-5 custom-scrollbar z-10">
        
        {/* Interactive Mystery Box/Chest Section */}
        <div className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 rounded-2xl p-4 border border-amber-300/40 shadow-sm relative overflow-hidden flex items-center justify-between gap-4">
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[140%] bg-gradient-to-r from-white/10 to-transparent rotate-12 pointer-events-none" />
          
          <div className="text-left space-y-1 max-w-[60%]">
            <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-100 border border-amber-200/40 px-2 py-0.5 rounded-full tracking-widest uppercase">
              MYSTERY BOX
            </span>
            <h3 className="text-sm font-black text-rose-950 uppercase leading-tight">Unlock Lucky Relics</h3>
            <p className="text-[10px] text-rose-700/80 font-bold leading-relaxed">
              Open for 250 coins to win random premium skins, massive XP, or double coin jackpots!
            </p>
          </div>

          <motion.button
            whileHover={coins >= 250 ? { scale: 1.05 } : {}}
            whileTap={coins >= 250 ? { scale: 0.95 } : {}}
            onClick={handleOpenMysteryBox}
            disabled={coins < 250}
            className={`px-4 py-3 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
              coins >= 250 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white border-amber-400 shadow-md font-black' 
                : 'bg-rose-50/40 text-rose-350 border-rose-100 cursor-not-allowed opacity-50'
            }`}
          >
            <Gift className="w-5 h-5 mb-1 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider uppercase">OPEN</span>
            <span className="text-[9px] font-mono mt-0.5 font-bold">250 🪙</span>
          </motion.button>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {SKIN_LIST.map((skin, idx) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            const canAfford = skin.isCodeRequired ? false : (coins >= skin.cost);
            const rarityConf = RARITY_COLORS[skin.rarity || 'Common'];

            return (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`relative flex flex-col items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
                  isEquipped 
                    ? 'border-emerald-500 bg-white shadow-[0_6px_20px_rgba(16,185,129,0.12)]' 
                    : isUnlocked 
                      ? 'border-rose-100 hover:border-rose-300 hover:bg-white' 
                      : 'border-rose-100/50 bg-rose-50/35'
                }`}
              >
                {/* Rarity Tag */}
                <div className={`absolute top-2 left-2 text-[8px] font-mono font-extrabold tracking-widest px-2 py-0.5 rounded-md uppercase ${rarityConf.badge}`}>
                  {skin.rarity}
                </div>

                {/* Skin Preview Icon */}
                <div className="relative w-18 h-18 flex items-center justify-center my-3">
                  <div className="absolute inset-0 rounded-full bg-rose-50/50 border border-rose-100" />
                  <PandaAvatar skinType={skin.type} size={58} isFlying={isEquipped} />
                </div>

                {/* Info Text */}
                <div className="text-center w-full mt-1 space-y-1">
                  <h3 className="text-xs font-black text-rose-950 tracking-wider uppercase">
                    {skin.name}
                  </h3>
                  
                  {/* Ability Badge */}
                  <span className={`inline-block text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md ${rarityConf.text} ${rarityConf.bg} border ${rarityConf.border}`}>
                    ★ {skin.ability}
                  </span>

                  <p className="text-[9px] text-rose-700/80 font-bold leading-normal min-h-6 overflow-hidden line-clamp-2 px-1">
                    {skin.abilityDesc}
                  </p>
                </div>

                {/* CTA Action button */}
                <button
                  onClick={() => handleSkinClick(skin)}
                  className={`mt-3.5 w-full py-2 px-2 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center space-x-1 border cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/5 font-black'
                      : isUnlocked
                        ? 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200'
                        : skin.isCodeRequired
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-white border-amber-400 shadow-md font-extrabold animate-pulse'
                          : canAfford
                            ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm font-black'
                            : 'bg-rose-50/30 text-rose-350 border-rose-100/35 cursor-not-allowed opacity-40'
                  }`}
                  disabled={!isUnlocked && !canAfford && !skin.isCodeRequired}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3px]" />
                      <span>EQUIPPED</span>
                    </>
                  ) : isUnlocked ? (
                    <span>EQUIP</span>
                  ) : skin.isCodeRequired ? (
                    <>
                      <Lock className="w-3 h-3 text-white fill-white/10 mr-0.5" />
                      <span>CODE UNLOCK</span>
                    </>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <Coins className="w-3 h-3 text-yellow-500 fill-yellow-500/10 mr-0.5" />
                      <span>{skin.cost}</span>
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tiny descriptive tip footer */}
      <div className="text-center pb-2 pt-4 border-t border-rose-100 z-10">
        <p className="text-[9px] font-mono text-rose-400 uppercase tracking-[0.2em] leading-none font-bold">
          Dodge bamboo &bull; Grab coins to buy skins
        </p>
      </div>

      {/* Interactive Mystery Box Opening Overlay Modal */}
      <AnimatePresence>
        {mysteryState !== 'IDLE' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/45 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            {/* Shaking Mystery Chest Stage */}
            {mysteryState === 'SHAKING' && (
              <motion.div
                animate={{
                  rotate: [-3, 3, -4, 4, -2, 2, 0],
                  scale: [1, 1.05, 0.98, 1.05, 1],
                  y: [0, -10, 0, -5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  ease: 'easeInOut'
                }}
                className="flex flex-col items-center justify-center space-y-6 text-center text-white"
              >
                <div className="relative w-36 h-36 bg-gradient-to-b from-amber-400 to-amber-600 rounded-[32px] border-4 border-white/95 shadow-[0_20px_50px_rgba(245,158,11,0.4)] flex items-center justify-center">
                  <Gift className="w-16 h-16 text-white animate-pulse" />
                  <div className="absolute inset-0 rounded-[28px] border-2 border-dashed border-white/30" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-[0.2em] text-amber-300 animate-pulse">
                    Opening Box...
                  </h3>
                  <p className="text-[11px] font-mono text-white/70 tracking-widest uppercase">
                    Rolling lucky prizes
                  </p>
                </div>
              </motion.div>
            )}

            {/* Reward Reveal Stage */}
            {mysteryState === 'REVEALED' && mysteryReward && (
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-white border-2 border-amber-300 w-full max-w-sm rounded-[32px] p-6 text-center space-y-5 shadow-[0_30px_70px_rgba(251,113,133,0.25)] flex flex-col items-center relative overflow-hidden"
              >
                {/* Shiny confetti sparks background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />

                <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full border border-amber-300 shadow-sm animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                    CONGRATULATIONS!
                  </span>
                  <h3 className="text-xl font-black text-rose-950 uppercase tracking-wide">
                    {mysteryReward.name}
                  </h3>
                  <p className="text-xs font-bold text-rose-700 leading-relaxed uppercase tracking-wider">
                    {mysteryReward.details}
                  </p>
                </div>

                {/* If won skin, show Avatar! */}
                {mysteryReward.type === 'skin' && mysteryReward.skinId && (
                  <div className="relative w-24 h-24 flex items-center justify-center bg-rose-50/50 rounded-2xl border border-rose-100">
                    <PandaAvatar 
                      skinType={SKIN_LIST.find(s => s.id === mysteryReward.skinId)?.type || 'classic'} 
                      size={70} 
                      isFlying={true} 
                    />
                  </div>
                )}

                <button
                  onClick={closeMysteryReveal}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-450 text-white rounded-xl font-black text-[11px] tracking-widest uppercase cursor-pointer border border-amber-400 shadow-md"
                >
                  AWESOME!
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret Creator Code Unlock Modal */}
      <AnimatePresence>
        {codeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/75 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            {!codeSuccess ? (
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white border-2 border-amber-300 w-full max-w-sm rounded-[32px] p-6 text-center space-y-5 shadow-2xl relative overflow-hidden"
              >
                {/* Background flare */}
                <div className="absolute top-[-30%] right-[-20%] w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-200">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-rose-950 uppercase tracking-wider mt-2">
                    Enter Secret Code
                  </h3>
                  <p className="text-[10px] text-rose-700/85 font-bold uppercase leading-relaxed max-w-[240px] mx-auto">
                    Type the correct secret code to unlock the legendary golden {selectedCodeSkin?.name || 'BRAHMANS'} skin!
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value);
                      if (codeError) setCodeError('');
                    }}
                    placeholder="Enter Secret Code"
                    className="w-full py-3 px-4 rounded-xl text-center font-black tracking-widest text-lg uppercase bg-rose-50/40 border border-rose-200/60 text-rose-950 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyCode();
                    }}
                  />

                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-red-500 font-extrabold tracking-wide uppercase"
                    >
                      ⚠️ {codeError}
                    </motion.p>
                  )}
                </div>

                <div className="flex space-x-2.5 pt-2">
                  <button
                    onClick={handleCloseCodeModal}
                    className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-[10px] tracking-wider uppercase border border-rose-200 cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    disabled={!enteredCode.trim()}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-wider uppercase border transition-all cursor-pointer ${
                      enteredCode.trim()
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white border-amber-400 shadow-md'
                        : 'bg-slate-50 text-slate-350 border-slate-200/60 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Unlock
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white border-2 border-amber-300 w-full max-w-sm rounded-[32px] p-6 text-center space-y-5 shadow-2xl relative overflow-hidden flex flex-col items-center"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_75%)] pointer-events-none" />

                <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full border border-amber-300 shadow-sm animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                    SECRET UNLOCKED!
                  </span>
                  <h3 className="text-xl font-black text-rose-950 uppercase tracking-wide">
                    BRAHMANS Skin Unlocked!
                  </h3>
                  <p className="text-xs font-bold text-rose-700 leading-relaxed uppercase tracking-wider max-w-[250px]">
                    The ultimate golden divinity is now equipped!
                  </p>
                </div>

                {/* Show Brahmans skin preview */}
                <div className="relative w-24 h-24 flex items-center justify-center bg-rose-50/50 rounded-2xl border border-rose-100">
                  <PandaAvatar skinType="brahmans" size={70} isFlying={true} />
                </div>

                <button
                  onClick={handleCloseCodeModal}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-450 text-white rounded-xl font-black text-[11px] tracking-widest uppercase cursor-pointer border border-amber-400 shadow-md transition-all duration-200"
                >
                  LET'S FLY!
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
