import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Music, HelpCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import { GameSettings, UserStats } from '../types';
import { playClick } from '../utils/audio';

interface SettingsProps {
  settings: GameSettings;
  stats: UserStats;
  onUpdateSettings: (settings: GameSettings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export default function Settings({
  settings,
  stats,
  onUpdateSettings,
  onResetProgress,
  onBack
}: SettingsProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleBack = () => {
    playClick();
    onBack();
  };

  const toggleSound = () => {
    playClick();
    onUpdateSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled
    });
  };

  const toggleMusic = () => {
    playClick();
    onUpdateSettings({
      ...settings,
      musicEnabled: !settings.musicEnabled
    });
  };

  const confirmReset = () => {
    playClick();
    onResetProgress();
    setShowConfirmReset(false);
  };

  return (
    <div 
      id="settings-panel"
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
          <ArrowLeft className="w-4 h-4 text-rose-600" />
        </button>
        <span className="text-lg font-black tracking-[0.15em] uppercase text-rose-950">Settings</span>
      </div>

      {/* Settings Grid Content */}
      <div className="flex-grow my-6 overflow-y-auto space-y-5 pr-1 custom-scrollbar z-10">
        {/* Sound Controls Card */}
        <div className="bg-white/85 backdrop-blur-md p-4.5 rounded-2xl border border-rose-100 shadow-md space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.25em] text-rose-450 uppercase">Audio Settings</h3>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${settings.soundEnabled ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-rose-50/50 text-rose-400 border-rose-100'}`}>
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Sound Effects</h4>
                <p className="text-[9px] text-rose-750 font-semibold uppercase tracking-wider mt-0.5">Jump flaps & coin chimes</p>
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={toggleSound}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.soundEnabled ? 'bg-rose-500' : 'bg-rose-200'}`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${settings.soundEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Background Music Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${settings.musicEnabled ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-rose-50/50 text-rose-400 border-rose-100'}`}>
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Background Music</h4>
                <p className="text-[9px] text-rose-750 font-semibold uppercase tracking-wider mt-0.5">Procedural zen loop</p>
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={toggleMusic}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.musicEnabled ? 'bg-rose-500' : 'bg-rose-200'}`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${settings.musicEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Premium Gameplay & Preferences Settings Card */}
        <div className="bg-white/85 backdrop-blur-md p-4.5 rounded-2xl border border-rose-100 shadow-md space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.25em] text-rose-450 uppercase">Preferences</h3>

          {/* Vibration */}
          <div className="flex items-center justify-between border-b border-rose-50 pb-3">
            <div>
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Haptic Feedback</h4>
              <p className="text-[9px] text-rose-700 font-semibold uppercase tracking-wider">Vibrate on bumps & milestones</p>
            </div>
            <button
              onClick={() => {
                playClick();
                onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled });
                if (navigator.vibrate) navigator.vibrate(50);
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.vibrationEnabled ? 'bg-rose-500' : 'bg-rose-200'}`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${settings.vibrationEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-2 border-b border-rose-50 pb-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Graphics Quality</h4>
              <span className="text-[10px] font-mono font-black text-rose-550">{settings.graphicsQuality || 'HIGH'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-rose-50/50 p-0.5 rounded-xl border border-rose-100">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => { playClick(); onUpdateSettings({ ...settings, graphicsQuality: q }); }}
                  className={`py-1 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all ${
                    (settings.graphicsQuality || 'HIGH') === q 
                      ? 'bg-rose-500 text-white shadow-sm font-black' 
                      : 'text-rose-700 hover:bg-rose-100/30'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* FPS Limit */}
          <div className="space-y-2 border-b border-rose-50 pb-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">FPS target</h4>
              <span className="text-[10px] font-mono font-black text-rose-550">{settings.fpsLimit || 60} FPS</span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-rose-50/50 p-0.5 rounded-xl border border-rose-100">
              {([30, 60] as const).map((fps) => (
                <button
                  key={fps}
                  onClick={() => { playClick(); onUpdateSettings({ ...settings, fpsLimit: fps }); }}
                  className={`py-1 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all ${
                    (settings.fpsLimit || 60) === fps 
                      ? 'bg-rose-500 text-white shadow-sm font-black' 
                      : 'text-rose-700 hover:bg-rose-100/30'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Battery Saver */}
          <div className="flex items-center justify-between border-b border-rose-50 pb-3">
            <div>
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Battery Saver</h4>
              <p className="text-[9px] text-rose-700 font-semibold uppercase tracking-wider">Lowers particle densities</p>
            </div>
            <button
              onClick={() => {
                playClick();
                onUpdateSettings({ ...settings, batterySaver: !settings.batterySaver });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.batterySaver ? 'bg-rose-500' : 'bg-rose-200'}`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${settings.batterySaver ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Language Selection</h4>
            <div className="grid grid-cols-5 gap-1 bg-rose-50/50 p-0.5 rounded-xl border border-rose-100">
              {(['EN', 'ES', 'FR', 'DE', 'HI'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { playClick(); onUpdateSettings({ ...settings, language: lang }); }}
                  className={`py-1 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all ${
                    (settings.language || 'EN') === lang 
                      ? 'bg-rose-500 text-white shadow-sm font-black' 
                      : 'text-rose-700 hover:bg-rose-100/30'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Developer Credits Card */}
        <div className="bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-pink-500/5 p-4.5 rounded-2xl border border-amber-200/50 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-full blur-xl" />
          <h4 className="text-[9px] font-mono font-black text-amber-600 tracking-[0.25em] uppercase mb-1">DEVELOPER EDITION</h4>
          <p className="text-xs font-extrabold text-rose-950 uppercase tracking-wider">CREATED BY OM BRAHMAN</p>
          <p className="text-[9px] text-rose-500/80 font-bold uppercase tracking-wider mt-1">PANDA FLAP PREMIUM VERSION 1.0.0</p>
        </div>

        {/* Statistics Card */}
        <div className="bg-white/85 backdrop-blur-md p-4.5 rounded-2xl border border-rose-100 shadow-md space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.25em] text-rose-450 uppercase">Your Stats</h3>
          
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider">Games Played</span>
              <p className="text-base font-black text-rose-900 mt-0.5">{stats.gamesPlayed}</p>
            </div>
            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider">Total Coins</span>
              <p className="text-base font-black text-rose-900 mt-0.5">{stats.totalCoinsCollected}</p>
            </div>
          </div>

          {/* High Scores Sub List */}
          <div className="border-t border-rose-100 pt-4 space-y-2.5">
            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-[0.2em]">High Scores by Level</span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl text-emerald-700 border border-emerald-100">
                <span className="font-bold tracking-wider">EASY</span>
                <span className="font-black text-xs">{stats.highScore.EASY}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-xl text-amber-700 border border-amber-100">
                <span className="font-bold tracking-wider">MEDIUM</span>
                <span className="font-black text-xs">{stats.highScore.MEDIUM}</span>
              </div>
              <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-xl text-rose-700 border border-rose-100">
                <span className="font-bold tracking-wider">HARD</span>
                <span className="font-black text-xs">{stats.highScore.HARD}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset progress area */}
      <div className="pb-6 w-full z-10">
        <button
          onClick={() => { playClick(); setShowConfirmReset(true); }}
          className="flex items-center justify-center space-x-2 w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-[10px] tracking-wider uppercase border border-rose-200/65 shadow-md cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET ALL PROGRESS</span>
        </button>
      </div>

      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/20 backdrop-blur-md flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-rose-200/80 w-full max-w-sm rounded-[28px] p-5.5 shadow-[0_20px_50px_rgba(251,113,133,0.15)] flex flex-col items-center text-center space-y-4"
            >
              <div className="p-3.5 bg-rose-50 text-rose-500 rounded-full animate-pulse border border-rose-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider">Confirm Reset</h3>
                <p className="text-[11px] font-semibold text-rose-700/85 leading-relaxed uppercase tracking-wider">
                  This action will permanently erase your high scores, coins, and lock all purchased skins.
                </p>
              </div>

              {/* Confirm / Cancel Buttons */}
              <div className="grid grid-cols-2 gap-3.5 w-full mt-2">
                <button
                  onClick={() => { playClick(); setShowConfirmReset(false); }}
                  className="py-3 bg-white hover:bg-rose-50 text-rose-850 rounded-xl font-bold text-[10px] tracking-wider uppercase border border-rose-200 cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold text-[10px] tracking-wider uppercase border border-rose-600 cursor-pointer shadow-md"
                >
                  Reset Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
