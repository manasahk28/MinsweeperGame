import React, { useState } from 'react';
import { Settings, Shield, Zap, Sparkles } from 'lucide-react';
import { DifficultyLevel, PRESETS, BoardPreset } from '../types';

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel;
  customSettings: BoardPreset;
  onDifficultyChange: (level: DifficultyLevel, custom?: BoardPreset) => void;
}

export default function DifficultySelector({
  currentDifficulty,
  customSettings,
  onDifficultyChange,
}: DifficultySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRows, setCustomRows] = useState(customSettings.rows);
  const [customCols, setCustomCols] = useState(customSettings.cols);
  const [customMines, setCustomMines] = useState(customSettings.mines);
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (level: Exclude<DifficultyLevel, 'custom'>) => {
    onDifficultyChange(level);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (customRows < 5 || customRows > 30) {
      setError('Rows must be between 5 and 30');
      return;
    }
    if (customCols < 5 || customCols > 40) {
      setError('Columns must be between 5 and 40');
      return;
    }
    const maxMines = Math.floor((customRows * customCols) * 0.75); // max 75% mines
    if (customMines < 1 || customMines > maxMines) {
      setError(`Mines must be between 1 and ${maxMines} (75% of grid)`);
      return;
    }

    setError(null);
    onDifficultyChange('custom', {
      label: 'Custom',
      rows: customRows,
      cols: customCols,
      mines: customMines,
    });
    setIsOpen(false);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-pink-100 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-blue" />
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Select Difficulty</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handlePresetSelect('beginner')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentDifficulty === 'beginner'
                ? 'bg-brand-sage text-slate-700 shadow-sm border border-transparent'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-sage'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Beginner
            </span>
          </button>
          <button
            onClick={() => handlePresetSelect('intermediate')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentDifficulty === 'intermediate'
                ? 'bg-brand-blue text-slate-700 shadow-sm border border-transparent'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-blue'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              Intermediate
            </span>
          </button>
          <button
            onClick={() => handlePresetSelect('expert')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              currentDifficulty === 'expert'
                ? 'bg-brand-pink text-slate-700 shadow-sm border border-transparent'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-pink'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              Expert
            </span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
              currentDifficulty === 'custom' || isOpen
                ? 'bg-purple-100 text-purple-800 border-purple-200 shadow-sm'
                : 'bg-white text-slate-500 border-slate-100 hover:border-purple-300'
            }`}
          >
            Custom...
          </button>
        </div>
      </div>

      {/* Custom Parameters Form */}
      {isOpen && (
        <form onSubmit={handleCustomSubmit} className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Rows (5-30)
              </label>
              <input
                type="number"
                value={customRows}
                onChange={(e) => setCustomRows(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Cols (5-40)
              </label>
              <input
                type="number"
                value={customCols}
                onChange={(e) => setCustomCols(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                Mines
              </label>
              <input
                type="number"
                value={customMines}
                onChange={(e) => setCustomMines(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:border-purple-300"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs text-white bg-purple-500 hover:bg-purple-600 rounded-xl shadow-sm cursor-pointer"
            >
              Apply Custom
            </button>
          </div>
        </form>
      )}

      {/* Preset Details Banner */}
      {!isOpen && (
        <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-3">
          <span>
            Grid Size:{' '}
            <strong className="text-slate-600">
              {currentDifficulty === 'custom'
                ? `${customSettings.rows}x${customSettings.cols}`
                : `${PRESETS[currentDifficulty].rows}x${PRESETS[currentDifficulty].cols}`}
            </strong>
          </span>
          <span>
            Total Mines:{' '}
            <strong className="text-slate-600">
              {currentDifficulty === 'custom'
                ? customSettings.mines
                : PRESETS[currentDifficulty].mines}
            </strong>
          </span>
          {currentDifficulty === 'beginner' && <span className="text-brand-sage font-semibold">★ Recommended warmup</span>}
          {currentDifficulty === 'expert' && <span className="text-brand-pink font-semibold">✦ Ultimate challenge</span>}
        </div>
      )}
    </div>
  );
}
