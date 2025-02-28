import { ReactNode, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Sky, Environment } from "@react-three/drei";
import { usePlayerStore } from "../player/stores/playerStore";
import { useLevelManager } from "./LevelManager";

export interface LevelProps {
  levelId: string;
  children?: ReactNode;
  onLevelComplete?: () => void;
  playerStartPosition?: [number, number, number];
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  skyProps?: {
    sunPosition: [number, number, number];
    inclination?: number;
    azimuth?: number;
    distance?: number;
  };
  ambientLightIntensity?: number;
  directionalLightProps?: {
    position: [number, number, number];
    intensity: number;
    castShadow?: boolean;
    shadowMapSize?: number;
  };
}

export function Level({
  levelId,
  children,
  onLevelComplete,
  playerStartPosition = [0, 2, 0],
  environmentPreset = "forest",
  skyProps = { sunPosition: [100, 20, 100] },
  ambientLightIntensity = 0.3,
  directionalLightProps = {
    position: [10, 10, 5],
    intensity: 1,
    castShadow: true,
    shadowMapSize: 2048,
  },
}: LevelProps) {
  const [initialized, setInitialized] = useState(false);
  const { scene } = useThree();
  const levelData = useLevelManager((state) => state.levels[levelId]);
  const setCurrentLevel = useLevelManager((state) => state.setCurrentLevel);
  const completeLevel = useLevelManager((state) => state.completeLevel);
  
  // Reset player position when level loads
  const resetPlayerPosition = usePlayerStore((state) => state.resetPlayerPosition);
  
  useEffect(() => {
    if (!initialized) {
      console.log(`Loading level: ${levelId}`);
      
      // Set the current level in the level manager
      setCurrentLevel(levelId);
      
      // Reset player position to the level start
      if (resetPlayerPosition) {
        resetPlayerPosition(playerStartPosition);
      }
      
      // Clear any previous level elements from the scene if needed
      // This would depend on how you're managing scene objects
      
      setInitialized(true);
    }
    
    // Cleanup function when component unmounts
    return () => {
      console.log(`Unloading level: ${levelId}`);
      // Perform any necessary cleanup
    };
  }, [levelId, initialized, setCurrentLevel, resetPlayerPosition, playerStartPosition]);

  // Function to trigger level completion
  const handleLevelComplete = () => {
    completeLevel(levelId);
    if (onLevelComplete) {
      onLevelComplete();
    }
  };

  return (
    <>
      {/* Environment lighting */}
      <ambientLight intensity={ambientLightIntensity} />
      <directionalLight
        position={directionalLightProps.position}
        intensity={directionalLightProps.intensity}
        castShadow={directionalLightProps.castShadow}
        shadow-mapSize={directionalLightProps.shadowMapSize}
      />
      <Sky {...skyProps} />
      <Environment preset={environmentPreset} />
      
      {/* Level content */}
      {children}
    </>
  );
}
