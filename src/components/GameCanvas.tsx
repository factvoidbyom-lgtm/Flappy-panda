import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Home, RotateCcw, Pause, Volume2, Trophy, Coins, Sparkles, Shield, Heart, Zap, Lock, Compass } from 'lucide-react';
import { Difficulty, DIFFICULTY_CONFIGS, SKIN_LIST, PandaSkin, STORY_LEVELS, StoryLevel } from '../types';
import { playFlap, playCoin, playGameOver, playClick } from '../utils/audio';

interface GameCanvasProps {
  difficulty: Difficulty;
  equippedSkinId: string;
  gameMode?: 'ENDLESS' | 'STORY';
  selectedLevelId?: number | null;
  onGameOver: (finalScore: number, coinsEarned: number, jumpsCount: number, difficulty: Difficulty, isLevelCleared?: boolean) => void;
  onNavigate: (screen: 'MENU' | 'DIFFICULTY' | 'STORY_LEVELS') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'flap' | 'coin';
}

interface Bamboo {
  x: number;
  gapCenter: number;
  gapSize: number;
  passed: boolean;
  hasCoin: boolean;
  coinY: number;
  coinCollected: boolean;
  hasPowerup?: 'magnet' | 'shield' | 'heart' | null;
  powerupCollected?: boolean;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

export interface EndlessTheme {
  id: string;
  name: string;
  theme: 'sunrise' | 'snow' | 'mist' | 'twilight' | 'tempest' | 'mystic_jungle' | 'sunny_ridges' | 'retro_bliss' | 'sunset_grove';
  weather: 'clear' | 'snow' | 'mist' | 'rain_lightning' | 'fireflies' | 'leaves';
  bgGradStart: string;
  bgGradEnd: string;
}

export const ENDLESS_THEMES: EndlessTheme[] = [
  {
    id: 'sunrise_sanctuary',
    name: 'Sunrise Sanctuary',
    theme: 'sunrise',
    weather: 'clear',
    bgGradStart: '#fff7ed', // warm sunrise gold
    bgGradEnd: '#fecdd3',   // sweet cherry blossom rose
  },
  {
    id: 'snowy_zen_peaks',
    name: 'Snowy Zen Peaks',
    theme: 'snow',
    weather: 'snow',
    bgGradStart: '#e0f2fe', // frosty azure blue
    bgGradEnd: '#bae6fd',   // soft snow-sky
  },
  {
    id: 'misty_bamboo_grove',
    name: 'Misty Bamboo Grove',
    theme: 'mist',
    weather: 'mist',
    bgGradStart: '#f1f5f9', // ancient morning fog slate
    bgGradEnd: '#cbd5e1',   // deep mist gray
  },
  {
    id: 'twilight_fireflies',
    name: 'Twilight Fireflies',
    theme: 'twilight',
    weather: 'clear', // draws twinkling stars
    bgGradStart: '#1e1b4b', // deep twilight violet-indigo
    bgGradEnd: '#312e81',   // electric night purple
  },
  {
    id: 'cosmic_tempest',
    name: 'Cosmic Tempest',
    theme: 'tempest',
    weather: 'rain_lightning',
    bgGradStart: '#090d16', // dark midnight tempest grey
    bgGradEnd: '#1e293b',   // electric storm purple-slate
  },
  {
    id: 'mystic_jungle',
    name: 'Mystic Jungle Cave',
    theme: 'mystic_jungle',
    weather: 'fireflies', // draws green/yellow fireflies
    bgGradStart: '#05180f', // deep black-green jungle moss
    bgGradEnd: '#102e1c',   // jade stone green
  },
  {
    id: 'sunny_ridges',
    name: 'Sunny Ridge Pines',
    theme: 'sunny_ridges',
    weather: 'clear',
    bgGradStart: '#0ea5e9', // brilliant sky blue
    bgGradEnd: '#7dd3fc',   // warm summer horizon
  },
  {
    id: 'retro_bliss',
    name: 'Nostalgic Bliss Hills',
    theme: 'retro_bliss',
    weather: 'clear',
    bgGradStart: '#1d4ed8', // legendary Windows XP sky blue
    bgGradEnd: '#93c5fd',   // soft edge white blue
  },
  {
    id: 'sunset_grove',
    name: 'Sunset Grove',
    theme: 'sunset_grove',
    weather: 'leaves', // falling golden maple leaves
    bgGradStart: '#fdba74', // warm amber sunset glow
    bgGradEnd: '#f43f5e',   // deep raspberry rose horizon
  }
];

export default function GameCanvas({
  difficulty,
  equippedSkinId,
  gameMode = 'ENDLESS',
  selectedLevelId = null,
  onGameOver,
  onNavigate
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showGetReady, setShowGetReady] = useState(true);

  // Countdown timer for pause resume
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);

  // High score tracking specifically for this run
  const [runHighScore, setRunHighScore] = useState(0);

  // Power-up indicators for HUD
  const [activeMagnet, setActiveMagnet] = useState(0);
  const [activeShield, setActiveShield] = useState(false);
  const [hearts, setHearts] = useState(3);

  // Active endless theme (randomized every run)
  const [activeEndlessTheme, setActiveEndlessTheme] = useState<EndlessTheme | null>(null);

  // References to keep game loop variables running outside React re-renders
  const stateRef = useRef({
    score: 0,
    coinsCollected: 0,
    jumpsCount: 0,
    hearts: 3,
    maxHearts: 3,
    panda: {
      y: 250,
      vy: 0,
      radius: 18,
      angle: 0,
      targetAngle: 0
    },
    bamboos: [] as (Bamboo & { hasPowerup?: 'magnet' | 'shield' | 'heart' | null; powerupCollected?: boolean })[],
    particles: [] as Particle[],
    clouds: [] as Cloud[],
    floorOffset: 0,
    frameCount: 0,
    width: 400,
    height: 600,
    isGameOver: false,
    isPlaying: false,
    isPaused: false,
    activeMagnetTime: 0,
    activeShieldTime: 0,
    activeInvulTime: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    lightningFlash: 0,
    isCountdownActive: false,
    countdownTimer: 0,
    activeEndlessTheme: null as EndlessTheme | null,
    lastThemeChangeScore: 0,
    currentBgStart: '',
    currentBgEnd: '',
    bgScrollX: 0
  });

  const skin = SKIN_LIST.find((s) => s.id === equippedSkinId) || SKIN_LIST[0];
  const config = DIFFICULTY_CONFIGS[difficulty];
  const activeLevel = gameMode === 'STORY' ? STORY_LEVELS.find((l) => l.id === selectedLevelId) : null;
  const targetScore = activeLevel ? activeLevel.targetScore : null;

  // Pre-load background images uploaded by the user with fallbacks
  const [loadedBgImages, setLoadedBgImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const urls = [
      'b5d76d9f-e783-47ce-8e30-9da92ebbd11e.jpeg',
      'e3ac59d2-1690-47f8-9ac3-05c2505050d1.jpeg',
      '78b87339-44bb-4ed1-95a2-2df4eb8aa42f.jpeg',
      'Game Background.jpeg',
      'Calming pixel art landscape.jpeg'
    ];
    
    urls.forEach((url) => {
      const img = new Image();
      img.src = `/${url}`;
      img.onload = () => {
        setLoadedBgImages((prev) => ({ ...prev, [url]: img }));
      };
      img.onerror = () => {
        const fallbackImg = new Image();
        fallbackImg.src = `/src/assets/images/${url}`;
        fallbackImg.onload = () => {
          setLoadedBgImages((prev) => ({ ...prev, [url]: fallbackImg }));
        };
      };
    });
  }, []);

  // Load high scores
  useEffect(() => {
    try {
      const stored = localStorage.getItem('panda_user_stats');
      if (stored) {
        const stats = JSON.parse(stored);
        if (stats.highScore && stats.highScore[difficulty]) {
          setRunHighScore(stats.highScore[difficulty]);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Pick a brand new random theme for Endless Mode runs on load
    if (gameMode === 'ENDLESS') {
      const randomTheme = ENDLESS_THEMES[Math.floor(Math.random() * ENDLESS_THEMES.length)];
      setActiveEndlessTheme(randomTheme);
      stateRef.current.activeEndlessTheme = randomTheme;
    }
  }, [difficulty, gameMode]);

  // Handle ResizeObserver to update canvas aspect ratio
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Lock to beautiful high-res mobile aspect ratio
        const renderWidth = width || 400;
        const renderHeight = height || 600;

        canvas.width = renderWidth * window.devicePixelRatio;
        canvas.height = renderHeight * window.devicePixelRatio;
        canvas.style.width = `${renderWidth}px`;
        canvas.style.height = `${renderHeight}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        stateRef.current.width = renderWidth;
        stateRef.current.height = renderHeight;
      }
    });

    resizeObserver.observe(container);

    // Initialize clouds
    const initialClouds: Cloud[] = [];
    for (let i = 0; i < 4; i++) {
      initialClouds.push({
        x: Math.random() * 400,
        y: 40 + Math.random() * 120,
        speed: 0.15 + Math.random() * 0.2,
        scale: 0.6 + Math.random() * 0.7
      });
    }
    stateRef.current.clouds = initialClouds;

    return () => resizeObserver.disconnect();
  }, []);

  // Sync React state to stateRef
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isPaused = isPaused;
    stateRef.current.isGameOver = isGameOverState;
  }, [isPlaying, isPaused, isGameOverState]);

  // Restart local game state
  const resetGame = () => {
    const s = stateRef.current;

    if (gameMode === 'ENDLESS') {
      const randomTheme = ENDLESS_THEMES[Math.floor(Math.random() * ENDLESS_THEMES.length)];
      setActiveEndlessTheme(randomTheme);
      s.activeEndlessTheme = randomTheme;
    }

    s.score = 0;
    s.coinsCollected = 0;
    s.jumpsCount = 0;
    s.hearts = 3;
    s.lastThemeChangeScore = 0;
    s.currentBgStart = '';
    s.currentBgEnd = '';
    s.bgScrollX = 0;
    s.panda = {
      y: s.height / 2 - 20,
      vy: 0,
      radius: 17,
      angle: 0,
      targetAngle: 0
    };
    s.bamboos = [];
    s.particles = [];
    s.frameCount = 0;
    s.isGameOver = false;
    s.activeMagnetTime = 0;
    s.activeShieldTime = 0;
    s.activeInvulTime = 0;

    setScore(0);
    setCoinsCollected(0);
    setHearts(3);
    setIsGameOverState(false);
    setIsPaused(false);
    setShowGetReady(true);
    setActiveMagnet(0);
    setActiveShield(false);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
    setShowGetReady(false);
    
    // Trigger professional 3-second starting countdown with camera zoom!
    stateRef.current.isCountdownActive = true;
    stateRef.current.countdownTimer = 180; // 3 seconds (180 frames at 60 FPS)
  };

  const triggerJump = () => {
    if (stateRef.current.isGameOver || isPaused || stateRef.current.isCountdownActive) return;

    if (showGetReady) {
      startGame();
    }

    const p = stateRef.current.panda;
    p.vy = config.jumpForce;
    p.targetAngle = -0.4; // lean up on flap

    // Increment jumps tracking
    stateRef.current.jumpsCount++;

    // Add cute fluffy flap smoke particles
    for (let i = 0; i < 5; i++) {
      stateRef.current.particles.push({
        x: 100 - p.radius + Math.random() * 10,
        y: p.y + (Math.random() * 14 - 7),
        vx: -1.5 - Math.random() * 2,
        vy: -1 + Math.random() * 2,
        size: 3 + Math.random() * 5,
        color: 'rgba(255, 255, 255, 0.7)',
        alpha: 0.8,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        type: 'flap'
      });
    }

    playFlap();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGetReady, isPaused, isGameOverState]);

  // Main canvas animation and physics ticks
  useEffect(() => {
    let animFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const s = stateRef.current;
      const width = s.width;
      const height = s.height;

      // 1. UPDATE PHYSICS (if playing and not paused)
      if (s.isPlaying && !s.isPaused && !s.isGameOver) {
        if (s.isCountdownActive) {
          s.countdownTimer--;
          // Scroll ground/floor slowly during the pre-game countdown
          s.floorOffset = (s.floorOffset - config.speed * 0.45) % 30;
          if (s.countdownTimer <= 0) {
            s.isCountdownActive = false;
          }
        } else {
          s.frameCount++;

          // Decrement active power-up timers
        if (s.activeMagnetTime > 0) {
          s.activeMagnetTime--;
        }
        if (s.activeInvulTime > 0) {
          s.activeInvulTime--;
        }

        // Sync state to React occasionally (every 10 frames) to maintain smooth 60fps
        if (s.frameCount % 10 === 0) {
          setActiveMagnet(s.activeMagnetTime);
          setActiveShield(s.activeShieldTime > 0);
          setHearts(s.hearts);
        }

        // --- Panda Movement ---
        const p = s.panda;
        p.vy += config.gravity;
        p.y += p.vy;

        // Smoothly rotate downwards over time
        p.targetAngle += 0.025;
        if (p.targetAngle > 1.2) p.targetAngle = 1.2; // vertical dive limit
        p.angle += (p.targetAngle - p.angle) * 0.15;

        // Boundary Check (Floor / Ceiling death)
        const floorY = height - 50;
        if (p.y - p.radius < 5) {
          // ceiling safety bounce
          p.y = 5 + p.radius;
          p.vy = 1;
        }

        if (p.y + p.radius >= floorY) {
          p.y = floorY - p.radius;
          triggerGameOver();
        }

        // --- Bamboo Management ---
        // Spawn bamboo
        if (s.frameCount % config.spawnRate === 0) {
          // Gaps must fit beautifully centered
          const minGapCenter = 120;
          const maxGapCenter = floorY - 120;
          const gapCenter = minGapCenter + Math.random() * (maxGapCenter - minGapCenter);

          // Coins spawn inside 40% of gaps, power-ups inside 15% of gaps (including hearts)
          const rand = Math.random();
          let hasCoin = false;
          let hasPowerup: 'magnet' | 'shield' | 'heart' | null = null;

          if (rand < 0.40) {
            hasCoin = true;
          } else if (rand < 0.55) {
            const pRand = Math.random();
            if (pRand < 0.35) {
              hasPowerup = 'magnet';
            } else if (pRand < 0.70) {
              hasPowerup = 'shield';
            } else {
              hasPowerup = 'heart';
            }
          }

          s.bamboos.push({
            x: width + 50,
            gapCenter,
            gapSize: config.gapSize,
            passed: false,
            hasCoin,
            coinY: gapCenter,
            coinCollected: false,
            hasPowerup,
            powerupCollected: false
          });
        }

        // Scroll and check collisions
        for (let i = s.bamboos.length - 1; i >= 0; i--) {
          const b = s.bamboos[i];
          b.x -= config.speed;

          const pandaX = 100;

          // Magnet Attraction Pull logic for coins
          if (b.hasCoin && !b.coinCollected && s.activeMagnetTime > 0) {
            const coinX = b.x + 30;
            const coinY = b.coinY;
            const dist = Math.hypot(pandaX - coinX, p.y - coinY);
            if (dist < 180) { // pull radius
              const pullForce = 6.0;
              const dx = pandaX - coinX;
              const dy = p.y - coinY;

              // Pull coordinates directly
              b.coinY += (dy / dist) * pullForce;
              const coinCenterTarget = pandaX - 30;
              b.x += ((coinCenterTarget - b.x) / dist) * pullForce;
            }
          }

          // Score check
          if (!b.passed && b.x < 100) {
            b.passed = true;
            s.score++;
            setScore(s.score);

            // Dynamic background shift every 5 points in endless mode
            if (gameMode === 'ENDLESS' && s.score > 0 && s.score % 5 === 0 && s.score !== s.lastThemeChangeScore) {
              s.lastThemeChangeScore = s.score;
              const currentThemeId = s.activeEndlessTheme?.id;
              const availableThemes = ENDLESS_THEMES.filter(t => t.id !== currentThemeId);
              const nextTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
              s.activeEndlessTheme = nextTheme;

              // Cinematic environmental shift indicators
              s.lightningFlash = 25; // 25 frames of soft visual environmental illumination
              s.shakeTimer = 10;
              s.shakeIntensity = 4;

              // Spawn celebration sparkle transition particles
              for (let ptIdx = 0; ptIdx < 20; ptIdx++) {
                s.particles.push({
                  x: Math.random() * s.width,
                  y: Math.random() * s.height,
                  vx: -1.5 + Math.random() * 3,
                  vy: -1.5 + Math.random() * 3,
                  size: 3 + Math.random() * 6,
                  color: 'rgba(255, 255, 255, 0.85)',
                  alpha: 0.9,
                  life: 0,
                  maxLife: 40 + Math.random() * 20,
                  type: 'coin'
                });
              }
            }
          }

          // Remove offscreen
          if (b.x < -80) {
            s.bamboos.splice(i, 1);
            continue;
          }

          // Bamboo collision coordinates
          const topBambooBottom = b.gapCenter - b.gapSize / 2;
          const bottomBambooTop = b.gapCenter + b.gapSize / 2;
          const bambooWidth = 60;

          // Box overlap with circular panda buffer
          const inBambooX = pandaX + p.radius - 3 > b.x && pandaX - p.radius + 3 < b.x + bambooWidth;
          const hitTop = inBambooX && p.y - p.radius + 3 < topBambooBottom;
          const hitBottom = inBambooX && p.y + p.radius - 3 > bottomBambooTop;

          if (hitTop || hitBottom) {
            if (s.activeInvulTime > 0) {
              // safe during invulnerability
            } else if (s.activeShieldTime > 0) {
              // Shield breaks, saving user from death!
              s.activeShieldTime = 0;
              s.activeInvulTime = 70; // 1.2s invulnerability
              setActiveShield(false);
              playCoin(); // high-end visual bounce audio

              // Burst shield break particles
              for (let k = 0; k < 18; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                s.particles.push({
                  x: pandaX,
                  y: p.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 2.5 + Math.random() * 4,
                  color: '#fb7185',
                  alpha: 1,
                  life: 0,
                  maxLife: 30 + Math.random() * 15,
                  type: 'coin'
                });
              }
            } else {
              // Lose 1 Heart instead of ending the game immediately!
              s.hearts--;
              setHearts(s.hearts);
              s.activeInvulTime = 90; // 1.5s of flashing invulnerability
              playFlap(); // soft impact audio

              // Screen shaking: light-medium shake if hearts remain, hard shake if out of hearts
              if (s.hearts > 0) {
                s.shakeTimer = 18;
                s.shakeIntensity = 8;
              } else {
                s.shakeTimer = 45;
                s.shakeIntensity = 22;
              }

              // Explode damage particles
              for (let k = 0; k < 20; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                s.particles.push({
                  x: pandaX,
                  y: p.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 2.5 + Math.random() * 3.5,
                  color: '#f43f5e',
                  alpha: 1,
                  life: 0,
                  maxLife: 25 + Math.random() * 15,
                  type: 'coin'
                });
              }

              if (s.hearts <= 0) {
                triggerGameOver();
              }
            }
          }

          // Coin collection
          if (b.hasCoin && !b.coinCollected) {
            // Circle distance collision
            const coinX = b.x + 30; // centered in bamboo
            const coinY = b.coinY;
            const dist = Math.hypot(pandaX - coinX, p.y - coinY);

            if (dist < p.radius + 12) {
              b.coinCollected = true;
              s.coinsCollected++;
              setCoinsCollected(s.coinsCollected);
              playCoin();

              // Explode glittering coin sparkles!
              for (let k = 0; k < 12; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.5 + Math.random() * 3;
                s.particles.push({
                  x: coinX,
                  y: coinY,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 2.5 + Math.random() * 3.5,
                  color: k % 2 === 0 ? '#f59e0b' : '#fef08a', // alternating golds
                  alpha: 1,
                  life: 0,
                  maxLife: 30 + Math.random() * 20,
                  type: 'coin'
                });
              }
            }
          }

          // Power-up collection
          if (b.hasPowerup && !b.powerupCollected) {
            const pwX = b.x + 30;
            const pwY = b.gapCenter;
            const dist = Math.hypot(pandaX - pwX, p.y - pwY);

            if (dist < p.radius + 15) {
              b.powerupCollected = true;
              playCoin();

              if (b.hasPowerup === 'magnet') {
                s.activeMagnetTime = 420; // 420 frames ~ 7s of magnet
                setActiveMagnet(420);
                
                // Explode violet/purple magnetic sparkles
                for (let k = 0; k < 15; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = 2 + Math.random() * 4;
                  s.particles.push({
                    x: pwX,
                    y: pwY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 3,
                    color: k % 2 === 0 ? '#d946ef' : '#a855f7',
                    alpha: 1,
                    life: 0,
                    maxLife: 25 + Math.random() * 15,
                    type: 'coin'
                  });
                }
              } else if (b.hasPowerup === 'shield') {
                s.activeShieldTime = 1; // shield active
                setActiveShield(true);

                // Explode light-blue cyber shield sparks
                for (let k = 0; k < 15; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = 2 + Math.random() * 4;
                  s.particles.push({
                    x: pwX,
                    y: pwY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 3,
                    color: k % 2 === 0 ? '#06b6d4' : '#38bdf8',
                    alpha: 1,
                    life: 0,
                    maxLife: 25 + Math.random() * 15,
                    type: 'coin'
                  });
                }
              } else if (b.hasPowerup === 'heart') {
                if (s.hearts < 3) {
                  s.hearts++;
                  setHearts(s.hearts);
                }
                playCoin();

                // Explode sweet cherry rose sparkles!
                for (let k = 0; k < 15; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = 2 + Math.random() * 4;
                  s.particles.push({
                    x: pwX,
                    y: pwY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 3.5,
                    color: k % 2 === 0 ? '#f43f5e' : '#fbcfe8',
                    alpha: 1,
                    life: 0,
                    maxLife: 25 + Math.random() * 15,
                    type: 'coin'
                  });
                }
              }
            }
          }
        }

        // Scroll ground
        s.floorOffset = (s.floorOffset - config.speed) % 30;
        }
      }

      // --- Background Stars/Clouds Physics ---
      s.clouds.forEach((c) => {
        c.x -= c.speed;
        if (c.x < -120) {
          c.x = width + 50;
          c.y = 40 + Math.random() * 120;
        }
      });

      // --- Particles Physics ---
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.life++;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (pt.type === 'coin') {
          pt.vy += 0.04; // gravity on sparks
          pt.vx *= 0.98;
        }

        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.life >= pt.maxLife) {
          s.particles.splice(i, 1);
        }
      }


      // 2. DRAW ELEMENTS ON CANVAS
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Camera Shake offset for heavy impact gameplay
      if (s.shakeTimer && s.shakeTimer > 0) {
        const shakeX = (Math.random() - 0.5) * s.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * s.shakeIntensity;
        ctx.translate(shakeX, shakeY);
        s.shakeTimer--;
      }

      // Camera Zoom Effect centered on Panda (3...2...1... GO countdown zooms in!)
      let currentZoom = 1.0;
      if (s.isCountdownActive) {
        const zoomProgress = Math.max(0, s.countdownTimer / 180);
        currentZoom = 1.0 + zoomProgress * 0.35;
      }
      if (currentZoom !== 1.0) {
        const pandaY = s.panda.y;
        ctx.translate(100, pandaY);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-100, -pandaY);
      }

      // A. Sky Backdrop Gradient or Loaded Custom Background Image
      let gStart = '#fff5f6';
      let gEnd = '#ffccd5';
      const isStory = gameMode === 'STORY';
      const curTheme = isStory ? activeLevel?.theme : s.activeEndlessTheme?.theme;
      const curWeather = isStory ? activeLevel?.weather : s.activeEndlessTheme?.weather;

      if (isStory && activeLevel) {
        gStart = activeLevel.bgGradStart;
        gEnd = activeLevel.bgGradEnd;
      } else if (!isStory && s.activeEndlessTheme) {
        gStart = s.activeEndlessTheme.bgGradStart;
        gEnd = s.activeEndlessTheme.bgGradEnd;
      }

      // Smooth color morphing transitions
      if (!s.currentBgStart) {
        s.currentBgStart = gStart;
        s.currentBgEnd = gEnd;
      } else {
        const hexToRgb = (hex: string) => {
          const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return res ? {
            r: parseInt(res[1], 16),
            g: parseInt(res[2], 16),
            b: parseInt(res[3], 16)
          } : { r: 255, g: 255, b: 255 };
        };
        const rgbToHex = (r: number, g: number, b: number) => {
          const clampVal = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
          return "#" + ((1 << 24) + (clampVal(r) << 16) + (clampVal(g) << 8) + clampVal(b)).toString(16).slice(1);
        };

        const curS = hexToRgb(s.currentBgStart);
        const curE = hexToRgb(s.currentBgEnd);
        const tarS = hexToRgb(gStart);
        const tarE = hexToRgb(gEnd);
        
        const nextS = {
          r: curS.r + (tarS.r - curS.r) * 0.02,
          g: curS.g + (tarS.g - curS.g) * 0.02,
          b: curS.b + (tarS.b - curS.b) * 0.02,
        };
        const nextE = {
          r: curE.r + (tarE.r - curE.r) * 0.02,
          g: curE.g + (tarE.g - curE.g) * 0.02,
          b: curE.b + (tarE.b - curE.b) * 0.02,
        };
        s.currentBgStart = rgbToHex(nextS.r, nextS.g, nextS.b);
        s.currentBgEnd = rgbToHex(nextE.r, nextE.g, nextE.b);
      }

      // Draw loaded background image if available, with scrolling/panning animation, otherwise draw gradient
      let selectedBgImg: HTMLImageElement | null = null;
      if (curTheme === 'twilight' || curTheme === 'tempest') {
        selectedBgImg = loadedBgImages['78b87339-44bb-4ed1-95a2-2df4eb8aa42f.jpeg'] || null;
      } else if (curTheme === 'mist' || curTheme === 'mystic_jungle') {
        selectedBgImg = loadedBgImages['e3ac59d2-1690-47f8-9ac3-05c2505050d1.jpeg'] || null;
      } else if (curTheme === 'snow') {
        selectedBgImg = loadedBgImages['Calming pixel art landscape.jpeg'] || null;
      } else {
        selectedBgImg = loadedBgImages['b5d76d9f-e783-47ce-8e30-9da92ebbd11e.jpeg'] || loadedBgImages['Game Background.jpeg'] || null;
      }

      if (!selectedBgImg && Object.keys(loadedBgImages).length > 0) {
        const firstKey = Object.keys(loadedBgImages)[0];
        selectedBgImg = loadedBgImages[firstKey];
      }

      if (selectedBgImg) {
        // Draw the beautifully scrolling/animating background image
        // Scroll the background slowly for a beautiful parallax depth effect
        if (s.isPlaying && !s.isPaused && !s.isGameOver && !s.isCountdownActive) {
          s.bgScrollX = (s.bgScrollX - config.speed * 0.15) % width;
        } else if (s.isCountdownActive) {
          // Slowly scroll during countdown
          s.bgScrollX = (s.bgScrollX - config.speed * 0.05) % width;
        }
        
        const scale = height / selectedBgImg.height;
        const imgWidth = selectedBgImg.width * scale;
        
        let bx = s.bgScrollX % imgWidth;
        if (bx > 0) bx -= imgWidth;
        
        while (bx < width) {
          ctx.drawImage(selectedBgImg, bx, 0, imgWidth, height);
          bx += imgWidth;
        }
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, s.currentBgStart);
        skyGrad.addColorStop(1, s.currentBgEnd);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // B. Celestial Bodies & Landmarks (e.g. Hills, Mountains, Vines)
      if (curTheme === 'sunrise' || curTheme === 'sunset_grove') {
        // Draw Sunrise/Sunset Sun
        ctx.save();
        ctx.fillStyle = curTheme === 'sunset_grove' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(251, 146, 60, 0.45)';
        ctx.beginPath();
        ctx.arc(width - 80, 100, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = curTheme === 'sunset_grove' ? 'rgba(253, 186, 116, 0.85)' : 'rgba(254, 215, 170, 0.85)';
        ctx.beginPath();
        ctx.arc(width - 80, 100, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw soft rainbow arc for sunrise only
        if (curTheme === 'sunrise') {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 113, 133, 0.12)';
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2 + 50, 160, Math.PI, 0, false);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.1)';
          ctx.lineWidth = 8;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }
      }

      if (curTheme === 'twilight' || curTheme === 'tempest' || curTheme === 'mystic_jungle') {
        // Draw Twinkling Stars
        ctx.fillStyle = '#ffffff';
        const starCount = curTheme === 'mystic_jungle' ? 10 : 20;
        for (let i = 0; i < starCount; i++) {
          const starX = (i * 29 + 13) % width;
          const starY = (i * 17 + 23) % (height / 2);
          const starAlpha = 0.2 + Math.sin(s.frameCount * 0.04 + i) * 0.5;
          ctx.save();
          ctx.globalAlpha = starAlpha;
          ctx.fillRect(starX, starY, 1.8, 1.8);
          ctx.restore();
        }

        // Draw Moonlight / Moon
        if (curTheme === 'tempest' || curTheme === 'twilight') {
          ctx.save();
          ctx.fillStyle = curTheme === 'twilight' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(241, 245, 249, 0.1)';
          ctx.beginPath();
          ctx.arc(width - 90, 90, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = curTheme === 'twilight' ? '#e0e7ff' : '#f1f5f9';
          ctx.beginPath();
          ctx.arc(width - 90, 90, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Special Background Landmarks
      if (curTheme === 'retro_bliss') {
        ctx.save();
        // Draw blissful curved rolling hills at the bottom
        const hillGrad = ctx.createLinearGradient(0, height - 120, 0, height);
        hillGrad.addColorStop(0, '#22c55e');
        hillGrad.addColorStop(1, '#15803d');
        ctx.fillStyle = hillGrad;
        
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height - 80);
        ctx.quadraticCurveTo(width * 0.4, height - 120, width * 0.7, height - 60);
        ctx.quadraticCurveTo(width * 0.85, height - 40, width, height - 70);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (curTheme === 'sunny_ridges') {
        ctx.save();
        // Distant mountain ranges
        ctx.fillStyle = 'rgba(13, 148, 136, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height - 140);
        ctx.lineTo(width * 0.3, height - 210);
        ctx.lineTo(width * 0.6, height - 130);
        ctx.lineTo(width * 0.8, height - 170);
        ctx.lineTo(width, height - 110);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Pine trees at the horizon
        ctx.fillStyle = 'rgba(15, 118, 110, 0.25)';
        for (let i = 0; i < 6; i++) {
          const pineX = (i * 75) % (width + 40) - 20;
          const pineY = height - 50;
          const pineH = 45 + (i % 3) * 12;
          ctx.beginPath();
          ctx.moveTo(pineX, pineY);
          ctx.lineTo(pineX - 12, pineY);
          ctx.lineTo(pineX, pineY - pineH);
          ctx.lineTo(pineX + 12, pineY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (curTheme === 'mystic_jungle') {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 78, 59, 0.35)';
        ctx.lineWidth = 2.5;
        // Draw hanging vines from the top
        for (let vi = 0; vi < 3; vi++) {
          const vineX = (vi * 130 + 50) % width;
          const vineH = 80 + vi * 30 + Math.sin(s.frameCount * 0.01 + vi) * 10;
          ctx.beginPath();
          ctx.moveTo(vineX, 0);
          ctx.quadraticCurveTo(vineX + Math.sin(s.frameCount * 0.015 + vi) * 12, vineH * 0.5, vineX, vineH);
          ctx.stroke();

          // Vines leaves
          ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
          for (let ly = 15; ly < vineH - 5; ly += 20) {
            ctx.beginPath();
            ctx.ellipse(vineX + Math.sin(s.frameCount * 0.015 + vi + ly) * 4, ly, 4, 2, 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // C. Deep Background Swaying Parallax Bamboo Layer and Mid-ground Parallax Layer removed to eliminate vertical "dancing light" bars as requested.


      // E. Parallax Soft Fluffy Clouds
      let cloudColor = 'rgba(255, 255, 255, 0.75)';
      if (curTheme === 'twilight') cloudColor = 'rgba(99, 102, 241, 0.25)';
      else if (curTheme === 'tempest') cloudColor = 'rgba(30, 41, 59, 0.5)';
      else if (curTheme === 'mystic_jungle') cloudColor = 'rgba(16, 185, 129, 0.1)';
      else if (curTheme === 'sunset_grove') cloudColor = 'rgba(254, 205, 211, 0.45)';
      ctx.fillStyle = cloudColor;

      s.clouds.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        
        ctx.beginPath();
        ctx.arc(30, 30, 20, 0, Math.PI * 2);
        ctx.arc(50, 20, 22, 0, Math.PI * 2);
        ctx.arc(70, 30, 18, 0, Math.PI * 2);
        ctx.rect(30, 30, 40, 20);
        ctx.fill();
        
        ctx.restore();
      });

      // F. Dynamic Wildlife & Weather Layers
      // Flying birds (V-shapes) - only in suitable sky themes
      if (curTheme !== 'tempest' && curTheme !== 'mystic_jungle') {
        ctx.strokeStyle = curTheme === 'twilight' 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(75, 85, 99, 0.35)';
        ctx.lineWidth = 1.6;
        for (let bi = 0; bi < 2; bi++) {
          const bx = (bi * 180 + s.frameCount * 0.7) % (width + 100) - 50;
          const by = 60 + bi * 35 + Math.sin(s.frameCount * 0.015 + bi) * 12;
          const flap = Math.sin(s.frameCount * 0.11 + bi) * 3.5;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by + flap);
          ctx.quadraticCurveTo(bx - 4, by - 4, bx, by);
          ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by + flap);
          ctx.stroke();
        }
      }

      // Butterflies fluttering around
      if (curTheme !== 'tempest' && curTheme !== 'twilight') {
        for (let bi = 0; bi < 2; bi++) {
          const bfx = (bi * 200 + Math.sin(s.frameCount * 0.012 + bi) * 35) % width;
          const bfy = 220 + bi * 110 + Math.cos(s.frameCount * 0.02 + bi) * 45;
          const wingFlap = Math.sin(s.frameCount * 0.22 + bi) > 0;
          
          ctx.save();
          ctx.translate(bfx, bfy);
          ctx.fillStyle = bi % 2 === 0 ? '#fda4af' : '#fde047';
          
          ctx.beginPath();
          ctx.ellipse(wingFlap ? -3 : -5, -2, 4.5, 3.5, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(wingFlap ? 3 : 5, -2, 4.5, 3.5, 0.2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#334155';
          ctx.fillRect(-0.8, -3.5, 1.6, 6);
          ctx.restore();
        }
      }

      // Rain (tempest weather)
      if (curWeather === 'rain_lightning') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
        ctx.lineWidth = 1;
        for (let ri = 0; ri < 16; ri++) {
          const rx = (ri * 40 + s.frameCount * 3.5) % (width + 40) - 20;
          const ry = (ri * 60 + s.frameCount * 8) % height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 3, ry + 12);
          ctx.stroke();
        }

        if (s.frameCount % 240 === 180) {
          s.shakeTimer = 16;
          s.shakeIntensity = 5.5;
          s.lightningFlash = 0.9;
        }
        if (s.lightningFlash && s.lightningFlash > 0) {
          s.lightningFlash -= 0.12;
          if (s.lightningFlash < 0) s.lightningFlash = 0;
          ctx.fillStyle = `rgba(224, 242, 254, ${s.lightningFlash * 0.8})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Snow (snow weather)
      if (curWeather === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        for (let si = 0; si < 15; si++) {
          const sx = (si * 45 + Math.sin(s.frameCount * 0.02 + si) * 15) % (width + 40) - 20;
          const sy = (si * 55 + s.frameCount * 1.3) % height;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.8 + (si % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Mist bands (mist weather)
      if (curWeather === 'mist') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        for (let mi = 0; mi < 3; mi++) {
          const my = 120 + mi * 130;
          ctx.beginPath();
          ctx.ellipse(width / 2 + Math.sin(s.frameCount * 0.008 + mi) * 25, my, width, 38, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Falling Leaves / Maple / blossoms
      if (curWeather === 'leaves' || curTheme === 'sunrise' || curTheme === 'mist' || curTheme === 'sunset_grove') {
        ctx.fillStyle = curTheme === 'sunset_grove' 
          ? 'rgba(234, 88, 12, 0.65)' 
          : curTheme === 'sunrise' 
          ? 'rgba(244, 63, 94, 0.65)' 
          : 'rgba(16, 185, 129, 0.55)';
        for (let li = 0; li < 6; li++) {
          const lx = (li * 75 - s.frameCount * 1.1) % (width + 40) + 10;
          const ly = (li * 105 + s.frameCount * 0.75 + Math.sin(s.frameCount * 0.025 + li) * 18) % height;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(s.frameCount * 0.015 + li);
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 2.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Floating Fireflies (fireflies weather)
      if (curWeather === 'fireflies') {
        for (let fi = 0; fi < 12; fi++) {
          const fx = (fi * 35 + Math.sin(s.frameCount * 0.025 + fi) * 20) % (width + 20) - 10;
          const fy = (fi * 45 + Math.cos(s.frameCount * 0.015 + fi) * 25 + s.frameCount * 0.15) % (height - 60);
          const alpha = 0.3 + Math.sin(s.frameCount * 0.05 + fi) * 0.5;
          
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, alpha);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
          ctx.beginPath();
          ctx.arc(fx, fy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // C. Draw Bamboos, Coins & Power-ups
      s.bamboos.forEach((b) => {
        const topHeight = b.gapCenter - b.gapSize / 2;
        const bottomHeight = b.gapCenter + b.gapSize / 2;
        const bWidth = 56;

        ctx.save();

        // Dynamic theme-specific obstacle and leaf styling
        const bamGrad = ctx.createLinearGradient(b.x, 0, b.x + bWidth, 0);
        let bStrokeColor = '#065f46';
        let nodeFillColor = '#059669';
        let leafFillColor = '#10b981';
        let leafStrokeColor = '#047857';

        if (b.hasPowerup === 'heart') {
          bamGrad.addColorStop(0, '#ec4899');   // pink-500
          bamGrad.addColorStop(0.3, '#fbcfe8'); // pink-200 highlight
          bamGrad.addColorStop(0.8, '#f472b6'); // pink-400 highlight
          bamGrad.addColorStop(1, '#9d174d');   // pink-800 shadow
          bStrokeColor = '#9d174d';
          nodeFillColor = '#9d174d';
          leafFillColor = '#f43f5e';
          leafStrokeColor = '#9d174d';
        } else {
          if (curTheme === 'tempest') {
            // Dark stormy metallic columns
            bamGrad.addColorStop(0, '#475569');   // slate-600
            bamGrad.addColorStop(0.3, '#94a3b8'); // slate-400 highlight
            bamGrad.addColorStop(0.8, '#64748b'); // slate-500 highlight
            bamGrad.addColorStop(1, '#1e293b');   // slate-800 shadow
            bStrokeColor = '#0f172a';
            nodeFillColor = '#334155';
            leafFillColor = '#475569';
            leafStrokeColor = '#1e293b';
          } else if (curTheme === 'twilight') {
            // Neon violet pillars
            bamGrad.addColorStop(0, '#6366f1');   // indigo-500
            bamGrad.addColorStop(0.3, '#c7d2fe'); // indigo-200 highlight
            bamGrad.addColorStop(0.8, '#818cf8'); // indigo-400 highlight
            bamGrad.addColorStop(1, '#312e81');   // indigo-900 shadow
            bStrokeColor = '#1e1b4b';
            nodeFillColor = '#4338ca';
            leafFillColor = '#a5b4fc';
            leafStrokeColor = '#4338ca';
          } else if (curTheme === 'mystic_jungle') {
            // Ancient mossy stone columns
            bamGrad.addColorStop(0, '#065f46');   // emerald-800
            bamGrad.addColorStop(0.3, '#34d399'); // emerald-400 moss highlight
            bamGrad.addColorStop(0.8, '#047857'); // emerald-700
            bamGrad.addColorStop(1, '#022c22');   // emerald-950 deep shadow
            bStrokeColor = '#022c22';
            nodeFillColor = '#047857';
            leafFillColor = '#10b981';
            leafStrokeColor = '#064e3b';
          } else if (curTheme === 'snow') {
            // Frosty ice pillars
            bamGrad.addColorStop(0, '#93c5fd');   // blue-300
            bamGrad.addColorStop(0.3, '#f0f9ff'); // ice frost highlight
            bamGrad.addColorStop(0.8, '#bae6fd'); // sky-200
            bamGrad.addColorStop(1, '#1d4ed8');   // blue-700 deep shadow
            bStrokeColor = '#1e3a8a';
            nodeFillColor = '#3b82f6';
            leafFillColor = '#e0f2fe';
            leafStrokeColor = '#0284c7';
          } else if (curTheme === 'sunny_ridges') {
            // Pine log trunks
            bamGrad.addColorStop(0, '#b45309');   // amber-700 bark
            bamGrad.addColorStop(0.3, '#f59e0b'); // amber-500 bark highlight
            bamGrad.addColorStop(0.8, '#d97706'); // amber-600
            bamGrad.addColorStop(1, '#78350f');   // amber-900 bark shadow
            bStrokeColor = '#451a03';
            nodeFillColor = '#78350f';
            leafFillColor = '#0d9488';
            leafStrokeColor = '#115e59';
          } else if (curTheme === 'retro_bliss') {
            // Green Mario Pipes
            bamGrad.addColorStop(0, '#22c55e');   // green-500
            bamGrad.addColorStop(0.25, '#86efac'); // green-300 highlight
            bamGrad.addColorStop(0.65, '#22c55e'); // green-500
            bamGrad.addColorStop(1, '#15803d');   // green-700 shadow
            bStrokeColor = '#14532d';
            nodeFillColor = '#166534';
            leafFillColor = '#4ade80';
            leafStrokeColor = '#166534';
          } else if (curTheme === 'sunset_grove') {
            // Autumn log trunks
            bamGrad.addColorStop(0, '#ea580c');   // orange-600
            bamGrad.addColorStop(0.3, '#ffedd5'); // peach orange highlight
            bamGrad.addColorStop(0.8, '#f97316'); // orange-500
            bamGrad.addColorStop(1, '#7c2d12');   // orange-900 shadow
            bStrokeColor = '#431407';
            nodeFillColor = '#7c2d12';
            leafFillColor = '#ea580c';
            leafStrokeColor = '#431407';
          } else {
            // Classic Mint Bamboo
            bamGrad.addColorStop(0, '#34d399');   // sweet emerald mint
            bamGrad.addColorStop(0.3, '#a7f3d0'); // soft sage green highlight
            bamGrad.addColorStop(0.8, '#6ee7b7'); // mint highlight
            bamGrad.addColorStop(1, '#059669');   // deeper green shadow
            bStrokeColor = '#065f46';
            nodeFillColor = '#059669';
            leafFillColor = '#10b981';
            leafStrokeColor = '#047857';
          }
        }
        ctx.strokeStyle = bStrokeColor;
        ctx.lineWidth = 2.5;

        // -- Top Bamboo --
        // Draw main pipe
        ctx.beginPath();
        ctx.roundRect(b.x, -10, bWidth, topHeight + 10, [0, 0, 4, 4]);
        ctx.fill();
        ctx.stroke();

        // Draw ridges/nodes on top bamboo
        let nodeY = topHeight - 55;
        while (nodeY > 0) {
          ctx.fillStyle = nodeFillColor;
          ctx.fillRect(b.x - 2, nodeY, bWidth + 4, 6);
          ctx.strokeRect(b.x - 2, nodeY, bWidth + 4, 6);
          nodeY -= 70;
        }

        // Draw Lip Collar at the opening
        ctx.fillStyle = bamGrad;
        ctx.beginPath();
        ctx.roundRect(b.x - 4, topHeight - 22, bWidth + 8, 22, 5);
        ctx.fill();
        ctx.stroke();

        // -- Bottom Bamboo --
        // Draw main pipe
        ctx.beginPath();
        ctx.roundRect(b.x, bottomHeight, bWidth, height - bottomHeight + 10, [4, 4, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Draw ridges on bottom bamboo
        nodeY = bottomHeight + 55;
        while (nodeY < height) {
          ctx.fillStyle = nodeFillColor;
          ctx.fillRect(b.x - 2, nodeY, bWidth + 4, 6);
          ctx.strokeRect(b.x - 2, nodeY, bWidth + 4, 6);
          nodeY += 70;
        }

        // Draw Lip Collar at bottom opening
        ctx.fillStyle = bamGrad;
        ctx.beginPath();
        ctx.roundRect(b.x - 4, bottomHeight, bWidth + 8, 22, 5);
        ctx.fill();
        ctx.stroke();

        // Draw Leaves hanging from bamboos
        ctx.fillStyle = leafFillColor;
        ctx.strokeStyle = leafStrokeColor;
        ctx.lineWidth = 1;

        // Left leaf sprouting off top opening
        ctx.beginPath();
        ctx.ellipse(b.x - 10, topHeight - 35, 12, 5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right leaf sprouting off bottom opening
        ctx.beginPath();
        ctx.ellipse(b.x + bWidth + 10, bottomHeight + 35, 12, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // -- Gold Coin --
        if (b.hasCoin && !b.coinCollected) {
          ctx.save();
          const coinX = b.x + 28;
          // Subtly hover the coin up/down on a sine wave
          const hoverY = b.coinY + Math.sin(s.frameCount * 0.08) * 5;

          // Draw double shiny ring
          ctx.fillStyle = '#fbbf24'; // bright gold
          ctx.strokeStyle = '#ca8a04'; // amber border
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(coinX, hoverY, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner ring
          ctx.beginPath();
          ctx.arc(coinX, hoverY, 7, 0, Math.PI * 2);
          ctx.stroke();

          // Highlight shine slash
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(coinX - 3, hoverY - 3, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // -- Power-up Magnet 🧲 --
        if (b.hasPowerup === 'magnet' && !b.powerupCollected) {
          ctx.save();
          const pwX = b.x + 28;
          const hoverY = b.gapCenter + Math.sin(s.frameCount * 0.1) * 5;

          ctx.translate(pwX, hoverY);
          ctx.rotate(s.frameCount * 0.03); // rotate slowly

          // Outer glowing rose aura
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          // Horseshoe curve
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'square';
          
          // Draw the red/pink base curve
          ctx.strokeStyle = '#fb7185'; // bright soft rose red
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI, false);
          ctx.stroke();

          // Left silver tip
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(-7, -4.5);
          ctx.stroke();

          // Right silver tip
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(7, -4.5);
          ctx.stroke();

          ctx.restore();
        }

        // -- Power-up Shield 🛡️ --
        if (b.hasPowerup === 'shield' && !b.powerupCollected) {
          ctx.save();
          const pwX = b.x + 28;
          const hoverY = b.gapCenter + Math.sin(s.frameCount * 0.1) * 5;

          ctx.translate(pwX, hoverY);
          ctx.rotate(Math.sin(s.frameCount * 0.05) * 0.25); // rock slightly

          // Outer cyan aura
          ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.beginPath();
          ctx.arc(0, 0, 17, 0, Math.PI * 2);
          ctx.fill();

          // Draw a beautiful small pastel shield shape
          ctx.fillStyle = '#38bdf8'; // soft sky shield
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.quadraticCurveTo(8, -9, 8, -2);
          ctx.quadraticCurveTo(8, 5, 0, 10);
          ctx.quadraticCurveTo(-8, 5, -8, -2);
          ctx.quadraticCurveTo(-8, -9, 0, -9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Shield star center
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -1, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // -- Power-up Heart ❤️ --
        if (b.hasPowerup === 'heart' && !b.powerupCollected) {
          ctx.save();
          const pwX = b.x + 28;
          const hoverY = b.gapCenter + Math.sin(s.frameCount * 0.1) * 5;

          ctx.translate(pwX, hoverY);
          ctx.scale(1.15 + Math.sin(s.frameCount * 0.15) * 0.1, 1.15 + Math.sin(s.frameCount * 0.15) * 0.1); // pulsate nicely

          // Outer glowing red aura
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          // Draw a lovely vector heart
          ctx.fillStyle = '#f43f5e'; // rose-500
          ctx.strokeStyle = '#e11d48'; // rose-600
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.bezierCurveTo(-5, 0, -8, -4, -8, -8);
          ctx.bezierCurveTo(-8, -12, -4, -15, 0, -10);
          ctx.bezierCurveTo(4, -15, 8, -12, 8, -8);
          ctx.bezierCurveTo(8, -4, 5, 0, 0, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Little shine dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-2.5, -8, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      });

      // D. Draw Particles
      s.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // E. Draw Panda (Smooth Vector Renderer)
      const p = s.panda;
      ctx.save();

      // Flashing animation during active invulnerability frames
      if (s.activeInvulTime > 0 && Math.floor(s.frameCount / 4) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.translate(100, p.y);
      ctx.rotate(p.angle);

      // Render custom skin style
      const classicColors = { main: '#ffffff', dark: '#1e293b', light: '#f1f5f9', cheek: '#fda4af' };
      const pColors = {
        classic: classicColors,
        red: { main: '#f97316', dark: '#7c2d12', light: '#ffedd5', cheek: '#ea580c' },
        astro: { main: '#f8fafc', dark: '#1e293b', light: '#e2e8f0', cheek: '#fda4af' },
        ninja: { main: '#ffffff', dark: '#334155', light: '#e2e8f0', cheek: '#f1f5f9' },
        golden: { main: '#fef08a', dark: '#b45309', light: '#fde047', cheek: '#f59e0b' }
      }[skin.type] || classicColors;

      // Draw Ears
      ctx.fillStyle = skin.type === 'golden' ? '#f59e0b' : pColors.dark;
      // Left Ear
      ctx.beginPath();
      ctx.arc(-11, -12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.type === 'golden' ? '#78350f' : pColors.light;
      ctx.beginPath();
      ctx.arc(-11, -12, 4, 0, Math.PI * 2);
      ctx.fill();

      // Right Ear
      ctx.fillStyle = skin.type === 'golden' ? '#f59e0b' : pColors.dark;
      ctx.beginPath();
      ctx.arc(11, -12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.type === 'golden' ? '#78350f' : pColors.light;
      ctx.beginPath();
      ctx.arc(11, -12, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Panda Head
      ctx.fillStyle = skin.type === 'golden' ? '#fde047' : pColors.main;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = skin.type === 'golden' ? '#b45309' : '#cbd5e1';
      ctx.stroke();

      // Draw Red Panda Face details
      if (skin.type === 'red') {
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.85;
        // White face stripes
        ctx.beginPath();
        ctx.ellipse(-12, 2, 6, 3, -0.4, 0, Math.PI * 2);
        ctx.ellipse(12, 2, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Eye Patches
      if (skin.type !== 'astro') {
        ctx.fillStyle = skin.type === 'golden' ? '#92400e' : pColors.dark;
        ctx.beginPath();
        ctx.ellipse(-6, -2, 5, 6, -0.15, 0, Math.PI * 2);
        ctx.ellipse(6, -2, 5, 6, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Pupils & Sparkles
      ctx.fillStyle = skin.type === 'ninja' ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -2, 2, 0, Math.PI * 2);
      ctx.arc(6, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      if (skin.type !== 'ninja') {
        ctx.beginPath();
        ctx.arc(-5.5, -2.5, 0.7, 0, Math.PI * 2);
        ctx.arc(5.5, -2.5, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Ninja Headband overlay
      if (skin.type === 'ninja') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -11, 32, 5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-4, -11, 8, 3);
      }

      // Draw Cheeks / Blush
      if (skin.type !== 'ninja') {
        ctx.fillStyle = pColors.cheek;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(-11, 4, 3, 0, Math.PI * 2);
        ctx.arc(11, 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Snout / Nose / Mouth
      if (skin.type !== 'ninja') {
        ctx.fillStyle = skin.type === 'golden' ? '#fde047' : '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 4, 5, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skin.type === 'golden' ? '#78350f' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-1.8, 2.5);
        ctx.lineTo(1.8, 2.5);
        ctx.lineTo(0, 4.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = skin.type === 'golden' ? '#78350f' : '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-1, 5, 1, Math.PI, 0, true);
        ctx.arc(1, 5, 1, Math.PI, 0, true);
        ctx.stroke();
      } else {
        // Ninja Mask
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 6, 11, 0, Math.PI);
        ctx.fill();
      }

      // Draw Astronaut Visor Helmet Overlay
      if (skin.type === 'astro') {
        // Suit chestplate collar
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-10, 15, 20, 6);
        ctx.fillStyle = '#ef4444'; // glowing badge
        ctx.fillRect(-2, 17, 4, 2);

        // Glass bubble
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shading shine arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, -Math.PI * 0.7, -Math.PI * 0.1);
        ctx.stroke();
      }

      // Draw Royal Crown for Golden Panda
      if (skin.type === 'golden') {
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -17);
        ctx.lineTo(-4, -22);
        ctx.lineTo(0, -19);
        ctx.lineTo(4, -22);
        ctx.lineTo(6, -17);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Active Magnet Halo around Panda
      if (s.activeMagnetTime > 0) {
        ctx.strokeStyle = `rgba(217, 70, 239, ${0.4 + Math.sin(s.frameCount * 0.15) * 0.15})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 12 + Math.sin(s.frameCount * 0.2) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Little dynamic magnetic waves
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 20, s.frameCount * 0.05, s.frameCount * 0.05 + 1.2);
        ctx.stroke();
      }

      // Active Shield Bubble around Panda
      if (s.activeShieldTime > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.strokeStyle = `rgba(244, 63, 94, ${0.75 + Math.sin(s.frameCount * 0.15) * 0.15})`;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shading bubble arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 11, -Math.PI * 0.65, -Math.PI * 0.15);
        ctx.stroke();
      }

      ctx.restore();

      // F. Draw Ground/Floor styled dynamically per theme
      const floorY = height - 50;
      let gBaseColor = '#ffd6e0';
      let gTopperColor = '#ffccd5';
      let gBorderColor = '#fb7185';
      let gDetailColor = '#fb7185';
      let gDrawSakura = true;
      let gDrawSnow = false;
      let gDrawPine = false;
      let gDrawWeeds = false;

      if (curTheme === 'mystic_jungle') {
        gBaseColor = '#042f1a';   // deep jungle bedrock
        gTopperColor = '#064e3b';  // dark green mossy soil
        gBorderColor = '#10b981';  // bright jade border line
        gDetailColor = '#059669';  // moss green detail strokes
        gDrawWeeds = true;
        gDrawSakura = false;
      } else if (curTheme === 'tempest' || curTheme === 'twilight') {
        gBaseColor = '#0f172a';   // dark night slate base
        gTopperColor = '#1e293b';  // deep violet-slate
        gBorderColor = '#6366f1';  // twilight neon purple border
        gDetailColor = '#4f46e5';  // twilight neon purple strokes
        gDrawWeeds = true;
        gDrawSakura = false;
      } else if (curTheme === 'snow') {
        gBaseColor = '#bae6fd';   // soft azure frosty base
        gTopperColor = '#f0f9ff';  // pure white snow topper
        gBorderColor = '#38bdf8';  // cyan outline
        gDetailColor = '#0ea5e9';  // ice crystal detail strokes
        gDrawSnow = true;
        gDrawSakura = false;
      } else if (curTheme === 'sunny_ridges') {
        gBaseColor = '#451a03';   // dark pine forest soil
        gTopperColor = '#15803d';  // evergreen pine forest grass
        gBorderColor = '#166534';  // rich green boundary line
        gDetailColor = '#22c55e';  // vibrant green blades
        gDrawPine = true;
        gDrawSakura = false;
      } else if (curTheme === 'retro_bliss') {
        gBaseColor = '#7c2d12';   // retro brick/clay red-brown base
        gTopperColor = '#22c55e';  // legendary high-contrast retro grass
        gBorderColor = '#15803d';  // dark green grass edge
        gDetailColor = '#16a34a';  // bright grass blades
        gDrawWeeds = true;
        gDrawSakura = false;
      } else if (curTheme === 'sunset_grove') {
        gBaseColor = '#7c2d12';   // warm dark rust ground
        gTopperColor = '#ea580c';  // hot sunset orange topper
        gBorderColor = '#f43f5e';  // raspberry rose line
        gDetailColor = '#f43f5e';  // autumn rose strokes
        gDrawSakura = true;
      } else {
        // Standard / Sunrise Sanctuary style
        gBaseColor = '#ffd6e0';
        gTopperColor = '#ffccd5';
        gBorderColor = '#fb7185';
        gDetailColor = '#fb7185';
        gDrawSakura = true;
      }

      // Draw Base Bedrock
      ctx.fillStyle = gBaseColor;
      ctx.fillRect(0, floorY, width, 50);

      // Draw Top Soil Layer
      ctx.fillStyle = gTopperColor;
      ctx.fillRect(0, floorY, width, 14);

      // Draw border separator line
      ctx.strokeStyle = gBorderColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY + 14);
      ctx.lineTo(width, floorY + 14);
      ctx.stroke();

      // Draw detail elements scrolling along the ground
      ctx.strokeStyle = gDetailColor;
      ctx.lineWidth = 1.8;
      for (let gx = s.floorOffset; gx < width + 40; gx += 20) {
        if (gDrawSakura) {
          // Tiny sakura flowers/grass clumps
          ctx.beginPath();
          ctx.moveTo(gx, floorY + 14);
          ctx.lineTo(gx - 4, floorY + 3);
          ctx.moveTo(gx + 4, floorY + 14);
          ctx.lineTo(gx, floorY + 1);
          ctx.stroke();
        } else if (gDrawSnow) {
          // Draw neat little frosty ice crystals or small snow bumps
          ctx.beginPath();
          ctx.moveTo(gx, floorY + 14);
          ctx.lineTo(gx, floorY + 5);
          ctx.moveTo(gx - 3, floorY + 10);
          ctx.lineTo(gx + 3, floorY + 10);
          ctx.stroke();
        } else if (gDrawPine || gDrawWeeds) {
          // Sharp dynamic weed grass tufts
          ctx.beginPath();
          ctx.moveTo(gx, floorY + 14);
          ctx.lineTo(gx - 3, floorY + 2);
          ctx.moveTo(gx, floorY + 14);
          ctx.lineTo(gx + 2, floorY + 4);
          ctx.moveTo(gx - 4, floorY + 14);
          ctx.lineTo(gx - 6, floorY + 6);
          ctx.stroke();
        }
      }

      // Restore camera shake translation matrix
      ctx.restore();

      // G. Draw Arcade Countdown on Top
      if (s.isCountdownActive) {
        const secondsLeft = Math.ceil(s.countdownTimer / 60);
        const subFraction = s.countdownTimer % 60;
        // Pulse scaling effect
        const scale = 1.6 - (subFraction / 60) * 0.6;
        const opacity = subFraction / 60;

        ctx.save();
        ctx.translate(width / 2, height / 2 - 40);
        ctx.scale(scale, scale);
        
        ctx.font = '900 80px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(244, 63, 94, 0.4)';
        ctx.shadowBlur = 15;
        
        // Golden Orange Gradient
        const textGrad = ctx.createLinearGradient(-30, -30, 30, 30);
        textGrad.addColorStop(0, '#fde047');
        textGrad.addColorStop(1, '#f97316');
        ctx.fillStyle = textGrad;
        ctx.globalAlpha = opacity;
        
        ctx.fillText(secondsLeft > 0 ? secondsLeft.toString() : 'GO!', 0, 0);
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(gameLoop);
    };

    const triggerGameOver = () => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.isGameOver = true;
      s.shakeTimer = 45;
      s.shakeIntensity = 22;
      setIsGameOverState(true);
      playGameOver();
      const isLevelCleared = gameMode === 'STORY' && activeLevel && s.score >= activeLevel.targetScore;
      onGameOver(s.score, s.coinsCollected, s.jumpsCount, difficulty, !!isLevelCleared);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [equippedSkinId, isPaused, showGetReady, gameMode, selectedLevelId, difficulty, activeLevel]);

  const handlePauseToggle = () => {
    playClick();
    if (isPaused) {
      // Close pause modal, and start the beautiful 3s visual countdown on canvas
      setIsPaused(false);
      stateRef.current.isCountdownActive = true;
      stateRef.current.countdownTimer = 180; // 3 seconds (180 frames at 60 FPS)
    } else {
      setIsPaused(true);
    }
  };

  const handleBackToMenu = () => {
    playClick();
    onNavigate('MENU');
  };

  const handleBackToDifficulty = () => {
    playClick();
    onNavigate('DIFFICULTY');
  };

  return (
    <div 
      ref={containerRef}
      id="game-viewport"
      className="relative w-full h-full max-w-md mx-auto bg-[#fff5f6] select-none overflow-hidden flex flex-col justify-between border-x border-rose-100/60"
    >
      {/* 2D HTML5 Physics Canvas */}
      <canvas
        ref={canvasRef}
        onClick={triggerJump}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none block"
      />

      {/* --- HUD OVERLAY --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
        {/* Left Side: Score, Hearts & Active Boosts */}
        <div className="flex flex-col space-y-2 items-start">
          {/* Animated Heart Icons Row */}
          <div className="flex items-center space-x-1.5 bg-white/80 backdrop-blur-md py-1 px-2.5 rounded-full border border-rose-200/50 shadow-md">
            {[1, 2, 3].map((h) => {
              const active = hearts >= h;
              return (
                <motion.div
                  key={h}
                  animate={active ? { scale: [1, 1.15, 1] } : { scale: 0.9 }}
                  transition={active ? { duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: h * 0.15 } : {}}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      active
                        ? 'text-rose-500 fill-rose-500 filter drop-shadow-[0_1px_2px_rgba(244,63,94,0.35)]'
                        : 'text-rose-200/60 fill-transparent'
                    } transition-all duration-300`}
                  />
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-bold text-rose-450 tracking-[0.2em] uppercase">
              {gameMode === 'STORY' ? 'LEVEL PROGRESS' : 'SCORE'}
            </span>
            <span className="text-3xl font-black text-rose-950 drop-shadow-[0_1px_5px_rgba(251,113,133,0.15)]">
              {score}
              {gameMode === 'STORY' && targetScore && (
                <span className="text-sm font-bold text-rose-450/75 ml-1">/ {targetScore}</span>
              )}
            </span>
          </div>

          {gameMode === 'STORY' && activeLevel && (
            <div className="flex items-center space-x-1 mt-1 bg-rose-50/80 backdrop-blur-sm border border-rose-100 py-0.5 px-2 rounded-md">
              <Compass className="w-3 h-3 text-rose-500 animate-pulse" />
              <span className="text-[9px] font-bold text-rose-700 font-mono tracking-wider uppercase">
                {activeLevel.name}
              </span>
            </div>
          )}

          {gameMode === 'ENDLESS' && activeEndlessTheme && (() => {
            const themeKey = activeEndlessTheme.theme;
            const badgeClass = {
              sunrise: 'bg-amber-50/90 border-amber-200/50 text-amber-700',
              sunset_grove: 'bg-rose-50/90 border-rose-200/50 text-rose-700',
              snow: 'bg-sky-50/90 border-sky-200/50 text-sky-700',
              mist: 'bg-slate-100/90 border-slate-300/50 text-slate-700',
              twilight: 'bg-indigo-950/85 border-indigo-500/30 text-indigo-200',
              tempest: 'bg-slate-950/85 border-slate-700/40 text-slate-300',
              mystic_jungle: 'bg-emerald-950/85 border-emerald-500/30 text-emerald-300',
              sunny_ridges: 'bg-teal-50/90 border-teal-200/50 text-teal-700',
              retro_bliss: 'bg-blue-50/90 border-blue-200/50 text-blue-700'
            }[themeKey] || 'bg-rose-50/80 border-rose-100 text-rose-700';

            const iconClass = {
              sunrise: 'text-amber-500',
              sunset_grove: 'text-rose-500',
              snow: 'text-sky-500',
              mist: 'text-slate-500',
              twilight: 'text-indigo-400',
              tempest: 'text-slate-400',
              mystic_jungle: 'text-emerald-400',
              sunny_ridges: 'text-teal-500',
              retro_bliss: 'text-blue-500'
            }[themeKey] || 'text-rose-500';

            return (
              <div className={`flex items-center space-x-1.5 mt-1 backdrop-blur-sm border py-0.5 px-2.5 rounded-md shadow-sm transition-all duration-300 ${badgeClass}`}>
                <Compass className={`w-3 h-3 animate-pulse ${iconClass}`} />
                <span className="text-[9px] font-black font-mono tracking-wider uppercase">
                  {activeEndlessTheme.name}
                </span>
              </div>
            );
          })()}

          {/* Active Boost Indicators */}
          <div className="flex flex-col space-y-1">
            {activeMagnet > 0 && (
              <div className="flex items-center space-x-1 bg-purple-100/85 border border-purple-200 px-2 py-0.5 rounded-full shadow-sm text-purple-700 text-[9px] font-mono font-bold">
                <span>🧲</span>
                <span className="uppercase tracking-wider">MAGNET: {Math.ceil(activeMagnet / 60)}s</span>
              </div>
            )}
            {activeShield && (
              <div className="flex items-center space-x-1 bg-cyan-100/85 border border-cyan-200 px-2 py-0.5 rounded-full shadow-sm text-cyan-700 text-[9px] font-mono font-bold">
                <span>🛡️</span>
                <span className="uppercase tracking-wider">SHIELD ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Center-Right Pause Button (Pointer Enabled) */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Real-time coin counter */}
          <div className="flex items-center space-x-1.5 bg-white/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-rose-200/50 shadow-md">
            <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/15 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs font-mono font-bold text-rose-950">{coinsCollected}</span>
          </div>

          {!isGameOverState && !showGetReady && (
            <button
              onClick={handlePauseToggle}
              className="p-2 bg-white/75 hover:bg-white active:bg-rose-50 text-rose-600 rounded-full border border-rose-200/50 shadow-md cursor-pointer transition-colors"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* --- GET READY POPUP SCREEN --- */}
      <AnimatePresence>
        {showGetReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={triggerJump}
            className="absolute inset-0 bg-rose-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center text-center cursor-pointer p-6 z-20"
          >
            <motion.div
              initial={{ scale: 0.95, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
              className="w-full max-w-[320px] p-6 rounded-[28px] border border-rose-200/60 bg-white/90 backdrop-blur-xl shadow-[0_15px_35px_rgba(251,113,133,0.12)] flex flex-col items-center space-y-4 text-center"
            >
              <div className="absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none" />

              <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-rose-100 border border-rose-200 text-rose-500 rounded-full animate-bounce">
                <Play className="w-6 h-6 fill-current ml-1 text-rose-500" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-black text-rose-950 tracking-wider uppercase">Ready to Flap?</h2>
                <p className="text-[11px] text-rose-500 font-bold leading-relaxed uppercase tracking-wider">
                  Tap anywhere on the screen or press <strong className="font-mono bg-rose-100 border border-rose-200/50 px-1 py-0.5 rounded text-rose-700 font-bold">SPACE</strong> to flap. Avoid hitting bamboo tubes!
                </p>
              </div>

              <span className="inline-block text-[10px] font-mono font-bold tracking-[0.2em] text-rose-600 bg-rose-50 border border-rose-100 py-1.5 px-4 rounded-full animate-pulse uppercase">
                TAP TO START
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GAME OVER SCREEN OVERLAY --- */}
      <AnimatePresence>
        {isGameOverState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-rose-950/20 backdrop-blur-md flex items-center justify-center p-6 z-30"
          >
            {gameMode === 'STORY' ? (
              // --- STORY MODE GAME END STATE ---
              (() => {
                const isCleared = score >= (targetScore || 0);
                return (
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white border border-rose-250/60 w-full max-w-xs rounded-[28px] p-5 shadow-[0_20px_50px_rgba(251,113,133,0.15)] flex flex-col items-center text-center space-y-4 backdrop-blur-xl"
                  >
                    <div className="absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none" />

                    {/* Victory or Defeat Title */}
                    <div className="space-y-1">
                      <h2 className={`text-2xl font-black tracking-[0.12em] uppercase ${
                        isCleared 
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600'
                          : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600'
                      }`}>
                        {isCleared ? 'Level Cleared!' : 'Level Failed'}
                      </h2>
                      {isCleared ? (
                        <span className="inline-block text-[9px] font-mono font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-300 py-0.5 px-3 rounded-full animate-pulse tracking-[0.12em] uppercase">
                          🎉 OBJECTIVE MET! 🎉
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-mono font-extrabold text-rose-600 bg-rose-500/10 border border-rose-300 py-0.5 px-3 rounded-full tracking-[0.12em] uppercase">
                          TARGET SCORE: {targetScore}
                        </span>
                      )}
                    </div>

                    {/* Stats Summary Block */}
                    <div className="grid grid-cols-2 gap-3.5 w-full bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl text-rose-950">
                      <div className="text-center">
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Score</span>
                        <p className={`text-2xl font-black ${isCleared ? 'text-emerald-700' : 'text-rose-900'}`}>{score}</p>
                      </div>
                      <div className="text-center border-l border-rose-100">
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Coins</span>
                        <p className="text-2xl font-black text-rose-900 flex items-center justify-center">
                          <Coins className="w-5 h-5 text-yellow-500 fill-yellow-500/10 mr-1 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>{coinsCollected}</span>
                        </p>
                      </div>
                    </div>

                    {/* Story Action Routes */}
                    <div className="flex flex-col space-y-2 w-full pt-1">
                      {isCleared ? (
                        <button
                          onClick={() => { playClick(); onNavigate('STORY_LEVELS'); }}
                          className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-emerald-300/30 cursor-pointer shadow-md transition-all active:scale-98"
                        >
                          <Trophy className="w-4 h-4 text-white" />
                          <span>NEXT LEVEL</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => { playClick(); resetGame(); }}
                          className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-300/30 cursor-pointer shadow-md transition-all active:scale-98"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>RETRY LEVEL</span>
                        </button>
                      )}

                      <button
                        onClick={() => { playClick(); onNavigate('STORY_LEVELS'); }}
                        className="flex items-center justify-center space-x-2 w-full py-3 bg-white hover:bg-rose-50 text-rose-800 rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-200 shadow-sm cursor-pointer transition-colors active:scale-98"
                      >
                        <Compass className="w-4 h-4 text-rose-500" />
                        <span>STORY LEVELS</span>
                      </button>

                      <button
                        onClick={handleBackToMenu}
                        className="flex items-center justify-center space-x-2 w-full py-3 bg-white hover:bg-rose-50 text-rose-800 rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-200 shadow-sm cursor-pointer transition-colors active:scale-98"
                      >
                        <Home className="w-4 h-4 text-rose-450" />
                        <span>BACK TO HOME</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              // --- ENDLESS MODE GAME OVER STATE ---
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white border border-rose-250/60 w-full max-w-xs rounded-[28px] p-5 shadow-[0_20px_50px_rgba(251,113,133,0.15)] flex flex-col items-center text-center space-y-4 backdrop-blur-xl"
              >
                <div className="absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none" />

                {/* Game Over Title */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 tracking-[0.15em] uppercase">
                    Game Over
                  </h2>
                  {score > runHighScore && score > 0 ? (
                    <span className="inline-block text-[9px] font-mono font-extrabold text-yellow-600 bg-yellow-500/10 border border-yellow-300 py-0.5 px-3 rounded-full animate-pulse tracking-[0.15em] uppercase">
                      ⭐ NEW BEST! ⭐
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold">Better luck next time!</span>
                  )}
                </div>

                {/* Stats Summary Block */}
                <div className="grid grid-cols-2 gap-3.5 w-full bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl text-rose-950">
                  <div className="text-center">
                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Score</span>
                    <p className="text-2xl font-black text-rose-900">{score}</p>
                  </div>
                  <div className="text-center border-l border-rose-100">
                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Coins</span>
                    <p className="text-2xl font-black text-rose-900 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-500 fill-yellow-500/10 mr-1 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>{coinsCollected}</span>
                    </p>
                  </div>
                </div>

                {/* Action Routes */}
                <div className="flex flex-col space-y-2 w-full pt-1">
                  {/* Retry */}
                  <button
                    onClick={() => { playClick(); resetGame(); }}
                    className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-300/30 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RETRY GAME</span>
                  </button>

                  {/* Difficulty Select */}
                  <button
                    onClick={handleBackToDifficulty}
                    className="flex items-center justify-center space-x-2 w-full py-3 bg-white hover:bg-rose-50 text-rose-800 rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-200 shadow-sm cursor-pointer transition-colors active:scale-98"
                  >
                    <Trophy className="w-4 h-4 text-rose-500" />
                    <span>CHANGE DIFFICULTY</span>
                  </button>

                  {/* Home */}
                  <button
                    onClick={handleBackToMenu}
                    className="flex items-center justify-center space-x-2 w-full py-3 bg-white hover:bg-rose-50 text-rose-800 rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-200 shadow-sm cursor-pointer transition-colors active:scale-98"
                  >
                    <Home className="w-4 h-4 text-rose-450" />
                    <span>BACK TO HOME</span>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PAUSE DIALOG OVERLAY --- */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-rose-950/20 backdrop-blur-sm flex items-center justify-center p-6 z-40"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white border border-rose-200 w-full max-w-sm rounded-[28px] p-5.5 shadow-[0_15px_40px_rgba(251,113,133,0.12)] flex flex-col items-center text-center space-y-4 backdrop-blur-xl"
            >
              <div className="absolute inset-0 rounded-[28px] border border-white/40 pointer-events-none" />

              <div className="space-y-1">
                <h2 className="text-lg font-black text-rose-950 tracking-wider uppercase">Game Paused</h2>
                <p className="text-[11px] text-rose-400 font-bold leading-relaxed uppercase tracking-wider mt-0.5">Take a breath, get ready, and return.</p>
              </div>

              {/* Play again */}
              <div className="flex flex-col space-y-2.5 w-full pt-1">
                <button
                  onClick={handlePauseToggle}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-300/20 shadow-md cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME GAME</span>
                </button>

                <button
                  onClick={handleBackToMenu}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-white hover:bg-rose-50 text-rose-800 rounded-xl font-bold text-xs tracking-wider uppercase border border-rose-200 shadow-sm cursor-pointer transition-colors active:scale-98"
                >
                  <Home className="w-4 h-4 text-rose-450" />
                  <span>QUIT TO MAIN MENU</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant creator credit in corner */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <span className="text-[8px] font-mono font-black tracking-[0.25em] uppercase text-rose-900/40">
          Created by OM BRAHMAN
        </span>
      </div>
    </div>
  );
}
