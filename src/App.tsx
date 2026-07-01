import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameScreen, Difficulty, UserStats, GameSettings, DailyMission, generateDailyMissions, GameMode, STORY_LEVELS } from './types';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import DifficultySelect from './components/DifficultySelect';
import GameCanvas from './components/GameCanvas';
import Shop from './components/Shop';
import Settings from './components/Settings';
import StoryLevelsSelect from './components/StoryLevelsSelect';
import PreGameLoading from './components/PreGameLoading';
import LuckySpin from './components/LuckySpin';
import DailyRewards from './components/DailyRewards';
import SkillTree from './components/SkillTree';
import { 
  loadAudioSettings, 
  setSoundEnabled, 
  setMusicEnabled, 
  startMusic, 
  stopMusic,
  playCoin
} from './utils/audio';

const DEFAULT_STATS: UserStats = {
  highScore: {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    INSANE: 0
  },
  coins: 100,
  unlockedSkins: ['classic'],
  equippedSkin: 'classic',
  gamesPlayed: 0,
  totalCoinsCollected: 0,
  storyLevelProgress: 1,
  xp: 0,
  playerLevel: 1,
  characterLevels: { classic: 1 },
  skillsUnlocked: [],
  luckySpinsRemaining: 1,
  nextSpinAvailableAt: 0,
  totalPlayTime: 0,
  bossesDefeated: 0,
  missionsCompleted: 0,
  achievementsClaimed: []
};

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('LOADING');
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    graphicsQuality: 'HIGH',
    fpsLimit: 60,
    batterySaver: false,
    language: 'EN'
  });
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('ENDLESS');
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  // Load stats, settings and daily missions on boot
  useEffect(() => {
    // Audio Settings
    const audioSet = loadAudioSettings();
    setSettings({
      soundEnabled: audioSet.soundEnabled,
      musicEnabled: audioSet.musicEnabled,
      vibrationEnabled: true,
      graphicsQuality: 'HIGH',
      fpsLimit: 60,
      batterySaver: false,
      language: 'EN'
    });

    // User Stats
    try {
      const storedStats = localStorage.getItem('panda_user_stats');
      const todayStr = getTodayDateString();
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        
        // Daily lucky spin tickets reset/restoration on calendar day change or exact 24h timer expiration
        let spinsRemaining = parsed.luckySpinsRemaining !== undefined ? parsed.luckySpinsRemaining : 1;
        let nextSpinAt = parsed.nextSpinAvailableAt || 0;
        
        if (spinsRemaining === 0 && nextSpinAt && Date.now() >= nextSpinAt) {
          spinsRemaining = 1;
          nextSpinAt = 0;
        }

        const storedSpinsDate = localStorage.getItem('panda_last_spin_reset_date');
        const todayStr = getTodayDateString();
        if (storedSpinsDate !== todayStr && spinsRemaining === 0) {
          spinsRemaining = 1;
          nextSpinAt = 0;
          localStorage.setItem('panda_last_spin_reset_date', todayStr);
        }

        const updatedStats = {
          ...DEFAULT_STATS,
          ...parsed,
          luckySpinsRemaining: spinsRemaining,
          nextSpinAvailableAt: nextSpinAt,
          highScore: {
            ...DEFAULT_STATS.highScore,
            ...parsed.highScore
          }
        };

        setStats(updatedStats);
        // Persist updated spin statuses back
        localStorage.setItem('panda_user_stats', JSON.stringify(updatedStats));
      } else {
        localStorage.setItem('panda_user_stats', JSON.stringify(DEFAULT_STATS));
        localStorage.setItem('panda_last_spin_reset_date', todayStr);
      }
    } catch (e) {
      console.error('Failed to load user stats from localStorage:', e);
    }

    // Daily Missions
    const todayStr = getTodayDateString();
    const storedMissions = localStorage.getItem('panda_daily_missions');
    if (storedMissions) {
      try {
        const parsed = JSON.parse(storedMissions);
        if (parsed.date === todayStr && Array.isArray(parsed.list) && parsed.list.length > 0) {
          setMissions(parsed.list);
        } else {
          const fresh = generateDailyMissions();
          setMissions(fresh);
          localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: fresh }));
        }
      } catch (e) {
        const fresh = generateDailyMissions();
        setMissions(fresh);
        localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: fresh }));
      }
    } else {
      const fresh = generateDailyMissions();
      setMissions(fresh);
      localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: fresh }));
    }
  }, []);

  // Control background music loops based on screen state and settings
  useEffect(() => {
    if (screen !== 'LOADING' && settings.musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [screen, settings.musicEnabled]);

  // Save stats to localStorage helper
  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    try {
      localStorage.setItem('panda_user_stats', JSON.stringify(newStats));
    } catch (e) {
      console.error('Failed to write user stats to localStorage:', e);
    }
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setSoundEnabled(newSettings.soundEnabled);
    setMusicEnabled(newSettings.musicEnabled);
  };

  const handleBuySkin = (skinId: string, cost: number) => {
    const updated = {
      ...stats,
      coins: stats.coins - cost,
      unlockedSkins: [...stats.unlockedSkins, skinId],
      equippedSkin: skinId // auto-equip upon purchase!
    };
    saveStats(updated);
  };

  const handleEquipSkin = (skinId: string) => {
    const updated = {
      ...stats,
      equippedSkin: skinId
    };
    saveStats(updated);
  };

  const updateMissionsProgress = (
    finalScore: number, 
    coinsEarned: number, 
    jumpsCount: number, 
    playedDifficulty: Difficulty
  ) => {
    const todayStr = getTodayDateString();
    setMissions((prevMissions) => {
      const updatedList = prevMissions.map((m) => {
        if (m.completed) return m;

        let addedProgress = 0;
        if (m.type === 'games_played') {
          addedProgress = 1;
        } else if (m.type === 'jumps') {
          addedProgress = jumpsCount;
        } else if (m.type === 'coins_collected') {
          addedProgress = coinsEarned;
        } else if (m.type === 'single_score') {
          if (m.difficultyParam) {
            if (playedDifficulty === m.difficultyParam) {
              if (finalScore >= m.target) {
                addedProgress = m.target - m.progress;
              }
            }
          } else {
            if (finalScore >= m.target) {
              addedProgress = m.target - m.progress;
            }
          }
        } else if (m.type === 'play_difficulty') {
          if (playedDifficulty === m.difficultyParam) {
            addedProgress = 1;
          }
        }

        const newProgress = Math.min(m.target, m.progress + addedProgress);
        const completed = newProgress >= m.target;

        return {
          ...m,
          progress: newProgress,
          completed
        };
      });

      try {
        localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: updatedList }));
      } catch (e) {
        console.error('Failed to write daily missions to localStorage:', e);
      }
      return updatedList;
    });
  };

  const handleClaimReward = (missionId: string, rewardCoins: number) => {
    // 1. Play coin collect audio
    playCoin();

    // 2. Add coins to stats
    const updatedStats = {
      ...stats,
      coins: stats.coins + rewardCoins,
      totalCoinsCollected: stats.totalCoinsCollected + rewardCoins
    };
    saveStats(updatedStats);

    // 3. Mark mission as claimed
    const todayStr = getTodayDateString();
    setMissions((prevMissions) => {
      const updatedList = prevMissions.map((m) => {
        if (m.id === missionId) {
          return { ...m, claimed: true };
        }
        return m;
      });
      try {
        localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: updatedList }));
      } catch (e) {
        console.error('Failed to write daily missions to localStorage:', e);
      }
      return updatedList;
    });
  };

  const handleGameOver = (finalScore: number, coinsEarned: number, jumpsCount: number, playedDifficulty: Difficulty, isLevelCleared?: boolean) => {
    const isNewRecord = finalScore > stats.highScore[playedDifficulty];
    const newHighScores = {
      ...stats.highScore,
      [playedDifficulty]: isNewRecord ? finalScore : stats.highScore[playedDifficulty]
    };

    let nextProgress = stats.storyLevelProgress || 1;
    if (gameMode === 'STORY' && isLevelCleared && selectedLevelId) {
      if (selectedLevelId === nextProgress && nextProgress < 5) {
        nextProgress = nextProgress + 1;
      }
    }

    // XP calculation: 10 XP per point, 2 XP per coin, 100 XP per story level clear
    const scoreXp = finalScore * 10;
    const coinsXp = coinsEarned * 2;
    const levelClearXp = (gameMode === 'STORY' && isLevelCleared) ? 100 : 0;
    const earnedXp = scoreXp + coinsXp + levelClearXp;

    let updatedXp = (stats.xp || 0) + earnedXp;
    let updatedLevel = stats.playerLevel || 1;
    
    // Formula: level * 200 XP needed to level up
    while (updatedXp >= updatedLevel * 200) {
      updatedXp -= updatedLevel * 200;
      updatedLevel += 1;
    }

    // Update character level slightly with game play (chance to level up on run completion)
    const charLevels = { ...(stats.characterLevels || {}) };
    const currentSkinId = stats.equippedSkin || 'classic';
    const currentSkinLvl = charLevels[currentSkinId] || 1;
    if (Math.random() < 0.25 && currentSkinLvl < 10) {
      charLevels[currentSkinId] = currentSkinLvl + 1;
    }

    const updated = {
      ...stats,
      highScore: newHighScores,
      coins: stats.coins + coinsEarned,
      totalCoinsCollected: stats.totalCoinsCollected + coinsEarned,
      gamesPlayed: stats.gamesPlayed + 1,
      storyLevelProgress: nextProgress,
      xp: updatedXp,
      playerLevel: updatedLevel,
      characterLevels: charLevels,
      bossesDefeated: (stats.bossesDefeated || 0) + (finalScore >= 15 ? 1 : 0)
    };

    saveStats(updated);
    updateMissionsProgress(finalScore, coinsEarned, jumpsCount, playedDifficulty);
  };

  const handleResetProgress = () => {
    localStorage.removeItem('panda_user_stats');
    localStorage.removeItem('panda_daily_missions');
    saveStats(DEFAULT_STATS);

    const fresh = generateDailyMissions();
    setMissions(fresh);
    const todayStr = getTodayDateString();
    localStorage.setItem('panda_daily_missions', JSON.stringify({ date: todayStr, list: fresh }));
    
    const resetSettings = { soundEnabled: true, musicEnabled: true };
    setSettings(resetSettings);
    setSoundEnabled(true);
    setMusicEnabled(true);
    
    setScreen('MENU');
  };

  const renderActiveScreen = () => {
    switch (screen) {
      case 'LOADING':
        return <LoadingScreen onComplete={() => setScreen('MENU')} />;
      case 'MENU':
        return (
          <MainMenu
            stats={stats}
            missions={missions}
            onClaimReward={handleClaimReward}
            onNavigate={(next) => {
              if (next === 'STORY_LEVELS') {
                setGameMode('STORY');
                setScreen('STORY_LEVELS');
              } else if (next === 'DIFFICULTY') {
                setGameMode('ENDLESS');
                setScreen('DIFFICULTY');
              } else if (next === 'GAME') {
                setGameMode('ENDLESS');
                setScreen('GAME');
              } else {
                setScreen(next);
              }
            }}
          />
        );
      case 'STORY_LEVELS':
        return (
          <StoryLevelsSelect
            stats={stats}
            onBack={() => setScreen('MENU')}
            onSelectLevel={(levelId) => {
              const lvl = STORY_LEVELS.find(l => l.id === levelId);
              if (lvl) {
                setGameMode('STORY');
                setSelectedLevelId(levelId);
                setDifficulty(lvl.difficulty);
                setScreen('PRE_GAME_LOADING');
              }
            }}
          />
        );
      case 'DIFFICULTY':
        return (
          <DifficultySelect
            onSelect={(selectedDifficulty) => {
              setGameMode('ENDLESS');
              setDifficulty(selectedDifficulty);
              setScreen('PRE_GAME_LOADING');
            }}
            onBack={() => setScreen('MENU')}
          />
        );
      case 'PRE_GAME_LOADING':
        return (
          <PreGameLoading
            difficulty={difficulty}
            equippedSkinId={stats.equippedSkin}
            onComplete={() => setScreen('GAME')}
          />
        );
      case 'GAME':
        return (
          <GameCanvas
            difficulty={difficulty}
            equippedSkinId={stats.equippedSkin}
            gameMode={gameMode}
            selectedLevelId={selectedLevelId}
            onGameOver={handleGameOver}
            onNavigate={(dest) => setScreen(dest)}
          />
        );
      case 'SHOP':
        return (
          <Shop
            coins={stats.coins}
            unlockedSkins={stats.unlockedSkins}
            equippedSkinId={stats.equippedSkin}
            onBuySkin={handleBuySkin}
            onEquipSkin={handleEquipSkin}
            onBack={() => setScreen('MENU')}
          />
        );
      case 'SETTINGS':
        return (
          <Settings
            settings={settings}
            stats={stats}
            onUpdateSettings={handleUpdateSettings}
            onResetProgress={handleResetProgress}
            onBack={() => setScreen('MENU')}
          />
        );
      case 'LUCKY_SPIN':
        return (
          <LuckySpin
            coins={stats.coins}
            unlockedSkins={stats.unlockedSkins}
            luckySpinsRemaining={stats.luckySpinsRemaining || 0}
            nextSpinAvailableAt={stats.nextSpinAvailableAt || 0}
            onBack={() => setScreen('MENU')}
            onWinCoins={(amount) => {
              const updated = {
                ...stats,
                coins: stats.coins + amount,
                totalCoinsCollected: stats.totalCoinsCollected + amount
              };
              saveStats(updated);
            }}
            onWinSkin={(skinId) => {
              const updated = {
                ...stats,
                unlockedSkins: [...stats.unlockedSkins, skinId]
              };
              saveStats(updated);
            }}
            onDeductSpin={() => {
              const nextSpins = Math.max(0, (stats.luckySpinsRemaining || 1) - 1);
              const updated = {
                ...stats,
                luckySpinsRemaining: nextSpins,
                nextSpinAvailableAt: nextSpins === 0 ? Date.now() + 24 * 60 * 60 * 1000 : stats.nextSpinAvailableAt
              };
              saveStats(updated);
            }}
            onAwardFreeSpin={() => {
              const updated = {
                ...stats,
                luckySpinsRemaining: (stats.luckySpinsRemaining || 0) + 1,
                nextSpinAvailableAt: 0
              };
              saveStats(updated);
            }}
          />
        );
      case 'DAILY_REWARDS':
        return (
          <DailyRewards
            coins={stats.coins}
            unlockedSkins={stats.unlockedSkins}
            lastDailyRewardCollected={stats.lastDailyRewardCollected}
            onBack={() => setScreen('MENU')}
            onClaimReward={(rewardCoins, awardSkinId, isSpinReward) => {
              const todayStr = getTodayDateString();
              const updated = {
                ...stats,
                coins: stats.coins + rewardCoins,
                totalCoinsCollected: stats.totalCoinsCollected + rewardCoins,
                lastDailyRewardCollected: todayStr
              };
              if (awardSkinId) {
                updated.unlockedSkins = [...updated.unlockedSkins, awardSkinId];
              }
              if (isSpinReward) {
                updated.luckySpinsRemaining = (updated.luckySpinsRemaining || 0) + 1;
              }
              saveStats(updated);
            }}
          />
        );
      case 'SKILL_TREE':
        return (
          <SkillTree
            coins={stats.coins}
            skillsUnlocked={stats.skillsUnlocked || []}
            onBack={() => setScreen('MENU')}
            onUnlockSkill={(skillId, cost) => {
              const updated = {
                ...stats,
                coins: stats.coins - cost,
                skillsUnlocked: [...(stats.skillsUnlocked || []), skillId]
              };
              saveStats(updated);
            }}
          />
        );
      default:
        return <LoadingScreen onComplete={() => setScreen('MENU')} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#ffe5ec] flex items-center justify-center font-sans antialiased select-none">
      {/* Dynamic Screen Container Frame
          Acts as a beautiful mobile-bezel frame on desktop monitors,
          and seamlessly scales to take up 100% space on smaller mobile screens. */}
      <div className="relative w-full h-screen md:max-w-[430px] md:h-[840px] md:max-h-[92vh] md:rounded-[36px] md:shadow-[0_24px_50px_rgba(251,113,133,0.15)] md:border-[10px] md:border-white bg-[#fff0f3] overflow-hidden flex flex-col justify-between">
        
        {/* Render Active View */}
        <div className="w-full h-full relative overflow-hidden bg-[#fff5f6]">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              {renderActiveScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Digital Camera Notch simulation for aesthetic mobile styling (Only visible on medium sizes and above) */}
        <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5.5 bg-slate-800 rounded-b-xl z-50 pointer-events-none">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 rounded-full border border-slate-700/50" />
        </div>
      </div>
    </div>
  );
}
