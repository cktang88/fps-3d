import { create } from "zustand";
import { useGameStore } from "../../stores/gameStore";

// Define level metadata
export interface LevelData {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  nextLevelId?: string;
  completed: boolean;
}

// Level Manager store
interface LevelManagerState {
  levels: Record<string, LevelData>;
  currentLevelId: string | null;
  levelsUnlocked: string[];
  isLoading: boolean;
  
  // Actions
  setCurrentLevel: (levelId: string) => void;
  unlockLevel: (levelId: string) => void;
  completeLevel: (levelId: string) => void;
  resetProgress: () => void;
}

// Initialize with predefined levels
const initialLevels: Record<string, LevelData> = {
  "tutorial": {
    id: "tutorial",
    name: "Training Ground",
    description: "Learn the basics of movement and combat in this tutorial area.",
    difficulty: 1,
    nextLevelId: "level1",
    completed: false
  },
  "level1": {
    id: "level1",
    name: "Industrial Complex",
    description: "Navigate through an abandoned industrial complex filled with enemies.",
    difficulty: 2,
    nextLevelId: "level2",
    completed: false
  },
  "level2": {
    id: "level2",
    name: "Underground Facility",
    description: "Descend into the darkness of an underground research facility.",
    difficulty: 3,
    nextLevelId: "level3",
    completed: false
  },
  "level3": {
    id: "level3",
    name: "Final Showdown",
    description: "Face the final challenge in this high-security area.",
    difficulty: 4,
    completed: false
  }
};

// Create the level manager store
export const useLevelManager = create<LevelManagerState>((set, get) => ({
  levels: { ...initialLevels },
  currentLevelId: null,
  levelsUnlocked: ["tutorial"], // Only tutorial is unlocked initially
  isLoading: false,
  
  setCurrentLevel: (levelId: string) => {
    const { changeLevel } = useGameStore.getState();
    
    // Set loading state
    set({ isLoading: true });
    
    // Small delay to show loading screen if needed
    setTimeout(() => {
      // Update both level manager and game store
      set({ currentLevelId: levelId, isLoading: false });
      changeLevel(levelId);
    }, 500);
  },
  
  unlockLevel: (levelId: string) => {
    set((state) => {
      if (state.levelsUnlocked.includes(levelId)) {
        return state; // Already unlocked
      }
      
      return {
        levelsUnlocked: [...state.levelsUnlocked, levelId]
      };
    });
  },
  
  completeLevel: (levelId: string) => {
    set((state) => {
      // Mark this level as completed
      const updatedLevels = { ...state.levels };
      if (updatedLevels[levelId]) {
        updatedLevels[levelId] = {
          ...updatedLevels[levelId],
          completed: true
        };
        
        // Unlock next level if exists
        const nextLevelId = updatedLevels[levelId].nextLevelId;
        if (nextLevelId && !state.levelsUnlocked.includes(nextLevelId)) {
          return {
            levels: updatedLevels,
            levelsUnlocked: [...state.levelsUnlocked, nextLevelId]
          };
        }
        
        return { levels: updatedLevels };
      }
      return state;
    });
  },
  
  resetProgress: () => {
    set({
      levels: { ...initialLevels }, // Reset completion status
      levelsUnlocked: ["tutorial"], // Only tutorial is unlocked initially
      currentLevelId: null
    });
  }
}));
