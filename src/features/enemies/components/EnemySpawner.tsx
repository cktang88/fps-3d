import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group } from "three";
import { Enemy, EnemyType } from "./Enemy";
import { useEnemyStore } from "../stores/enemyStore";
import { EnemyProjectile } from "./EnemyProjectile";

// Types for spawn points
export interface SpawnPoint {
  position: [number, number, number];
  active: boolean;
  lastSpawnTime: number;
  cooldown: number;
}

export interface EnemySpawnerProps {
  maxEnemies?: number;
  spawnRadius?: number; 
  spawnPoints?: [number, number, number][];
  spawnRate?: number; // Enemies per minute
  waveMode?: boolean; 
  difficulty?: number; // 1-10 scale
  active?: boolean;
}

export function EnemySpawner({
  maxEnemies = 10,
  spawnRadius = 20,
  spawnPoints = [],
  spawnRate = 10,
  waveMode = false,
  difficulty = 3,
  active = true,
}: EnemySpawnerProps) {
  // Track enemies
  const { enemies, addEnemy, removeEnemy } = useEnemyStore();
  
  // Track spawn points
  const [spawns, setSpawns] = useState<SpawnPoint[]>([]);
  
  // Wave management
  const [currentWave, setCurrentWave] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [waveTimer, setWaveTimer] = useState(0);
  const [waveEnemiesRemaining, setWaveEnemiesRemaining] = useState(0);
  
  // Player position tracking for spawn logic
  const playerPosition = useRef(new Vector3());
  
  // Helper to generate a random position within spawn radius
  const getRandomSpawnPosition = (): [number, number, number] => {
    if (spawns.length > 0) {
      // Filter available spawn points
      const availableSpawns = spawns.filter(
        (spawn) => spawn.active && Date.now() - spawn.lastSpawnTime > spawn.cooldown
      );
      
      if (availableSpawns.length > 0) {
        // Choose a random spawn point
        const randomIndex = Math.floor(Math.random() * availableSpawns.length);
        const chosenSpawn = availableSpawns[randomIndex];
        
        // Update spawn time
        setSpawns(
          spawns.map((spawn, i) => 
            spawn.position === chosenSpawn.position
              ? { ...spawn, lastSpawnTime: Date.now() }
              : spawn
          )
        );
        
        return chosenSpawn.position;
      }
    }
    
    // Fallback to random position if no spawn points available
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * spawnRadius;
    const x = Math.cos(angle) * distance + playerPosition.current.x;
    const z = Math.sin(angle) * distance + playerPosition.current.z;
    
    return [x, 1, z];
  };
  
  // Initialize spawn points
  useEffect(() => {
    if (spawnPoints.length > 0) {
      setSpawns(
        spawnPoints.map((position) => ({
          position,
          active: true,
          lastSpawnTime: 0,
          cooldown: 5000, // 5 seconds cooldown between spawns at the same point
        }))
      );
    }
  }, [spawnPoints]);
  
  // Get random enemy type based on difficulty
  const getRandomEnemyType = (): EnemyType => {
    const random = Math.random() * 100;
    
    if (difficulty >= 7) {
      if (random < 10) return "commander";
      if (random < 40) return "soldier";
      return "grunt";
    } else if (difficulty >= 4) {
      if (random < 5) return "commander";
      if (random < 30) return "soldier";
      return "grunt";
    } else {
      if (random < 20) return "soldier";
      return "grunt";
    }
  };
  
  // Handle enemy death
  const handleEnemyDeath = (id: string, position: [number, number, number]) => {
    removeEnemy(id);
    
    if (waveMode && waveActive) {
      setWaveEnemiesRemaining((prev) => prev - 1);
      
      // Check if wave is complete
      if (waveEnemiesRemaining <= 1) {
        setWaveActive(false);
        setCurrentWave((prev) => prev + 1);
        setWaveTimer(10); // 10 seconds until next wave
      }
    }
  };
  
  // Wave system
  useEffect(() => {
    if (waveMode) {
      let interval: number;
      
      if (!waveActive && active) {
        // Countdown to next wave
        interval = window.setInterval(() => {
          setWaveTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              startWave();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [waveActive, waveMode, active, currentWave]);
  
  // Start a new wave
  const startWave = () => {
    const enemiesInWave = Math.min(maxEnemies, 5 + currentWave * 2);
    setWaveEnemiesRemaining(enemiesInWave);
    setWaveActive(true);
    
    // Spawn initial enemies for the wave
    const initialSpawn = Math.ceil(enemiesInWave / 2);
    for (let i = 0; i < initialSpawn; i++) {
      spawnEnemy();
    }
  };
  
  // Spawn a single enemy
  const spawnEnemy = () => {
    if (enemies.length >= maxEnemies) return;
    
    const type = getRandomEnemyType();
    const position = getRandomSpawnPosition();
    const id = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    addEnemy({ id, type, position });
  };
  
  // Update logic
  useFrame(({ camera }) => {
    if (!active) return;
    
    // Track player position for spawn logic
    playerPosition.current.setFromMatrixPosition(camera.matrixWorld);
    
    // Regular spawn logic (non-wave mode)
    if (!waveMode) {
      // Calculate spawn chance based on spawn rate
      const spawnChance = spawnRate / (60 * 60); // per frame at 60fps
      
      if (Math.random() < spawnChance && enemies.length < maxEnemies) {
        spawnEnemy();
      }
    } else if (waveActive) {
      // Wave mode spawn logic
      const remainingToSpawn = waveEnemiesRemaining - enemies.length;
      
      if (remainingToSpawn > 0) {
        // Gradual spawn during wave
        const spawnChance = 0.01; // Adjust based on desired spawn rate
        if (Math.random() < spawnChance && enemies.length < maxEnemies) {
          spawnEnemy();
        }
      }
    }
  });
  
  return (
    <group>
      {/* Render all active enemies */}
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          type={enemy.type}
          position={enemy.position}
          onDeath={(position) => handleEnemyDeath(enemy.id, position)}
        />
      ))}
      
      {/* Debug visualization of spawn points (only in development) */}
      {process.env.NODE_ENV === "development" && spawns.map((spawn, i) => (
        <mesh key={`spawn-${i}`} position={spawn.position}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={spawn.active ? "#00ff00" : "#ff0000"} wireframe />
        </mesh>
      ))}
    </group>
  );
}
