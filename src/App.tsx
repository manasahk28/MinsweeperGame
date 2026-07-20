import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  X, 
  RotateCcw, 
  Flame, 
  Award,
  BookOpen
} from 'lucide-react';
import { Cell, GameStatus, DifficultyLevel, PRESETS, BoardPreset, HighScores } from './types';
import { playSound } from './utils/audio';
import ScoreBoard from './components/ScoreBoard';
import DifficultySelector from './components/DifficultySelector';
import GameBoard from './components/GameBoard';

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [customSettings, setCustomSettings] = useState<BoardPreset>({
    label: 'Custom',
    rows: 10,
    cols: 10,
    mines: 12,
  });

  const getActiveSettings = (): BoardPreset => {
    if (difficulty === 'custom') return customSettings;
    return PRESETS[difficulty];
  };

  const activeSettings = getActiveSettings();

  // Core Game States
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [timer, setTimer] = useState<number>(0);
  const [flagCount, setFlagCount] = useState<number>(0);
  const [clickMode, setClickMode] = useState<'reveal' | 'flag'>('reveal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  
  // UI States
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showDefeatModal, setShowDefeatModal] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // High Scores State
  const [highScores, setHighScores] = useState<HighScores>({
    beginner: null,
    intermediate: null,
    expert: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealTimeoutsRef = useRef<number[]>([]);

  // Load high scores from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('minesweeper_high_scores');
    if (saved) {
      try {
        setHighScores(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading high scores', e);
      }
    }
  }, []);

  const clearRevealTimeouts = () => {
    revealTimeoutsRef.current.forEach(id => window.clearTimeout(id));
    revealTimeoutsRef.current = [];
  };

  // Initialize empty grid on difficulty or setting changes
  useEffect(() => {
    initEmptyGrid();
    return () => {
      stopTimer();
      clearRevealTimeouts();
    };
  }, [difficulty, customSettings]);

  // Handle active game timer
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 999) {
            stopTimer();
            return 999;
          }
          playSound('tick', soundEnabled);
          return prev + 1;
        });
      }, 1000);
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [status, soundEnabled]);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = showRules || showVictoryModal || showDefeatModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showRules, showVictoryModal, showDefeatModal]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Create initial unmined grid
  const initEmptyGrid = () => {
    clearRevealTimeouts();
    const { rows, cols } = activeSettings;
    const newGrid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowArr: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        rowArr.push({
          x: r,
          y: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(rowArr);
    }
    setGrid(newGrid);
    setStatus('idle');
    setTimer(0);
    setFlagCount(0);
    setIsNewRecord(false);
    setShowVictoryModal(false);
    setShowDefeatModal(false);
  };

  // Generate board with mines, guaranteeing start cell and its neighbors are safe
  const generateBoardWithMines = (startX: number, startY: number): Cell[][] => {
    const { rows, cols, mines } = activeSettings;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    // Create a list of safe candidates (all coords except start cell and its 8 adjacent neighbors)
    const candidates: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isStartOrNeighbor = Math.abs(r - startX) <= 1 && Math.abs(c - startY) <= 1;
        if (!isStartOrNeighbor) {
          candidates.push([r, c]);
        }
      }
    }

    // Fallback if the requested mine count is extremely high and doesn't fit
    if (candidates.length < mines) {
      candidates.length = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r !== startX || c !== startY) {
            candidates.push([r, c]);
          }
        }
      }
    }

    // Shuffle candidate coordinates (Fisher-Yates)
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Place mines in the grid
    const minesToPlace = Math.min(mines, candidates.length);
    for (let i = 0; i < minesToPlace; i++) {
      const [r, c] = candidates[i];
      newGrid[r][c].isMine = true;
    }

    // Calculate neighboring mine numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newGrid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
        }
        newGrid[r][c].neighborMines = count;
      }
    }

    return newGrid;
  };

  // Perform bread-first-search flood fill to reveal safe cells
  const revealFloodFill = (targetGrid: Cell[][], startX: number, startY: number): Cell[][] => {
    const rows = targetGrid.length;
    const cols = targetGrid[0].length;
    const updatedGrid = targetGrid.map(row => row.map(cell => ({ ...cell })));

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const cell = updatedGrid[r][c];

      if (cell.isFlagged) continue;
      cell.isRevealed = true;

      // If cell has 0 neighbor mines, propagate reveal to neighbors
      if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const key = `${nr},${nc}`;
              const neighbor = updatedGrid[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine && !visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    return updatedGrid;
  };

  // Core cell click/reveal logic
  const handleReveal = (r: number, c: number) => {
    if (status !== 'idle' && status !== 'playing') return;

    let currentGrid = grid;

    // 1. If it's the very first click of the game, generate mines lazily to keep it safe
    if (status === 'idle') {
      currentGrid = generateBoardWithMines(r, c);
      setStatus('playing');
    }

    const clickedCell = currentGrid[r][c];

    // If cell is already flagged, do nothing
    if (clickedCell.isFlagged) return;

    // 2. If already revealed: implement "chord" reveal (speedrunner mechanic)
    if (clickedCell.isRevealed) {
      handleChordReveal(currentGrid, r, c);
      return;
    }

    // 3. If clicking a mine: Kaboom! Game Over
    if (clickedCell.isMine) {
      triggerDefeat(currentGrid, r, c);
      return;
    }

    // 4. If normal safe cell: flood fill reveal
    const nextGrid = revealFloodFill(currentGrid, r, c);
    playSound('reveal', soundEnabled);
    setGrid(nextGrid);

    // 5. Check if the player won
    checkWinCondition(nextGrid);
  };

  // Chord Reveal: Clicking a revealed number cell to clear remaining empty neighbors if flag counts match
  const handleChordReveal = (currentGrid: Cell[][], r: number, c: number) => {
    const clickedCell = currentGrid[r][c];
    if (clickedCell.neighborMines === 0) return;

    const rows = currentGrid.length;
    const cols = currentGrid[0].length;

    // Count flagged neighbors
    let neighborFlags = 0;
    const neighbors: [number, number][] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          neighbors.push([nr, nc]);
          if (currentGrid[nr][nc].isFlagged) {
            neighborFlags++;
          }
        }
      }
    }

    // If flags match the cell's mine number, reveal all remaining safe unrevealed neighbors
    if (neighborFlags === clickedCell.neighborMines) {
      let nextGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
      let hitMine = false;
      let mineR = -1;
      let mineC = -1;

      for (const [nr, nc] of neighbors) {
        const cell = nextGrid[nr][nc];
        if (!cell.isRevealed && !cell.isFlagged) {
          if (cell.isMine) {
            hitMine = true;
            mineR = nr;
            mineC = nc;
            break;
          } else {
            nextGrid = revealFloodFill(nextGrid, nr, nc);
          }
        }
      }

      if (hitMine) {
        triggerDefeat(nextGrid, mineR, mineC);
      } else {
        playSound('reveal', soundEnabled);
        setGrid(nextGrid);
        checkWinCondition(nextGrid);
      }
    }
  };

  // Flag cell toggle logic
  const handleFlag = (r: number, c: number) => {
    if (status !== 'playing' && status !== 'idle') return;

    const targetCell = grid[r][c];
    if (targetCell.isRevealed) return; // already revealed cells cannot be flagged

    const newGrid = grid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx === r && cIdx === c) {
          const toggledState = !cell.isFlagged;
          playSound(toggledState ? 'flag' : 'unflag', soundEnabled);
          return { ...cell, isFlagged: toggledState };
        }
        return cell;
      })
    );

    // Update flag counts
    const totalFlags = newGrid.flat().filter(cell => cell.isFlagged).length;
    setGrid(newGrid);
    setFlagCount(totalFlags);

    // If idle, start the game on flagging too (standard preference)
    if (status === 'idle') {
      setStatus('playing');
    }
  };

  // Win condition checker: Wins if all safe (non-mine) cells are revealed
  const checkWinCondition = (targetGrid: Cell[][]) => {
    const unrevealedSafeCells = targetGrid.flat().filter(cell => !cell.isMine && !cell.isRevealed);
    
    if (unrevealedSafeCells.length === 0) {
      setStatus('won');
      stopTimer();
      playSound('win', soundEnabled);

      // Automatically flag all remaining mines as a premium convenience feature
      const wonGrid = targetGrid.map(row =>
        row.map(cell => {
          if (cell.isMine) {
            return { ...cell, isFlagged: true };
          }
          return cell;
        })
      );
      setGrid(wonGrid);
      setFlagCount(activeSettings.mines);

      // Check and record high score / fastest time
      if (difficulty !== 'custom') {
        const currentBest = highScores[difficulty];
        if (currentBest === null || timer < currentBest) {
          const updatedScores = {
            ...highScores,
            [difficulty]: timer,
          };
          setHighScores(updatedScores);
          localStorage.setItem('minesweeper_high_scores', JSON.stringify(updatedScores));
          setIsNewRecord(true);
        }
      }

      setShowVictoryModal(true);
    }
  };

  // Handle mine clicking defeat state
  const triggerDefeat = (currentGrid: Cell[][], explodedR: number, explodedC: number) => {
    setStatus('lost');
    stopTimer();
    playSound('lose', soundEnabled);
    clearRevealTimeouts();

    // 1. Instantly reveal the exploded mine
    let tempGrid = currentGrid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx === explodedR && cIdx === explodedC) {
          return { ...cell, isRevealed: true, isExplodedMine: true };
        }
        return cell;
      })
    );
    setGrid(tempGrid);

    // 2. Find all other unrevealed mines
    const otherMines: { r: number; c: number; dist: number }[] = [];
    tempGrid.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell.isMine && !(rIdx === explodedR && cIdx === explodedC)) {
          const dist = Math.sqrt(Math.pow(rIdx - explodedR, 2) + Math.pow(cIdx - explodedC, 2));
          otherMines.push({ r: rIdx, c: cIdx, dist });
        }
      });
    });

    // Sort by distance (rippling outward)
    otherMines.sort((a, b) => a.dist - b.dist);

    const totalAnimationTime = 1000; // total duration of reveal in ms
    const delayBetween = Math.max(15, totalAnimationTime / Math.max(1, otherMines.length));
    const totalTime = otherMines.length * delayBetween;

    // Show defeat modal after a delay, once all mines are sequentially revealed
    const modalTimeout = window.setTimeout(() => {
      setShowDefeatModal(true);
    }, totalTime + 1000);
    revealTimeoutsRef.current.push(modalTimeout);

    // 3. Stagger reveal
    if (otherMines.length > 0) {
      otherMines.forEach((mine, idx) => {
        const timeoutId = window.setTimeout(() => {
          setGrid((prevGrid) => {
            return prevGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                if (rIdx === mine.r && cIdx === mine.c) {
                  return { ...cell, isRevealed: true };
                }
                return cell;
              })
            );
          });
        }, idx * delayBetween);
        revealTimeoutsRef.current.push(timeoutId);
      });
    }
  };

  const handleDifficultyChange = (level: DifficultyLevel, custom?: BoardPreset) => {
    playSound('click', soundEnabled);
    setDifficulty(level);
    if (level === 'custom' && custom) {
      setCustomSettings(custom);
    }
  };

  // Reset/Delete high scores
  const resetHighScores = () => {
    const emptyScores: HighScores = {
      beginner: null,
      intermediate: null,
      expert: null,
    };
    setHighScores(emptyScores);
    localStorage.removeItem('minesweeper_high_scores');
    playSound('unflag', soundEnabled);
  };

  return (
    <div className="bg-brand-bg min-h-screen font-sans text-slate-800 pb-16 flex flex-col">
      
      {/* Top Header / Brand Nav */}
      <header className="w-full max-w-7xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between border-b border-pink-100/50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-pink/50 border border-brand-pink flex items-center justify-center shadow-sm">
            <span className="text-xl">💣</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-slate-800">
              Minesweeper
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">by Caroline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Rules/Help Button */}
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setShowRules(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-pink-100 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-blue" />
            <span className="font-medium">How to Play</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 mt-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Column - Colspan 4 */}
          <div className="lg:col-span-4 space-y-6">
            {/* Difficulty selector widget */}
            <DifficultySelector
              currentDifficulty={difficulty}
              customSettings={customSettings}
              onDifficultyChange={handleDifficultyChange}
            />

            {/* Fastest Times Trophy Board */}
            <section id="trophy-room" className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-pink-100 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Fastest Times</h3>
                </div>
                {(highScores.beginner || highScores.intermediate || highScores.expert) && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your high scores?')) {
                        resetHighScores();
                      }
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer font-medium"
                  >
                    Clear Records
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-brand-sage/20 rounded-2xl p-3 border border-brand-sage/30">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Beginner</p>
                  <p className="font-mono text-base font-extrabold text-slate-700 mt-0.5">
                    {highScores.beginner !== null ? `${highScores.beginner}s` : '—'}
                  </p>
                </div>
                <div className="bg-brand-blue/20 rounded-2xl p-3 border border-brand-blue/30">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Intermed.</p>
                  <p className="font-mono text-base font-extrabold text-slate-700 mt-0.5">
                    {highScores.intermediate !== null ? `${highScores.intermediate}s` : '—'}
                  </p>
                </div>
                <div className="bg-brand-pink/20 rounded-2xl p-3 border border-brand-pink/30">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Expert</p>
                  <p className="font-mono text-base font-extrabold text-slate-700 mt-0.5">
                    {highScores.expert !== null ? `${highScores.expert}s` : '—'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Center Column (Playground Area) - Colspan 8 */}
          <div className="lg:col-span-8 flex flex-col gap-6 items-center w-full">
            {/* Dynamic scoreboard with reset + mode switchers */}
            <ScoreBoard
              status={status}
              minesCount={activeSettings.mines}
              flagCount={flagCount}
              timer={timer}
              isMouseDown={isMouseDown}
              onReset={initEmptyGrid}
              clickMode={clickMode}
              setClickMode={setClickMode}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              bestTime={difficulty !== 'custom' ? highScores[difficulty] : null}
            />

            {/* Minesweeper Interactive Grid Board */}
            <GameBoard
              grid={grid}
              status={status}
              clickMode={clickMode}
              onReveal={handleReveal}
              onFlag={handleFlag}
              setMouseDown={setIsMouseDown}
            />
          </div>

        </div>
      </main>

      {/* Rules / Instruction Drawer modal */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 border border-blue-100 shadow-xl overflow-hidden relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[85vh]"
            >
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setShowRules(false);
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-800">
                  How to Play Minesweeper
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4 text-[11px] sm:text-xs text-slate-600 overflow-y-auto pr-1 flex-1 no-scrollbar">
                <p>
                  The goal of the game is to clear the minefield without detonating any mines.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 sm:space-y-2">
                  <li>
                    <strong className="text-slate-800">Reveal a Cell:</strong> Click (left-click on desktop) on any cell. The first click is always guaranteed to be safe and will open a wider area.
                  </li>
                  <li>
                    <strong className="text-slate-800">Numbers:</strong> A revealed number shows how many mines are adjacent to that specific cell (diagonals included).
                  </li>
                  <li>
                    <strong className="text-slate-800">Flag a Cell:</strong> Right-click on desktop, or select the <strong className="text-pink-600">Flag</strong> mode toggle at the scoreboard, then click on a cell to flag it as a mine.
                  </li>
                  <li>
                    <strong className="text-slate-800">Pro Speedrun Chord-Reveal:</strong> Clicking on a numbered cell that already has the correct number of adjacent flags will instantly reveal all remaining unflagged neighbors. This is extremely satisfying!
                  </li>
                </ul>

                <div className="bg-blue-50 p-2.5 sm:p-3 rounded-xl border border-blue-100 mt-1 sm:mt-2">
                  <h4 className="font-bold text-blue-800 mb-0.5 sm:mb-1">💡 Mobile Tip</h4>
                  <p className="text-blue-700 leading-normal">
                    Use the <strong>Reveal/Flag</strong> toggle in the scoreboard to switch between revealing cells and placing flags with simple taps!
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setShowRules(false);
                  }}
                  className="w-full py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory Congratulatory Popover Modal */}
      <AnimatePresence>
        {showVictoryModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] max-w-[320px] sm:max-w-sm w-full p-4 sm:p-5 text-center border-4 border-emerald-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
            >
              {/* Decorative top ribbon */}
              <div className="absolute top-0 inset-x-0 h-1.5 sm:h-2 bg-gradient-to-r from-[#FCE1E4] via-[#E2F0D9] to-[#CBE4F9]" />

              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setShowVictoryModal(false);
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 pr-0.5 space-y-2.5 sm:space-y-4 flex flex-col items-center justify-start no-scrollbar pt-2">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl sm:text-3xl shrink-0">
                  🏆
                </div>

                <div>
                  <h2 className="font-display font-extrabold text-lg sm:text-2xl text-slate-800 mb-0.5 sm:mb-1">
                    Field Cleared!
                  </h2>
                  <p className="text-[9px] sm:text-xs text-slate-400 font-medium tracking-wider uppercase">
                    Congratulations, Captain!
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2.5 sm:p-4 w-full grid grid-cols-2 gap-2 sm:gap-3 border border-slate-100 shrink-0">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Your Time</p>
                    <p className="font-mono text-lg sm:text-2xl font-bold text-slate-800">{timer}s</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Difficulty</p>
                    <p className="font-sans text-[11px] sm:text-sm font-bold text-slate-700 capitalize mt-0.5 sm:mt-1">
                      {difficulty}
                    </p>
                  </div>
                </div>

                {isNewRecord && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-yellow-600 font-bold bg-yellow-50 border border-yellow-200 rounded-xl py-1 sm:py-2 px-2 sm:px-3 w-full shrink-0"
                  >
                    <Award className="w-3.5 h-3.5 fill-yellow-500/10 text-yellow-500" />
                    <span>New Fastest Record Time! 🎉</span>
                  </motion.div>
                )}

                <div className="flex flex-col gap-1.5 w-full mt-1 sm:mt-2 shrink-0">
                  <button
                    onClick={() => {
                      initEmptyGrid();
                      setShowVictoryModal(false);
                    }}
                    className="w-full py-2 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setShowVictoryModal(false);
                    }}
                    className="w-full py-1.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Keep Reviewing Board
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Defeat Popover Modal */}
      <AnimatePresence>
        {showDefeatModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-hidden">
            <motion.div
              initial={{ scale: 1, opacity: 0, y: "-100vh" }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: "-100vh" }}
              transition={{ type: "spring", stiffness: 90, damping: 14 }}
              className="bg-white rounded-[2rem] max-w-[320px] sm:max-w-sm w-full p-4 sm:p-5 text-center border-4 border-rose-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
            >
              {/* Decorative top ribbon */}
              <div className="absolute top-0 inset-x-0 h-1.5 sm:h-2 bg-gradient-to-r from-brand-pink via-[#FCE1E4] to-brand-pink" />

              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  setShowDefeatModal(false);
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 pr-0.5 space-y-2.5 sm:space-y-4 flex flex-col items-center justify-start no-scrollbar pt-2">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-xl sm:text-3xl shrink-0">
                  💥
                </div>

                <div>
                  <h2 className="font-display font-extrabold text-lg sm:text-2xl text-rose-700 mb-0.5 sm:mb-1">
                    KABOOM!
                  </h2>
                  <p className="text-[9px] sm:text-xs text-slate-400 font-medium tracking-wider uppercase">
                    You hit a mine!
                  </p>
                </div>

                <p className="text-[10px] sm:text-xs text-slate-500 px-1 sm:px-2 leading-relaxed max-w-[260px] mx-auto">
                  Even the best field sweeps make a wrong step. Keep practicing to master the field!
                </p>

                <div className="bg-slate-50 rounded-2xl p-2.5 sm:p-4 w-full grid grid-cols-2 gap-2 sm:gap-3 border border-slate-100 shrink-0">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Time Played</p>
                    <p className="font-mono text-lg sm:text-2xl font-bold text-slate-800">{timer}s</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Difficulty</p>
                    <p className="font-sans text-[11px] sm:text-sm font-bold text-slate-700 capitalize mt-0.5 sm:mt-1">
                      {difficulty}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 w-full mt-1 sm:mt-2 shrink-0">
                  <button
                    onClick={() => {
                      initEmptyGrid();
                      setShowDefeatModal(false);
                    }}
                    className="w-full py-2 sm:py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setShowDefeatModal(false);
                    }}
                    className="w-full py-1.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Keep Reviewing Board
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
