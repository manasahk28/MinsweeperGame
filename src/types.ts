export interface Cell {
  x: number; // row index
  y: number; // col index
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  isExplodedMine?: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert' | 'custom';

export interface BoardPreset {
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const PRESETS: Record<Exclude<DifficultyLevel, 'custom'>, BoardPreset> = {
  beginner: {
    label: 'Beginner',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  intermediate: {
    label: 'Intermediate',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: {
    label: 'Expert',
    rows: 16,
    cols: 30,
    mines: 99,
  },
};

export interface HighScores {
  beginner: number | null;
  intermediate: number | null;
  expert: number | null;
}
