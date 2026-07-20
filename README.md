# Minesweeper 💣

A minimalist, highly responsive, and modern Minesweeper game built with React, Vite, Tailwind CSS, and Framer Motion. Featuring a delightful pastel color palette, smooth staggered animations, interactive tracking, and full mobile optimization.

![Minesweeper Banner](https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&w=1200&q=80)

## ✨ Features

- **🌸 Pastel Aesthetic**: A custom, soft, eye-friendly pastel design featuring beautiful color-coded indicators for adjacent mines.
- **⚡ Smooth Staggered Animations**: Implements elegant physical motion using `framer-motion` for reveal, flag placement, and game status modals.
- **📐 Multiple Difficulty Modes**:
  - **Easy**: 9x9 Grid (10 Mines)
  - **Medium**: 16x16 Grid (40 Mines)
  - **Hard**: 30x16 Grid (99 Mines)
- **⏱️ Live Tracking Dashboard**:
  - Real-time game clock tracking minutes and seconds.
  - Active mine/flag counter indicating remaining threats.
- **🏆 High-Score & Stats Tracking**: Saves your best times locally per difficulty setting to keep track of your personal records.
- **📱 Responsive & Mobile-Optimized**: Fully optimized for mobile displays with no unwanted horizontal or vertical scrolling, hidden scrollbars, and fluid scaling.
- **🎭 Victory & Defeat Modals**: Immersive, spring-animated modals highlighting win statistics or staggered sequential mine reveals on game over.
- **💡 Rules & Guides**: Built-in instructions drawer summarizing how to play and win.

---

## 🎮 How to Play

The goal of the game is to clear a rectangular board containing hidden "mines" without detonating any of them, using clues about the number of neighboring mines in each field.

### Controls & Actions:
- **Left-Click / Tap**: Reveal a tile.
- **Right-Click / Long Press**: Place a flag to mark a suspected mine.
- **Double-Click / Double-Tap**: (On a revealed number tile) Quick-clears adjacent tiles if you've already flagged the correct number of neighboring mines.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion (`motion/react`)](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

Follow these steps to run the Minesweeper application locally on your machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system (v18 or higher is recommended).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/minesweeper.git
   cd minesweeper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` (or the port specified in your console) to play!

### Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles and optimizes the React application for production.
- `npm run lint`: Validates the codebase using TypeScript compiler flags.

---

## 🎨 Design and Layout Decisions

- **Negative Space & Focus**: Designed to center the game board beautifully, keeping margins completely free of distracting telemetry logs or artificial margin noise.
- **Mobile Fluidity**: Fixed viewport parameters prevent accidental drag-to-scroll gestures on mobile screens, preserving a native app feel.
- **Instant Modals**: The game state transitions (such as victory or defeat) load immediately and responsively with spring physics, giving instantaneous feedback to players.
