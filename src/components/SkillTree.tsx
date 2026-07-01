import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Lock, Check, Shield, Maximize, Zap, Star, Coins } from 'lucide-react';
import { playClick, playUnlock } from '../utils/audio';

interface SkillTreeProps {
  coins: number;
  skillsUnlocked: string[];
  onBack: () => void;
  onUnlockSkill: (skillId: string, cost: number) => void;
}

const SKILL_NODES = [
  {
    id: 'shield_duration',
    name: 'Shield Capacitor',
    description: 'Increases the duration and impact radius of shields by 25%.',
    cost: 200,
    icon: Shield,
    accent: '#06b6d4'
  },
  {
    id: 'magnet_range',
    name: 'Magnetic Resonance',
    description: 'Expands the suction range of Coin Magnet power-ups by 40%.',
    cost: 350,
    icon: Maximize,
    accent: '#a855f7'
  },
  {
    id: 'near_miss_xp',
    name: 'Near-Miss Surge',
    description: 'Doubles the XP and score combo multipliers awarded on near-miss dodges.',
    cost: 500,
    icon: Zap,
    accent: '#eab308'
  },
  {
    id: 'lucky_bamboo',
    name: 'Grove Blessing',
    description: 'Increases the spawn frequency of Heart Bamboo and Golden Bamboo by 35%.',
    cost: 750,
    icon: Star,
    accent: '#10b981'
  }
];

export default function SkillTree({
  coins,
  skillsUnlocked,
  onBack,
  onUnlockSkill
}: SkillTreeProps) {
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILL_NODES[0] | null>(null);

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleNodeClick = (skill: typeof SKILL_NODES[0]) => {
    playClick();
    setSelectedSkill(skill);
  };

  const handlePurchase = () => {
    if (!selectedSkill) return;
    const isUnlocked = skillsUnlocked.includes(selectedSkill.id);
    if (isUnlocked || coins < selectedSkill.cost) {
      playClick();
      return;
    }

    playUnlock();
    onUnlockSkill(selectedSkill.id, selectedSkill.cost);
  };

  return (
    <div 
      id="skill-tree-panel"
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
            className="p-2.5 bg-white/85 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-rose-600" />
          </button>
          <div>
            <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950 leading-none block">Grove Talents</span>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-rose-400 mt-0.5 block">UPGRADE CORE panda stats</span>
          </div>
        </div>

        {/* Coins Counter */}
        <div className="flex items-center space-x-1.5 bg-white/85 backdrop-blur-md shadow-md py-1.5 px-3.5 rounded-full border border-rose-200/50">
          <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/15" />
          <span className="text-xs font-mono font-bold text-rose-950">{coins}</span>
        </div>
      </div>

      {/* Interactive Node Map Stage */}
      <div className="flex-grow flex flex-col justify-center items-center z-10 py-6 relative">
        
        {/* Decorative connecting energy path lines */}
        <div className="absolute w-1 h-[220px] bg-rose-200/40 pointer-events-none rounded-full" />

        <div className="flex flex-col space-y-12 w-full max-w-[280px] relative">
          {SKILL_NODES.map((node, index) => {
            const isUnlocked = skillsUnlocked.includes(node.id);
            const isSelected = selectedSkill?.id === node.id;
            const Icon = node.icon;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center justify-between gap-4 p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'bg-white border-rose-400 shadow-[0_8px_24px_rgba(251,113,133,0.15)] ring-2 ring-rose-400/20' 
                    : isUnlocked 
                      ? 'bg-emerald-500/[0.04] border-emerald-200 hover:bg-emerald-500/[0.08]' 
                      : 'bg-white/80 border-rose-100 hover:border-rose-300'
                }`}
                onClick={() => handleNodeClick(node)}
              >
                <div className="flex items-center space-x-3.5 text-left">
                  {/* Upgrade Circle Icon */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                      isUnlocked 
                        ? 'bg-emerald-500/10 border-emerald-300 text-emerald-600' 
                        : 'bg-rose-50 border-rose-100 text-rose-400'
                    }`}
                    style={isUnlocked ? { color: node.accent } : {}}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2px]" />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono font-black text-rose-400 uppercase tracking-widest">TIER {index + 1} Upgrade</span>
                    <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide leading-none">{node.name}</h4>
                  </div>
                </div>

                <div className="shrink-0">
                  {isUnlocked ? (
                    <div className="p-1 bg-emerald-500/10 border border-emerald-300 text-emerald-600 rounded-full">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                  ) : (
                    <div className="p-1 bg-rose-50 border border-rose-100 text-rose-400 rounded-full">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Drawer Description and Upgrade Button */}
      <div className="bg-white/90 border border-rose-100 rounded-2xl p-4.5 z-10 shadow-md">
        <AnimatePresence mode="wait">
          {selectedSkill ? (
            <motion.div
              key={selectedSkill.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="space-y-4 text-left"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide">{selectedSkill.name}</h4>
                  <span
                    className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: selectedSkill.accent }}
                  >
                    TALENT
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-rose-750 leading-relaxed uppercase tracking-wider">{selectedSkill.description}</p>
              </div>

              {skillsUnlocked.includes(selectedSkill.id) ? (
                <div className="w-full py-3 bg-emerald-500/10 border border-emerald-300 text-emerald-700 rounded-xl text-center font-black text-[10px] tracking-widest uppercase flex items-center justify-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>UPGRADE PERMANENTLY UNLOCKED</span>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={coins < selectedSkill.cost}
                  className={`w-full py-3.5 rounded-xl font-black text-[10px] tracking-widest uppercase border transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md ${
                    coins >= selectedSkill.cost
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white border-rose-400 shadow-rose-500/10'
                      : 'bg-rose-50/50 text-rose-350 border-rose-100 cursor-not-allowed shadow-none opacity-50'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/15" />
                  <span>UPGRADE FOR {selectedSkill.cost} COINS</span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="text-center py-6 text-rose-500 font-bold uppercase tracking-wider text-[10px] h-[100px] flex items-center justify-center"
            >
              SELECT A TALENT NODE TO UPGRADE STATS
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center pt-4 pb-2 z-10 shrink-0">
        <p className="text-[8px] font-mono font-black text-rose-400/80 tracking-[0.25em] uppercase text-center animate-pulse">
          Created by OM BRAHMAN
        </p>
      </div>
    </div>
  );
}
