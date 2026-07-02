export type GameScreen = 'INTRO' | 'LOADING' | 'MENU' | 'DIFFICULTY' | 'GAME' | 'SHOP' | 'SETTINGS' | 'STORY_LEVELS' | 'PRE_GAME_LOADING' | 'LUCKY_SPIN' | 'DAILY_REWARDS' | 'SKILL_TREE';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';

export type GameMode = 'ENDLESS' | 'STORY';

export interface PandaSkin {
  id: string;
  name: string;
  cost: number;
  description: string;
  type: 'classic' | 'red' | 'astro' | 'ninja' | 'golden' | 'sakura' | 'frosty' | 'sprite' | 'ghost' | 'cyber' | 'storm' | 'chrono' | 'emperor' | 'brahmans';
  accentColor: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  ability: string;
  abilityDesc: string;
  isCodeRequired?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  fpsLimit: 30 | 60;
  batterySaver: boolean;
  language: 'EN' | 'ES' | 'FR' | 'DE' | 'HI';
}

export interface UserStats {
  highScore: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
    INSANE: number;
  };
  coins: number;
  unlockedSkins: string[]; // skin IDs
  equippedSkin: string; // skin ID
  gamesPlayed: number;
  totalCoinsCollected: number;
  storyLevelProgress?: number; // 1-based level progress index
  xp: number;
  playerLevel: number;
  characterLevels: Record<string, number>; // skinId -> level
  skillsUnlocked: string[]; // skill IDs: 'shield_duration' | 'magnet_range' | 'near_miss_xp' | 'extra_multiplier'
  lastDailyRewardCollected?: string; // date string (YYYY-MM-DD)
  luckySpinsRemaining: number;
  nextSpinAvailableAt?: number; // timestamp in milliseconds
  totalPlayTime: number; // in seconds
  bossesDefeated: number;
  missionsCompleted: number;
  achievementsClaimed: string[]; // achievement IDs
}

export interface DifficultyConfig {
  speed: number;
  gapSize: number;
  spawnRate: number; // in frames
  gravity: number;
  jumpForce: number;
}

export const SKIN_LIST: PandaSkin[] = [
  {
    id: 'classic',
    name: 'Classic Panda',
    cost: 0,
    description: 'The traditional black and white bundle of joy.',
    type: 'classic',
    accentColor: '#1f2937',
    rarity: 'Common',
    ability: 'Balance',
    abilityDesc: 'Standard physics and movement bounds.'
  },
  {
    id: 'red',
    name: 'Red Panda',
    cost: 80,
    description: 'A cute, fiery rust-colored forest glider.',
    type: 'red',
    accentColor: '#ea580c',
    rarity: 'Common',
    ability: 'Glide',
    abilityDesc: 'Falls 20% slower when falling.'
  },
  {
    id: 'sakura',
    name: 'Sakura Panda',
    cost: 150,
    description: 'A beautiful blossom traveler with pink ears.',
    type: 'sakura',
    accentColor: '#f43f5e',
    rarity: 'Common',
    ability: 'Cherry Blossom',
    abilityDesc: 'Increases score multiplier gains by 15%.'
  },
  {
    id: 'astro',
    name: 'Astro Panda',
    cost: 250,
    description: 'Equipped with a space helmet, ready for orbit.',
    type: 'astro',
    accentColor: '#38bdf8',
    rarity: 'Rare',
    ability: 'Anti-Gravity',
    abilityDesc: 'Reduces gravity effect by 15%.'
  },
  {
    id: 'frosty',
    name: 'Frosty Panda',
    cost: 350,
    description: 'A cool, icy panda from the high glacier peaks.',
    type: 'frosty',
    accentColor: '#0ea5e9',
    rarity: 'Rare',
    ability: 'Snow Drift',
    abilityDesc: 'Slows down moving bamboo velocities by 30%.'
  },
  {
    id: 'sprite',
    name: 'Bamboo Sprite',
    cost: 450,
    description: 'A glowing green sprite who lives in the forest canopy.',
    type: 'sprite',
    accentColor: '#10b981',
    rarity: 'Rare',
    ability: 'Nature Grace',
    abilityDesc: 'Heart bamboo items appear 50% more often.'
  },
  {
    id: 'ninja',
    name: 'Ninja Panda',
    cost: 650,
    description: 'Silent but deadly. Wears a black mask and headband.',
    type: 'ninja',
    accentColor: '#4b5563',
    rarity: 'Epic',
    ability: 'Double Jump',
    abilityDesc: 'Allows a secondary jump flap in mid-air!'
  },
  {
    id: 'ghost',
    name: 'Ghost Panda',
    cost: 800,
    description: 'Fades in and out of the spiritual plane.',
    type: 'ghost',
    accentColor: '#a855f7',
    rarity: 'Epic',
    ability: 'Spectral Phase',
    abilityDesc: 'Provides 0.6 seconds of phase-invincibility on near-miss.'
  },
  {
    id: 'cyber',
    name: 'Cyber Panda',
    cost: 1000,
    description: 'Augmented with neon circuits and a visor.',
    type: 'cyber',
    accentColor: '#06b6d4',
    rarity: 'Epic',
    ability: 'Start Shield',
    abilityDesc: 'Always starts every run with an active shield!'
  },
  {
    id: 'storm',
    name: 'Storm Panda',
    cost: 1500,
    description: 'Surrounded by crackling static and thunderbolts.',
    type: 'storm',
    accentColor: '#eab308',
    rarity: 'Legendary',
    ability: 'Lightning Bolt',
    abilityDesc: 'Double click screen to unleash a short hyper-dash!'
  },
  {
    id: 'golden',
    name: 'Golden Panda',
    cost: 2000,
    description: 'Shiny and pure gold. Absolute royalty.',
    type: 'golden',
    accentColor: '#fbbf24',
    rarity: 'Legendary',
    ability: 'Midas Touch',
    abilityDesc: 'Causes all normal coins to have double value.'
  },
  {
    id: 'chrono',
    name: 'Chrono Panda',
    cost: 3000,
    description: 'Wields the mysterious gear of time travel.',
    type: 'chrono',
    accentColor: '#ec4899',
    rarity: 'Mythic',
    ability: 'Time Bend',
    abilityDesc: 'Slows down the base speed of obstacles by 15%.'
  },
  {
    id: 'emperor',
    name: 'Emperor Panda',
    cost: 5000,
    description: 'The royal ruler of the bamboo empire.',
    type: 'emperor',
    accentColor: '#ef4444',
    rarity: 'Mythic',
    ability: 'Imperial Will',
    abilityDesc: 'Increases starting maximum hearts count to 4.'
  },
  {
    id: 'brahmans',
    name: 'BRAHMANS',
    cost: 0,
    description: 'The ultimate golden divinity created by OM BRAHMAN. Unleashed only with the cosmic code.',
    type: 'brahmans',
    accentColor: '#fbbf24',
    rarity: 'Mythic',
    ability: 'Divine Aurora',
    abilityDesc: 'Golden protection shield, 2x coins, and slower obstacles!',
    isCodeRequired: true
  }
];

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    speed: 2.2,
    gapSize: 185,
    spawnRate: 110,
    gravity: 0.32,
    jumpForce: -6.8
  },
  MEDIUM: {
    speed: 3.2,
    gapSize: 150,
    spawnRate: 90,
    gravity: 0.42,
    jumpForce: -8.0
  },
  HARD: {
    speed: 4.2,
    gapSize: 125,
    spawnRate: 75,
    gravity: 0.50,
    jumpForce: -9.0
  },
  INSANE: {
    speed: 5.3,
    gapSize: 108,
    spawnRate: 64,
    gravity: 0.58,
    jumpForce: -10.0
  }
};

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'jumps' | 'games_played' | 'coins_collected' | 'single_score' | 'play_difficulty';
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
  difficultyParam?: Difficulty;
}

const MISSION_POOL: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'flap_master',
    title: 'Flap Master',
    description: 'Flap wings 80 times across games today',
    type: 'jumps',
    target: 80,
    reward: 40
  },
  {
    id: 'frequent_flyer',
    title: 'Frequent Flyer',
    description: 'Play 3 total game runs today',
    type: 'games_played',
    target: 3,
    reward: 30
  },
  {
    id: 'gold_rush',
    title: 'Gold Rush',
    description: 'Collect 15 celestial coins today',
    type: 'coins_collected',
    target: 15,
    reward: 35
  },
  {
    id: 'easy_ascent',
    title: 'Easy Ascent',
    description: 'Score 15 points in Easy Mode',
    type: 'single_score',
    target: 15,
    reward: 25,
    difficultyParam: 'EASY'
  },
  {
    id: 'medium_zenith',
    title: 'Medium Zenith',
    description: 'Score 12 points in Medium Mode',
    type: 'single_score',
    target: 12,
    reward: 40,
    difficultyParam: 'MEDIUM'
  },
  {
    id: 'hardcore_trial',
    title: 'Hardcore Trial',
    description: 'Score 8 points in Hard Mode',
    type: 'single_score',
    target: 8,
    reward: 50,
    difficultyParam: 'HARD'
  },
  {
    id: 'forest_survivor',
    title: 'Forest Survivor',
    description: 'Score 10 points in any single run',
    type: 'single_score',
    target: 10,
    reward: 30
  },
  {
    id: 'hard_dare',
    title: 'Hard Mode Dare',
    description: 'Play 1 game on Hard Mode today',
    type: 'play_difficulty',
    target: 1,
    reward: 30,
    difficultyParam: 'HARD'
  }
];

export function generateDailyMissions(): DailyMission[] {
  const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((m, idx) => ({
    ...m,
    id: `${m.id}_${idx}`, // unique id instance for today
    progress: 0,
    completed: false,
    claimed: false
  }));
}

export interface StoryLevel {
  id: number;
  name: string;
  description: string;
  targetScore: number;
  difficulty: Difficulty;
  theme: 'sunrise' | 'snow' | 'mist' | 'twilight' | 'tempest';
  weather: 'clear' | 'snow' | 'mist' | 'clear' | 'rain_lightning';
  bgGradStart: string;
  bgGradEnd: string;
}

export const STORY_LEVELS: StoryLevel[] = [
  {
    id: 1,
    name: 'Sunrise Sanctuary',
    description: 'A serene dawn flight through gold-dappled bamboo forest groves.',
    targetScore: 10,
    difficulty: 'EASY',
    theme: 'sunrise',
    weather: 'clear',
    bgGradStart: '#fff7ed', // orange-50 (sunny warm dawn)
    bgGradEnd: '#fecdd3', // rose-200 (rose dawn)
  },
  {
    id: 2,
    name: 'Snowy Zen Peaks',
    description: 'Brave freezing winds and tumbling soft snow over icy high-altitude mountains.',
    targetScore: 15,
    difficulty: 'MEDIUM',
    theme: 'snow',
    weather: 'snow',
    bgGradStart: '#e0f2fe', // sky-100 (icy blue)
    bgGradEnd: '#bae6fd', // sky-200
  },
  {
    id: 3,
    name: 'Misty Bamboo Grove',
    description: 'Glide carefully through ancient rolling fog with falling cherry blossoms.',
    targetScore: 20,
    difficulty: 'MEDIUM',
    theme: 'mist',
    weather: 'mist',
    bgGradStart: '#f1f5f9', // slate-100 (foggy gray)
    bgGradEnd: '#cbd5e1', // slate-300
  },
  {
    id: 4,
    name: 'Twilight Fireflies',
    description: 'As twilight settles, navigate by glowing fireflies and mystical purples.',
    targetScore: 25,
    difficulty: 'HARD',
    theme: 'twilight',
    weather: 'clear',
    bgGradStart: '#1e1b4b', // indigo-950 (twilight purple)
    bgGradEnd: '#312e81', // indigo-900
  },
  {
    id: 5,
    name: 'Cosmic Tempest',
    description: 'Outrun heavy tropical monsoon rains, storms, and crackling lightning.',
    targetScore: 30,
    difficulty: 'HARD',
    theme: 'tempest',
    weather: 'rain_lightning',
    bgGradStart: '#020617', // slate-950 (dark midnight storm)
    bgGradEnd: '#0f172a', // slate-900
  }
];

