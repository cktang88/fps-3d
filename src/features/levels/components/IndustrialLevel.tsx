import { useState, useEffect } from "react";
import { RigidBody } from "@react-three/rapier";
import { useTexture, useGLTF, Sparkles } from "@react-three/drei";
import { EnemySpawner } from "../../enemies/components/EnemySpawner";
import { Door } from "./interactive/Door";
import { PressurePlate } from "./interactive/PressurePlate";
import { Collectible } from "./collectibles/Collectible";
import { Level } from "../Level";
import { useLevelManager } from "../LevelManager";
import { usePlayerStore } from "../../player/stores/playerStore";

export function IndustrialLevel() {
  const [doorOneOpened, setDoorOneOpened] = useState(false);
  const [doorTwoOpened, setDoorTwoOpened] = useState(false);
  const [exitUnlocked, setExitUnlocked] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  
  // Textures
  const floorTexture = useTexture("/textures/metal_floor.jpg");
  const wallTexture = useTexture("/textures/metal_wall.jpg");
  
  // Level completion
  const completeLevel = useLevelManager((state) => state.completeLevel);
  const setCurrentLevel = useLevelManager((state) => state.setCurrentLevel);
  const unlockLevel = useLevelManager((state) => state.unlockLevel);
  const addItem = usePlayerStore((state) => state.addItem);
  
  // Define spawn points for enemies across the level
  const spawnPoints: [number, number, number][] = [
    [-15, 1, -15],
    [15, 1, -15],
    [15, 1, 15],
    [-15, 1, 15],
    [-25, 1, 0],
    [25, 1, 0],
    [0, 1, 25],
  ];
  
  // Set up level completion conditions
  useEffect(() => {
    if (exitUnlocked && !levelComplete) {
      // Player has reached the exit
      setLevelComplete(true);
      
      // Complete this level
      completeLevel("level1");
      
      // Unlock next level
      unlockLevel("level2");
      
      // Add a reward item to the player
      addItem("keycard_blue");
      
      // After a short delay, load the next level
      setTimeout(() => {
        setCurrentLevel("level2");
      }, 3000);
    }
  }, [exitUnlocked, levelComplete]);
  
  // Pressure plate handlers
  const handlePlateOne = () => {
    setDoorOneOpened(true);
  };
  
  const handlePlateTwo = () => {
    setDoorTwoOpened(true);
  };
  
  // Exit trigger
  const handleExitTrigger = () => {
    setExitUnlocked(true);
  };

  return (
    <Level
      levelId="level1"
      playerStartPosition={[0, 2, 0]}
      environmentPreset="warehouse"
      skyProps={{ sunPosition: [100, 5, 100] }}
      ambientLightIntensity={0.2}
    >
      {/* Main floor */}
      <RigidBody type="fixed" friction={0.7}>
        <mesh
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            map={floorTexture} 
            roughness={0.8} 
            metalness={0.6} 
            map-repeat={[10, 10]} 
          />
        </mesh>
      </RigidBody>

      {/* Outer walls */}
      {/* North wall */}
      <RigidBody type="fixed">
        <mesh position={[0, 5, -40]} receiveShadow castShadow>
          <boxGeometry args={[80, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* South wall */}
      <RigidBody type="fixed">
        <mesh position={[0, 5, 40]} receiveShadow castShadow>
          <boxGeometry args={[80, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* East wall */}
      <RigidBody type="fixed">
        <mesh position={[40, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[80, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* West wall */}
      <RigidBody type="fixed">
        <mesh position={[-40, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[80, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>

      {/* Central structure - Warehouse sections */}
      {/* Section 1 - Entry area */}
      <RigidBody type="fixed">
        <mesh position={[-10, 5, -10]} rotation={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed">
        <mesh position={[-20, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Section 2 - Storage area */}
      <RigidBody type="fixed">
        <mesh position={[10, 5, -10]} rotation={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed">
        <mesh position={[20, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Section 3 - Processing area */}
      <RigidBody type="fixed">
        <mesh position={[-10, 5, 10]} rotation={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Section 4 - Exit area */}
      <RigidBody type="fixed">
        <mesh position={[10, 5, 10]} rotation={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 10, 1]} />
          <meshStandardMaterial map={wallTexture} roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>

      {/* Interactive doors */}
      <Door 
        position={[0, 2, -10]} 
        rotation={[0, 0, 0]}
        initialState={doorOneOpened ? "open" : "closed"}
        autoClose={false}
      />
      
      <Door 
        position={[0, 2, 10]} 
        rotation={[0, 0, 0]}
        initialState={doorTwoOpened ? "open" : "closed"}
        autoClose={false}
      />
      
      {/* Final exit door */}
      <Door 
        position={[10, 2, 20]} 
        rotation={[0, 0, 0]}
        initialState={exitUnlocked ? "open" : "closed"}
        locked={!exitUnlocked}
        autoClose={false}
        color="#0055bb"
      />
      
      {/* Add special effect to exit door */}
      {exitUnlocked && (
        <Sparkles 
          position={[10, 2, 20]} 
          count={50}
          scale={5}
          size={2}
          speed={0.3}
          color="#00aaff"
        />
      )}

      {/* Pressure plates */}
      <PressurePlate 
        position={[-20, 0, -20]} 
        onActivate={handlePlateOne}
        autoReset={false}
        activeColor="#00ff00"
      />
      
      <PressurePlate 
        position={[20, 0, 0]} 
        onActivate={handlePlateTwo}
        autoReset={false}
        activeColor="#00ff00"
      />
      
      {/* Exit trigger */}
      <PressurePlate 
        position={[10, 0, 30]} 
        onActivate={handleExitTrigger}
        size={[6, 0.1, 6]}
        activeColor="#0077ff"
        autoReset={false}
      />

      {/* Collectibles */}
      <Collectible type="health" position={[-15, 1, -5]} amount={25} />
      <Collectible type="armor" position={[15, 1, -5]} amount={25} />
      <Collectible type="ammo" position={[-15, 1, 5]} amount={30} />
      <Collectible type="score" position={[15, 1, 5]} amount={100} />
      <Collectible type="health" position={[30, 1, 30]} amount={50} />
      <Collectible type="ammo" position={[-30, 1, 30]} amount={60} />

      {/* Enemy spawner */}
      <EnemySpawner 
        maxEnemies={10}
        spawnPoints={spawnPoints}
        spawnRate={15}
        difficulty={2}
        active={true}
      />
    </Level>
  );
}
