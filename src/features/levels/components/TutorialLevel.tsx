import { useRef, useState } from "react";
import { RigidBody } from "@react-three/rapier";
import { Text3D, useTexture } from "@react-three/drei";
import { EnemySpawner } from "../../enemies/components/EnemySpawner";
import { Door } from "./interactive/Door";
import { PressurePlate } from "./interactive/PressurePlate";
import { Collectible } from "./collectibles/Collectible";
import { Level } from "../Level";

export function TutorialLevel() {
  const [doorOpened, setDoorOpened] = useState(false);
  const floorTexture = useTexture("/textures/floor_grid.jpg");
  const wallTexture = useTexture("/textures/wall_concrete.jpg");
  
  // Define spawn points for enemies
  const spawnPoints: [number, number, number][] = [
    [10, 1, -5],
    [15, 1, 5],
    [20, 1, 0],
  ];
  
  // Handle door open
  const handleDoorOpen = () => {
    setDoorOpened(true);
  };

  return (
    <Level
      levelId="tutorial"
      playerStartPosition={[0, 2, 0]}
      environmentPreset="sunset"
      skyProps={{ sunPosition: [100, 10, 100] }}
    >
      {/* Floor */}
      <RigidBody type="fixed" friction={0.7}>
        <mesh
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial map={floorTexture} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Welcome text */}
      <mesh position={[0, 3, -8]} rotation={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={1}
          height={0.2}
          curveSegments={12}
        >
          Training Ground
          <meshStandardMaterial color="#ff0000" />
        </Text3D>
      </mesh>

      {/* Tutorial Section 1 - Movement */}
      <RigidBody type="fixed">
        <mesh position={[-5, 1, -10]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <mesh position={[-5, 2, -8]} rotation={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Movement: WASD + Space to Jump
          <meshStandardMaterial color="#ffffff" />
        </Text3D>
      </mesh>

      {/* Tutorial Section 2 - Shooting */}
      <RigidBody type="fixed">
        <mesh position={[10, 1, -10]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <mesh position={[10, 2, -8]} rotation={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Shooting: Left Mouse to Fire
          <meshStandardMaterial color="#ffffff" />
        </Text3D>
      </mesh>

      {/* Tutorial Section 3 - Collectibles */}
      <RigidBody type="fixed">
        <mesh position={[-15, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[20, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <mesh position={[-12, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Collectibles
          <meshStandardMaterial color="#ffffff" />
        </Text3D>
      </mesh>
      
      {/* Collectible items */}
      <Collectible type="health" position={[-10, 1, -5]} amount={25} />
      <Collectible type="armor" position={[-10, 1, 0]} amount={25} />
      <Collectible type="ammo" position={[-10, 1, 5]} amount={30} />

      {/* Tutorial Section 4 - Interactive Elements */}
      <RigidBody type="fixed">
        <mesh position={[0, 1, 15]} receiveShadow castShadow>
          <boxGeometry args={[30, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed">
        <mesh position={[-15, 1, 7.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed">
        <mesh position={[15, 1, 7.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <mesh position={[0, 2, 12]} rotation={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Interactive Elements
          <meshStandardMaterial color="#ffffff" />
        </Text3D>
      </mesh>
      
      {/* Pressure plate and door */}
      <PressurePlate 
        position={[0, 0, 10]} 
        size={[3, 0.1, 3]}
        onActivate={handleDoorOpen}
      />
      
      <mesh position={[0, 1, 10]} rotation={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.3}
          height={0.05}
          curveSegments={12}
        >
          Step here to open door
          <meshStandardMaterial color="#ffff00" />
        </Text3D>
      </mesh>
      
      <Door 
        position={[0, 2, 5]} 
        rotation={[0, 0, 0]}
        initialState={doorOpened ? "open" : "closed"}
      />

      {/* Tutorial Section 5 - Combat */}
      <RigidBody type="fixed">
        <mesh position={[25, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[30, 2, 0.5]} />
          <meshStandardMaterial map={wallTexture} roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <mesh position={[22, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          Combat Practice
          <meshStandardMaterial color="#ff0000" />
        </Text3D>
      </mesh>
      
      {/* Enemy spawner */}
      <EnemySpawner 
        maxEnemies={3}
        spawnPoints={spawnPoints}
        spawnRate={10}
        difficulty={1}
        active={true}
      />
    </Level>
  );
}
