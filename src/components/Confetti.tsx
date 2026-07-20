import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  scale: number;
}

interface ConfettiProps {
  mode: 'blast' | 'confetti';
  originX?: number; // percentage or viewport px
  originY?: number;
}

const PASTEL_COLORS = [
  '#FCE1E4', // Soft Pink
  '#E2F0D9', // Sage Green
  '#CBE4F9', // Light Blue
  '#FFF2CC', // Pale Yellow
  '#F0E6FF', // Light Lavender
];

const BLAST_COLORS = [
  '#FFB3B3', // Pastel Dark Red/Pink
  '#FFCCB6', // Pastel Orange
  '#FFEBAA', // Pastel Yellow
  '#FCE1E4', // Soft Pink
];

export default function Confetti({ mode, originX = 50, originY = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const isBlast = mode === 'blast';
    const count = isBlast ? 40 : 80;
    const colors = isBlast ? BLAST_COLORS : PASTEL_COLORS;

    const newParticles = Array.from({ length: count }).map((_, i) => {
      // For blast, we want them to fly outward from the origin in a circle
      // For confetti, we want them to fall from the top or burst upward and fall
      const angle = isBlast
        ? Math.random() * Math.PI * 2
        : Math.random() * Math.PI - Math.PI / 2; // Upwards fan

      const velocity = isBlast
        ? 100 + Math.random() * 250
        : 200 + Math.random() * 300;

      const xDist = Math.cos(angle) * velocity;
      const yDist = Math.sin(angle) * velocity;

      return {
        id: i,
        x: xDist,
        y: yDist,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: isBlast ? 6 + Math.random() * 12 : 8 + Math.random() * 14,
        scale: 0.5 + Math.random() * 0.8,
      };
    });

    setParticles(newParticles);
  }, [mode]);

  if (mode === 'blast') {
    return (
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: `${originX}px`,
          top: `${originY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
            animate={{
              x: p.x,
              y: p.y + 150, // add some gravity pull downward
              opacity: 0,
              scale: 0.1,
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    );
  }

  // Confetti celebration mode (screen-wide)
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => {
        // Start from random horizontal positions near top-center or scattered
        const startX = Math.random() * 100; // viewport percentage
        const startY = -10;

        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: `${startX}vw`,
              top: `${startY}vh`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px', // mixed circles and squares
            }}
            initial={{
              y: '-5vh',
              x: 0,
              rotate: 0,
              opacity: 1,
              scale: p.scale,
            }}
            animate={{
              y: '105vh',
              x: [0, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 300], // swaying left-right
              rotate: p.rotation + 720,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              ease: 'linear',
              times: [0, 0.8, 1],
            }}
          />
        );
      })}
    </div>
  );
}
