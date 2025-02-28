import { create } from "zustand";
import { ECS } from "../features/core/ecs/ecs";
import { GameLoop } from "../features/core/loop/gameLoop";
import { InputManager } from "../features/core/input/inputManager";

// Define the game state
export interface GameState {
  // Game instance properties
  gameInitialized: boolean;
  gameRunning: boolean;
  gamePaused: boolean;

  // Core systems
  ecs: ECS | null;
  gameLoop: GameLoop | null;
  inputManager: InputManager | null;

  // Game state properties
  currentLevel: string;
  score: number;

  // UI state
  showHUD: boolean;
  showMenu: boolean;
  showDebug: boolean;

  // Actions
  initialize: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  changeLevel: (level: string) => void;
  toggleHUD: () => void;
  toggleMenu: () => void;
  toggleDebug: () => void;
  addScore: (points: number) => void;
}

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Game instance properties
  gameInitialized: false,
  gameRunning: false,
  gamePaused: false,

  // Core systems
  ecs: null,
  gameLoop: null,
  inputManager: null,

  // Game state properties
  currentLevel: "none",
  score: 0,

  // UI state
  showHUD: true,
  showMenu: false,
  showDebug: false,

  // Actions
  initialize: () => {
    // Only initialize once
    if (get().gameInitialized) return;

    // Create core systems
    const ecs = new ECS();
    const gameLoop = new GameLoop({ frameRate: 60 });
    const inputManager = new InputManager();

    // Connect ECS to game loop
    gameLoop.subscribe((delta, elapsedTime) => {
      ecs.update(delta, elapsedTime);
    });

    // Initialize ECS
    ecs.init();

    set({
      ecs,
      gameLoop,
      inputManager,
      gameInitialized: true,
    });
  },

  startGame: () => {
    const { gameLoop, gameInitialized, gameRunning } = get();

    // Only start if initialized and not already running
    if (!gameInitialized || gameRunning) return;

    // Start the game loop
    gameLoop?.start();

    set({
      gameRunning: true,
      gamePaused: false,
      showMenu: false,
    });
  },

  pauseGame: () => {
    const { gameRunning, gamePaused } = get();

    // Only pause if running and not already paused
    if (!gameRunning || gamePaused) return;

    set({
      gamePaused: true,
      showMenu: true,
    });
  },

  resumeGame: () => {
    const { gameRunning, gamePaused } = get();

    // Only resume if running and paused
    if (!gameRunning || !gamePaused) return;

    set({
      gamePaused: false,
      showMenu: false,
    });
  },

  stopGame: () => {
    const { gameLoop, gameRunning } = get();

    // Only stop if running
    if (!gameRunning) return;

    // Stop the game loop
    gameLoop?.stop();

    set({
      gameRunning: false,
      gamePaused: false,
      showMenu: true,
    });
  },

  changeLevel: (level: string) => {
    // Set the current level
    set({ currentLevel: level });
  },

  toggleHUD: () => {
    set((state) => ({ showHUD: !state.showHUD }));
  },

  toggleMenu: () => {
    set((state) => ({ showMenu: !state.showMenu }));
  },

  toggleDebug: () => {
    set((state) => ({ showDebug: !state.showDebug }));
  },

  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },
}));
