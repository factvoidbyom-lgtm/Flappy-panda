import { motion } from 'motion/react';

interface PandaAvatarProps {
  skinType: 'classic' | 'red' | 'sakura' | 'astro' | 'frosty' | 'sprite' | 'ninja' | 'ghost' | 'cyber' | 'storm' | 'golden' | 'chrono' | 'emperor' | 'brahmans';
  size?: number;
  className?: string;
  isFlying?: boolean;
}

export default function PandaAvatar({ skinType, size = 120, className = '', isFlying = false }: PandaAvatarProps) {
  // Color presets based on skin types
  const getSkinColors = () => {
    switch (skinType) {
      case 'red':
        return {
          main: '#f97316', // bright red-orange
          dark: '#7c2d12', // dark rust/brown
          light: '#ffedd5', // soft warm peach
          cheek: '#ea580c',
          eye: '#3c0d02'
        };
      case 'sakura':
        return {
          main: '#fff5f6',
          dark: '#f43f5e',
          light: '#ffe4e6',
          cheek: '#fda4af',
          eye: '#9f1239'
        };
      case 'astro':
        return {
          main: '#f8fafc', // futuristic white
          dark: '#1e293b', // deep space slate
          light: '#e2e8f0', // cool light gray
          cheek: '#fda4af',
          eye: '#0f172a'
        };
      case 'frosty':
        return {
          main: '#f0f9ff',
          dark: '#0369a1',
          light: '#e0f2fe',
          cheek: '#7dd3fc',
          eye: '#0c4a6e'
        };
      case 'sprite':
        return {
          main: '#ecfdf5',
          dark: '#047857',
          light: '#d1fae5',
          cheek: '#6ee7b7',
          eye: '#064e3b'
        };
      case 'ninja':
        return {
          main: '#f8fafc', // white panda face
          dark: '#334155', // dark stealth gray
          light: '#e2e8f0', // light gray accents
          cheek: '#f1f5f9',
          eye: '#0f172a'
        };
      case 'ghost':
        return {
          main: '#faf5ff',
          dark: '#6b21a8',
          light: '#f3e8ff',
          cheek: '#d8b4fe',
          eye: '#581c87'
        };
      case 'cyber':
        return {
          main: '#ecfeff',
          dark: '#0e7490',
          light: '#cffafe',
          cheek: '#67e8f9',
          eye: '#164e63'
        };
      case 'storm':
        return {
          main: '#fefbeb',
          dark: '#a16207',
          light: '#fef08a',
          cheek: '#fde047',
          eye: '#713f12'
        };
      case 'golden':
        return {
          main: '#fef08a', // vibrant pale gold
          dark: '#b45309', // metallic dark amber
          light: '#fde047', // bright yellow gold
          cheek: '#f59e0b',
          eye: '#78350f'
        };
      case 'chrono':
        return {
          main: '#fdf2f8',
          dark: '#be185d',
          light: '#fbcfe8',
          cheek: '#f472b6',
          eye: '#831843'
        };
      case 'emperor':
        return {
          main: '#fef2f2',
          dark: '#b91c1c',
          light: '#fee2e2',
          cheek: '#fca5a5',
          eye: '#7f1d1d'
        };
      case 'brahmans':
        return {
          main: '#fef08a', // vibrant pale gold
          dark: '#78350f', // deep warm gold-amber
          light: '#fde047', // bright glowing yellow gold
          cheek: '#ea580c', // peach blush
          eye: '#78350f'
        };
      case 'classic':
      default:
        return {
          main: '#ffffff', // clean white
          dark: '#1e293b', // slate-900 black ears/patches
          light: '#f1f5f9', // soft gray shading
          cheek: '#fda4af', // pink blush
          eye: '#090d16'
        };
    }
  };

  const colors = getSkinColors();

  // Gentle floating oscillation if it's flying
  const floatTransition = isFlying 
    ? {
        y: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut"
        }
      }
    : undefined;

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      animate={isFlying ? { y: [-4, 4] } : undefined}
      transition={floatTransition}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradients */}
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <linearGradient id="glassHelm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldCrown" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* --- Ears --- */}
        {/* Left Ear */}
        <ellipse
          cx="28"
          cy="22"
          rx="12"
          ry="10"
          fill={(skinType === 'golden' || skinType === 'brahmans') ? 'url(#goldGlow)' : colors.dark}
        />
        <ellipse
          cx="28"
          cy="22"
          rx="7"
          ry="6"
          fill={(skinType === 'golden' || skinType === 'brahmans') ? '#78350f' : colors.light}
        />

        {/* Right Ear */}
        <ellipse
          cx="72"
          cy="22"
          rx="12"
          ry="10"
          fill={(skinType === 'golden' || skinType === 'brahmans') ? 'url(#goldGlow)' : colors.dark}
        />
        <ellipse
          cx="72"
          cy="22"
          rx="7"
          ry="6"
          fill={(skinType === 'golden' || skinType === 'brahmans') ? '#78350f' : colors.light}
        />

        {/* --- Face Base --- */}
        <circle
          cx="50"
          cy="52"
          r="36"
          fill={(skinType === 'golden' || skinType === 'brahmans') ? 'url(#goldGlow)' : colors.main}
          stroke={(skinType === 'golden' || skinType === 'brahmans') ? '#d97706' : '#cbd5e1'}
          strokeWidth="1.5"
        />

        {/* Red Panda Face Markings */}
        {skinType === 'red' && (
          <>
            {/* White eyebrow/forehead patch */}
            <path d="M 32 32 Q 50 38 68 32 Q 50 25 32 32" fill="#fff" opacity="0.8" />
            {/* White side cheek patches */}
            <path d="M 16 52 Q 24 58 30 52 Q 22 42 16 52" fill="#fff" opacity="0.8" />
            <path d="M 84 52 Q 76 58 70 52 Q 78 42 84 52" fill="#fff" opacity="0.8" />
          </>
        )}

        {/* --- Eye Patches --- */}
        {skinType !== 'astro' && (
          <>
            {/* Left Patch */}
            <ellipse
              cx="35"
              cy="48"
              rx="11"
              ry="13"
              transform="rotate(-12, 35, 48)"
              fill={(skinType === 'golden' || skinType === 'brahmans') ? '#92400e' : colors.dark}
            />
            {/* Right Patch */}
            <ellipse
              cx="65"
              cy="48"
              rx="11"
              ry="13"
              transform="rotate(12, 65, 48)"
              fill={(skinType === 'golden' || skinType === 'brahmans') ? '#92400e' : colors.dark}
            />
          </>
        )}

        {/* --- Eyes --- */}
        {/* Left Pupil */}
        <circle
          cx="35"
          cy="48"
          r="5"
          fill={skinType === 'ninja' ? '#ef4444' : '#ffffff'} // ninja has focused red eyes
        />
        <circle cx="34" cy="46" r="1.8" fill="#ffffff" /> {/* sparkle */}
        {skinType !== 'ninja' && <circle cx="37" cy="50" r="0.8" fill="#ffffff" />}

        {/* Right Pupil */}
        <circle
          cx="65"
          cy="48"
          r="5"
          fill={skinType === 'ninja' ? '#ef4444' : '#ffffff'}
        />
        <circle cx="64" cy="46" r="1.8" fill="#ffffff" /> {/* sparkle */}
        {skinType !== 'ninja' && <circle cx="67" cy="50" r="0.8" fill="#ffffff" />}

        {/* --- Ninja Headband Overlay (Stealth style) --- */}
        {skinType === 'ninja' && (
          <>
            {/* Band across head */}
            <path
              d="M 18 36 Q 50 42 82 36 L 81 28 Q 50 34 19 28 Z"
              fill="#1e293b"
            />
            {/* Headband knot tie tails */}
            <path
              d="M 17 32 L 8 28 L 12 36 Z"
              fill="#0f172a"
            />
            <path
              d="M 18 34 L 5 36 L 11 42 Z"
              fill="#1e293b"
            />
            {/* Little metallic plate in the middle */}
            <rect x="42" y="31" width="16" height="7" rx="1.5" fill="#94a3b8" />
            <circle cx="45" cy="34.5" r="0.8" fill="#475569" />
            <circle cx="55" cy="34.5" r="0.8" fill="#475569" />
          </>
        )}

        {/* --- Cheeks / Blush --- */}
        {skinType !== 'ninja' && (
          <>
            <circle cx="24" cy="58" r="5" fill={colors.cheek} opacity="0.4" />
            <circle cx="76" cy="58" r="5" fill={colors.cheek} opacity="0.4" />
          </>
        )}

        {/* --- Snout / Mouth / Nose --- */}
        {skinType !== 'ninja' && (
          <>
            {/* Snout Background */}
            <ellipse cx="50" cy="59" rx="11" ry="8" fill={(skinType === 'golden' || skinType === 'brahmans') ? '#fde047' : '#ffffff'} />
            
            {/* Nose */}
            <polygon points="47,56 53,56 50,59" fill={(skinType === 'golden' || skinType === 'brahmans') ? '#78350f' : '#1e293b'} />
            
            {/* Cute Smile */}
            <path
              d="M 45 60 Q 48 63 50 60 Q 52 63 55 60"
              stroke={(skinType === 'golden' || skinType === 'brahmans') ? '#78350f' : '#1e293b'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Ninja Mask overlay covering the mouth */}
        {skinType === 'ninja' && (
          <path
            d="M 23 60 Q 50 78 77 60 Q 65 80 50 80 Q 35 80 23 60 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
        )}

        {/* --- Astro Helmet Overlay --- */}
        {skinType === 'astro' && (
          <>
            {/* Futuristic space collar */}
            <path d="M 28 80 L 72 80 L 62 88 L 38 88 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            <rect x="44" y="82" width="12" height="4" rx="1" fill="#ef4444" /> {/* red chest light */}

            {/* Translucent glass dome helmet */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="url(#glassHelm)"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              opacity="0.95"
            />
            {/* Glass high reflection arc */}
            <path
              d="M 14 36 A 40 40 0 0 1 76 18 A 40 40 0 0 0 20 50 A 40 40 0 0 1 14 36 Z"
              fill="url(#glassReflection)"
            />
            {/* Tiny helmet antenna */}
            <line x1="50" y1="6" x2="50" y2="2" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="50" cy="1" r="2.5" fill="#ef4444" />
          </>
        )}

        {/* --- Golden Crown for Golden Panda --- */}
        {skinType === 'golden' && (
          <g transform="translate(36, 1)">
            {/* Mini cute royal crown */}
            <path
              d="M 2 15 L 6 3 L 14 10 L 22 3 L 26 15 Z"
              fill="url(#goldCrown)"
              stroke="#92400e"
              strokeWidth="1.5"
            />
            {/* Crown gems */}
            <circle cx="6" cy="2" r="1.5" fill="#ef4444" />
            <circle cx="14" cy="9" r="1.5" fill="#3b82f6" />
            <circle cx="22" cy="2" r="1.5" fill="#ef4444" />
          </g>
        )}

        {/* --- Holy Brahman Aura & Divine Crown for Brahmans Skin --- */}
        {skinType === 'brahmans' && (
          <>
            {/* Spinning Divine Halo */}
            <circle
              cx="50"
              cy="52"
              r="44"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.85"
            />

            {/* Glowing inner aura */}
            <circle
              cx="50"
              cy="52"
              r="40"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.5"
            />

            {/* Grand Royal Crown for Brahmans */}
            <g transform="translate(32, 1)">
              <path
                d="M 2 15 L 6 2 L 13 9 L 18 2 L 25 9 L 30 2 L 34 15 Z"
                fill="url(#goldCrown)"
                stroke="#92400e"
                strokeWidth="1.5"
              />
              {/* Crown precious gems */}
              <circle cx="6" cy="1.5" r="1.5" fill="#3b82f6" />
              <circle cx="18" cy="1.5" r="1.5" fill="#ef4444" />
              <circle cx="30" cy="1.5" r="1.5" fill="#3b82f6" />
              <circle cx="13" cy="8" r="1.2" fill="#10b981" />
              <circle cx="25" cy="8" r="1.2" fill="#10b981" />
            </g>
          </>
        )}
      </svg>
    </motion.div>
  );
}
