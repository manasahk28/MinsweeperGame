import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, Bomb, XCircle } from 'lucide-react';
import { Cell, GameStatus } from '../types';
import Confetti from './Confetti';

interface GameBoardProps {
  grid: Cell[][];
  status: GameStatus;
  clickMode: 'reveal' | 'flag';
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  setMouseDown: (isDown: boolean) => void;
}

export default function GameBoard({
  grid,
  status,
  clickMode,
  onReveal,
  onFlag,
  setMouseDown,
}: GameBoardProps) {
  const [explodedCoords, setExplodedCoords] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Monitor container size dynamically to scale grid cells accordingly
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial size
    setContainerWidth(containerRef.current.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCellMouseDown = (e: React.MouseEvent, cell: Cell) => {
    if (e.button === 0 && status === 'playing' && !cell.isRevealed && !cell.isFlagged) {
      setMouseDown(true);
    }
  };

  const handleCellMouseUp = () => {
    setMouseDown(false);
  };

  const handleCellClick = (cell: Cell, e: React.MouseEvent) => {
    if (status !== 'playing' && status !== 'idle') return;

    if (clickMode === 'flag') {
      onFlag(cell.x, cell.y);
    } else {
      // Normal reveal mode
      if (cell.isFlagged) return; // ignore clicking on flagged cells
      onReveal(cell.x, cell.y);

      // If clicked on a mine, capture coordinates for blast confetti
      if (cell.isMine) {
        // Calculate click position relative to the grid wrapper
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const parentRect = containerRef.current?.getBoundingClientRect();
        if (rect && parentRect) {
          setExplodedCoords({
            x: rect.left - parentRect.left + rect.width / 2,
            y: rect.top - parentRect.top + rect.height / 2,
          });
        }
      }
    }
  };

  const handleCellContextMenu = (e: React.MouseEvent, cell: Cell) => {
    e.preventDefault();
    if (status !== 'playing' && status !== 'idle') return;
    onFlag(cell.x, cell.y);
  };

  // Styles for cell counts
  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-blue-500 font-bold';
      case 2: return 'text-emerald-600 font-bold';
      case 3: return 'text-rose-500 font-bold';
      case 4: return 'text-indigo-600 font-bold';
      case 5: return 'text-amber-700 font-bold';
      case 6: return 'text-cyan-600 font-bold';
      case 7: return 'text-purple-700 font-bold';
      case 8: return 'text-slate-800 font-bold';
      default: return 'text-transparent';
    }
  };

  const rowsCount = grid.length;
  const colsCount = rowsCount > 0 ? grid[0].length : 0;

  // Determine dynamic sizes based on containerWidth and colsCount
  const gapSize = colsCount > 20 || containerWidth < 600 ? 4 : 8; // scale down gap size on small screen or large matrix
  
  // Padding cushion of the card plus some margin
  const paddingOffset = containerWidth < 480 ? 40 : 80;
  const innerWidth = containerWidth - paddingOffset;
  const calculatedCellSize = colsCount > 0 ? Math.floor((innerWidth - (colsCount - 1) * gapSize) / colsCount) : 32;
  
  // Cap cellSize between 20px (min playable/touch size on mobile) and 44px (max size)
  const cellSize = Math.max(20, Math.min(44, calculatedCellSize));

  // Determine responsive classes/sizes for icons inside cells
  const iconSizeClass = cellSize < 24 ? 'w-3 h-3' : cellSize < 30 ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div 
      ref={containerRef}
      className="relative w-full flex flex-col items-center select-none"
    >
      {/* Victory Celebration Screen Confetti */}
      {status === 'won' && <Confetti mode="confetti" />}

      {/* Bomb Blast Animation */}
      {status === 'lost' && explodedCoords && (
        <Confetti mode="blast" originX={explodedCoords.x} originY={explodedCoords.y} />
      )}

      {/* Grid container with responsive horizontal scroll bar for small devices */}
      <div 
        id="minesweeper-grid-scroll-wrapper"
        className="w-full overflow-x-auto pb-4 pt-1 flex justify-center scrollbar-thin scrollbar-thumb-blue-200"
      >
        <div
          id="minesweeper-interactive-grid"
          className="bg-white p-4 sm:p-6 rounded-[2rem] border border-white shadow-xl inline-block"
          style={{
            minWidth: `${colsCount * cellSize + (colsCount - 1) * gapSize + (containerWidth < 480 ? 32 : 48)}px`,
          }}
        >
          <div
            className="grid bg-slate-50/50 p-2 sm:p-3 rounded-2xl"
            style={{
              gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
              gap: `${gapSize}px`,
            }}
          >
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const cellId = `cell-${cell.x}-${cell.y}`;
                
                // Determine styling classes
                let cellClass = '';
                let content: React.ReactNode = null;

                if (cell.isRevealed) {
                  if (cell.isMine) {
                    if (cell.isExplodedMine) {
                      cellClass = 'bg-rose-500 border-rose-600 text-white shadow-inner scale-95';
                      content = (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                        >
                          <Bomb className={`${iconSizeClass} text-white fill-white/20 animate-pulse`} />
                        </motion.div>
                      );
                    } else {
                      cellClass = 'bg-rose-100 border-rose-200 text-rose-600 shadow-inner';
                      content = (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        >
                          <Bomb className={`${iconSizeClass} text-rose-600 fill-rose-500/10`} />
                        </motion.div>
                      );
                    }
                  } else {
                    cellClass = 'bg-brand-blue/30 border-brand-blue/10 shadow-inner flex items-center justify-center font-sans font-extrabold';
                    if (cell.neighborMines > 0) {
                      content = <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>;
                    }
                  }
                } else {
                  // Unrevealed state
                  if (status === 'lost' && cell.isFlagged && !cell.isMine) {
                    // Incorrect flag shown at end of game
                    cellClass = 'bg-rose-50 border-rose-200 cursor-not-allowed';
                    content = (
                      <div className="relative flex items-center justify-center">
                        <Flag className={`${iconSizeClass} text-rose-300 fill-rose-100`} />
                        <XCircle className={`${cellSize < 24 ? 'w-2.5 h-2.5 -top-0.5 -right-0.5' : 'w-4 h-4 absolute -top-1 -right-1'} text-rose-500 absolute`} />
                      </div>
                    );
                  } else if (cell.isFlagged) {
                    // Correct / Standard flag (Soft Pink pastel)
                    cellClass = 'bg-brand-pink hover:bg-brand-pink/80 border-transparent text-white cursor-pointer shadow-sm';
                    content = (
                      <motion.div
                        initial={{ scale: 0.3, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <Flag className={`${iconSizeClass} fill-white/20 text-slate-700 font-bold`} />
                      </motion.div>
                    );
                  } else {
                    // Standard unopened tile (Sage green pastel)
                    cellClass = 'bg-brand-sage hover:bg-brand-sage/80 border-transparent text-slate-700 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm';
                  }
                }

                return (
                  <button
                    key={cellId}
                    id={cellId}
                    onClick={(e) => handleCellClick(cell, e)}
                    onContextMenu={(e) => handleCellContextMenu(e, cell)}
                    onMouseDown={(e) => handleCellMouseDown(e, cell)}
                    onMouseUp={handleCellMouseUp}
                    onMouseLeave={handleCellMouseUp}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      fontSize: cellSize < 24 ? '10px' : cellSize < 32 ? '12px' : '14px',
                    }}
                    className={`flex items-center justify-center rounded-xl border font-bold focus:outline-none transition-all duration-150 ${cellClass}`}
                    disabled={(cell.isRevealed && status === 'playing') || (status !== 'playing' && status !== 'idle')}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
