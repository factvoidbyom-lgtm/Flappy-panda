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
    HARD: 0
  },
  coins: 0,
  unlockedSkins: ['classic'],
  equippedSkin: 'classic',
  gamesPlayed: 0,
  totalCoinsCollected: 0,
  storyLevelProgress: 1
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
    musicEnabled: true
  });
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('ENDLESS');
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  // Load stats, settings and daily missions on boot
  useEffect(() => {
    // Audio Settings
    const audioSet = loadAudioSettings();
    setSettings(audioSet);

    // User Stats
    try {
      const storedStats = localStorage.getItem('panda_user_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        // Ensure forward compatibility if stats fields change
        setStats({
          ...DEFAULT_STATS,
          ...parsed,
          highScore: {
            ...DEFAULT_STATS.highScore,
            ...parsed.highScore
          }
        });
      } else {
        localStorage.setItem('panda_user_stats', JSON.stringify(DEFAULT_STATS));
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

    const updated = {
      ...stats,
      highScore: newHighScores,
      coins: stats.coins + coinsEarned,
      totalCoinsCollected: stats.totalCoinsCollected + coinsEarned,
      gamesPlayed: stats.gamesPlayed + 1,
      storyLevelProgress: nextProgress
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
            equippedSkinId={stats.equippedSkin}
            coins={stats.coins}
            highScore={stats.highScore[difficulty]}
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
                setScreen('GAME');
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
              setScreen('GAME');
            }}
            onBack={() => setScreen('MENU')}
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
