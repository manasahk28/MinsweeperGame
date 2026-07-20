import { motion } from 'motion/react';
import { 
  Clock, 
  Flag, 
  FlagOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trophy,
  Zap
} from 'lucide-react';
import { GameStatus } from '../types';

interface ScoreBoardProps {
  status: GameStatus;
  minesCount: number;
  flagCount: number;
  timer: number;
  isMouseDown: boolean;
  onReset: () => void;
  clickMode: 'reveal' | 'flag';
  setClickMode: (mode: 'reveal' | 'flag') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  bestTime: number | null;
}

export default function ScoreBoard({
  status,
  minesCount,
  flagCount,
  timer,
  isMouseDown,
  onReset,
  clickMode,
  setClickMode,
  soundEnabled,
  setSoundEnabled,
  bestTime,
}: ScoreBoardProps) {
  // Format numbers to 3 digits (e.g., 005)
  const formatNumber = (num: number): string => {
    if (num < 0) {
      const positiveStr = Math.abs(num).toString().padStart(2, '0');
      return `-${positiveStr.slice(-2)}`;
    }
    return num.toString().padStart(3, '0').slice(-3);
  };

  // Get current smiley face representation based on state and user interaction
  const getSmileyFace = () => {
    if (status === 'won') return '😎';
    if (status === 'lost') return '😵';
    if (isMouseDown) return '😮';
    return '😊';
  };

  const remainingMines = minesCount - flagCount;

  return (
    <div 
      id="minesweeper-scoreboard"
      className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-3 sm:p-5 border border-pink-100 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Counters Panel */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6 flex-1 w-full">
        {/* Mines Counter */}
        <div className="flex flex-col items-center flex-1 sm:flex-initial">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Mines</span>
          <div className="flex items-center gap-1 sm:gap-2 bg-brand-pink/30 border border-brand-pink/50 rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-slate-700 font-mono text-base sm:text-xl font-bold min-w-[72px] sm:min-w-[90px] justify-center shadow-inner">
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-brand-pink/20 text-slate-600" />
            <span>{formatNumber(remainingMines)}</span>
          </div>
        </div>

        {/* Smiley Reset Button */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Reset</span>
          <motion.button
            id="smiley-reset-button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={onReset}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-brand-pink bg-brand-pink flex items-center justify-center text-xl sm:text-2xl shadow-inner cursor-pointer transition-all"
            title="Reset Game"
          >
            {getSmileyFace()}
          </motion.button>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center flex-1 sm:flex-initial">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Timer</span>
          <div className="flex items-center gap-1 sm:gap-2 bg-brand-blue/30 border border-brand-blue/50 rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-slate-700 font-mono text-base sm:text-xl font-bold min-w-[72px] sm:min-w-[90px] justify-center shadow-inner">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            <span>{formatNumber(timer)}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 mt-1 sm:mt-0 flex-wrap w-full sm:w-auto">
        {/* High Score / Best Time Indicator */}
        {bestTime !== null && (
          <div 
            className="flex items-center gap-1 bg-brand-sage/40 border border-brand-sage rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs text-slate-700 font-medium shadow-sm"
            title="Your Fastest Time"
          >
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-500/10 text-yellow-600" />
            <span className="font-mono font-semibold">{bestTime}s</span>
          </div>
        )}

        {/* Click Mode Toggle for Mobile / Tablets */}
        <div className="flex bg-slate-50 rounded-2xl p-0.5 border border-slate-100">
          <button
            id="mode-reveal-button"
            onClick={() => setClickMode('reveal')}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
              clickMode === 'reveal'
                ? 'bg-brand-blue text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Reveal mode: Click reveals cells"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="inline">Reveal</span>
          </button>
          <button
            id="mode-flag-button"
            onClick={() => setClickMode('flag')}
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
              clickMode === 'flag'
                ? 'bg-brand-pink text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Flag mode: Click flags cells"
          >
            <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="inline">Flag</span>
          </button>
        </div>

        {/* Sound Toggle Button */}
        <button
          id="sound-toggle-button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 sm:p-2.5 rounded-2xl border cursor-pointer transition-all ${
            soundEnabled
              ? 'bg-brand-sage/40 border-brand-sage/70 text-slate-700 hover:bg-brand-sage/60'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
          }`}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Quick Reset Label for Desktop */}
        <button
          id="quick-reset-label"
          onClick={onReset}
          className="p-2 sm:p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer hidden md:flex items-center justify-center"
          title="Reset Board"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
