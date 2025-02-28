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
  
  // Game completion state
  levelCompleted: boolean;
  gameOver: boolean;
  didWin: boolean;

  // UI state
  showHUD: boolean;
  showMenu: boolean;
  showDebug: boolean;
  showLoadingScreen: boolean;
  showGameOver: boolean;
  showLevelSelect: boolean;
  showObjectives: boolean;
  showMinimap: boolean;
  
  // Settings
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  showDamageNumbers: boolean;
  showCrosshair: boolean;

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
  
  // New actions
  completeLevel: (didWin: boolean) => void;
  setGameOver: (isOver: boolean, didWin: boolean) => void;
  restartLevel: () => void;
  setLoadingScreen: (isLoading: boolean) => void;
  toggleLevelSelect: () => void;
  toggleObjectives: () => void;
  toggleMinimap: () => void;
  
  // Settings actions
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMouseSensitivity: (sensitivity: number) => void;
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high') => void;
  toggleDamageNumbers: () => void;
  toggleCrosshair: () => void;
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
  
  // Game completion state
  levelCompleted: false,
  gameOver: false,
  didWin: false,

  // UI state
  showHUD: true,
  showMenu: false,
  showDebug: false,
  showLoadingScreen: false,
  showGameOver: false,
  showLevelSelect: false,
  showObjectives: true,
  showMinimap: true,
  
  // Settings
  musicVolume: 80,
  sfxVolume: 100,
  mouseSensitivity: 5,
  graphicsQuality: 'medium',
  showDamageNumbers: true,
  showCrosshair: true,

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
      showGameOver: false,
      levelCompleted: false,
      gameOver: false,
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

  // New actions
  completeLevel: (didWin) => {
    set({
      levelCompleted: true,
      didWin,
      gameRunning: false,
      showGameOver: true,
    });
  },
  
  setGameOver: (isOver, didWin) => {
    set({
      gameOver: isOver,
      didWin,
      showGameOver: isOver,
      gameRunning: !isOver,
    });
  },
  
  restartLevel: () => {
    const { currentLevel } = get();
    
    set({
      gameOver: false,
      showGameOver: false,
      levelCompleted: false,
    });
    
    // Re-initialize the current level
    get().changeLevel(currentLevel);
    get().startGame();
  },
  
  setLoadingScreen: (isLoading) => {
    set({ showLoadingScreen: isLoading });
  },
  
  toggleLevelSelect: () => {
    set((state) => ({ showLevelSelect: !state.showLevelSelect }));
  },
  
  toggleObjectives: () => {
    set((state) => ({ showObjectives: !state.showObjectives }));
  },
  
  toggleMinimap: () => {
    set((state) => ({ showMinimap: !state.showMinimap }));
  },
  
  // Settings actions
  setMusicVolume: (volume) => {
    set({ musicVolume: Math.max(0, Math.min(100, volume)) });
  },
  
  setSfxVolume: (volume) => {
    set({ sfxVolume: Math.max(0, Math.min(100, volume)) });
  },
  
  setMouseSensitivity: (sensitivity) => {
    set({ mouseSensitivity: Math.max(1, Math.min(10, sensitivity)) });
  },
  
  setGraphicsQuality: (quality) => {
    set({ graphicsQuality: quality });
  },
  
  toggleDamageNumbers: () => {
    set((state) => ({ showDamageNumbers: !state.showDamageNumbers }));
  },
  
  toggleCrosshair: () => {
    set((state) => ({ showCrosshair: !state.showCrosshair }));
  },
}));
