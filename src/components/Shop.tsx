import { motion } from 'motion/react';
import { ArrowLeft, Lock, Coins, Check } from 'lucide-react';
import { SKIN_LIST, PandaSkin } from '../types';
import PandaAvatar from './PandaAvatar';
import { playClick, playUnlock } from '../utils/audio';

interface ShopProps {
  coins: number;
  unlockedSkins: string[];
  equippedSkinId: string;
  onBuySkin: (skinId: string, cost: number) => void;
  onEquipSkin: (skinId: string) => void;
  onBack: () => void;
}

export default function Shop({
  coins,
  unlockedSkins,
  equippedSkinId,
  onBuySkin,
  onEquipSkin,
  onBack
}: ShopProps) {

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
      // Skin is locked, check if we have enough coins
      if (coins >= skin.cost) {
        playUnlock();
        onBuySkin(skin.id, skin.cost);
      } else {
        // Can't afford
        playClick();
      }
    }
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

      {/* Skins Grid Container */}
      <div className="flex-grow overflow-y-auto pr-1 my-6 space-y-4 custom-scrollbar z-10">
        <div className="grid grid-cols-2 gap-3.5">
          {SKIN_LIST.map((skin, idx) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            const canAfford = coins >= skin.cost;

            return (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative flex flex-col items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
                  isEquipped 
                    ? 'border-emerald-500 bg-white shadow-[0_6px_20px_rgba(16,185,129,0.12)]' 
                    : isUnlocked 
                      ? 'border-rose-100 hover:border-rose-300 hover:bg-white' 
                      : 'border-rose-100/50 bg-rose-50/35'
                }`}
              >
                {/* Skin Preview Icon */}
                <div className="relative w-18 h-18 flex items-center justify-center my-1.5">
                  <div className="absolute inset-0 rounded-full bg-rose-50/50 border border-rose-100" />
                  <PandaAvatar skinType={skin.type} size={58} isFlying={isEquipped} />
                </div>

                {/* Info Text */}
                <div className="text-center w-full mt-2">
                  <h3 className="text-xs font-black text-rose-950 tracking-wider uppercase mb-1">
                    {skin.name}
                  </h3>
                  <p className="text-[9px] text-rose-700/80 font-bold leading-relaxed h-7 overflow-hidden line-clamp-2 px-1">
                    {skin.description}
                  </p>
                </div>

                {/* CTA Action button */}
                <button
                  onClick={() => handleSkinClick(skin)}
                  className={`mt-3 w-full py-2 px-2 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center space-x-1 border cursor-pointer ${
                    isEquipped
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/5 font-black'
                      : isUnlocked
                        ? 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200'
                        : canAfford
                          ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm font-black'
                          : 'bg-rose-50/30 text-rose-300 border-rose-100/30 cursor-not-allowed opacity-40'
                  }`}
                  disabled={!isUnlocked && !canAfford}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3px]" />
                      <span>EQUIPPED</span>
                    </>
                  ) : isUnlocked ? (
                    <span>EQUIP</span>
                  ) : (
                    <span className="flex items-center space-x-1.5 font-sans font-black">
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
      <div className="text-center pb-4 pt-4 border-t border-rose-100 z-10">
        <p className="text-[9px] font-mono text-rose-400 uppercase tracking-[0.2em] leading-none font-bold">
          Dodge bamboo &bull; Grab coins to buy skins
        </p>
      </div>
    </div>
  );
}
