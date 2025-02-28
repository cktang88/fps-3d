import { useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { usePlayerStore } from "../../../player/stores/playerStore";
import { Text } from "@react-three/drei";
import { Vector3 } from "three";
import { Howl } from "howler";

// Collectible types
export type CollectibleType = "health" | "armor" | "ammo" | "score";

// Sound effects
const pickupSound = new Howl({
  src: ["/sounds/pickup.mp3"],
  volume: 0.5,
});

interface CollectibleProps {
  type: CollectibleType;
  position: [number, number, number];
  amount: number;
  respawnTime?: number; // Time in seconds before respawning
  rotationSpeed?: number;
  bounceHeight?: number;
  bounceSpeed?: number;
  scale?: number;
  color?: string;
}

export function Collectible({
  type,
  position,
  amount,
  respawnTime = 30,
  rotationSpeed = 1,
  bounceHeight = 0.2,
  bounceSpeed = 1.5,
  scale = 0.5,
  color,
}: CollectibleProps) {
  const [collected, setCollected] = useState(false);
  const collectibleRef = useRef<THREE.Mesh>(null);
  const startY = position[1]; // Original Y position
  const playerPosition = usePlayerStore((state) => state.position);
  
  // Determine color based on type if not provided
  const getColor = () => {
    if (color) return color;
    
    switch (type) {
      case "health":
        return "#ff4444";
      case "armor":
        return "#4444ff";
      case "ammo":
        return "#ffff44";
      case "score":
        return "#44ff44";
      default:
        return "#ffffff";
    }
  };

  // Animation
  useFrame((state, delta) => {
    if (collectibleRef.current && !collected) {
      // Rotation
      collectibleRef.current.rotation.y += delta * rotationSpeed;
      
      // Bouncing motion
      collectibleRef.current.position.y =
        startY + Math.sin(state.clock.elapsedTime * bounceSpeed) * bounceHeight;
    }
  });

  // Respawn timer
  useEffect(() => {
    let respawnTimer: NodeJS.Timeout;
    
    if (collected && respawnTime > 0) {
      respawnTimer = setTimeout(() => {
        setCollected(false);
      }, respawnTime * 1000);
    }
    
    return () => {
      if (respawnTimer) {
        clearTimeout(respawnTimer);
      }
    };
  }, [collected, respawnTime]);
  
  // Apply the collectible effect
  const applyCollectible = () => {
    const heal = usePlayerStore.getState().heal;
    const setArmor = usePlayerStore.getState().setArmor;
    const setAmmo = usePlayerStore.getState().setAmmo;
    const incrementScore = usePlayerStore.getState().incrementScore;
    const currentHealth = usePlayerStore.getState().health;
    const currentArmor = usePlayerStore.getState().armor;
    const currentAmmo = usePlayerStore.getState().ammo;
    
    switch (type) {
      case "health":
        if (currentHealth < usePlayerStore.getState().maxHealth) {
          heal(amount);
          return true;
        }
        return false;
      
      case "armor":
        if (currentArmor < usePlayerStore.getState().maxArmor) {
          setArmor(Math.min(currentArmor + amount, usePlayerStore.getState().maxArmor));
          return true;
        }
        return false;
      
      case "ammo":
        if (currentAmmo < usePlayerStore.getState().maxAmmo) {
          setAmmo(Math.min(currentAmmo + amount, usePlayerStore.getState().maxAmmo));
          return true;
        }
        return false;
      
      case "score":
        incrementScore(amount);
        return true;
      
      default:
        return false;
    }
  };
  
  // Handle collection
  const handleCollect = () => {
    if (!collected) {
      const collected = applyCollectible();
      
      if (collected) {
        setCollected(true);
        pickupSound.play();
      }
    }
  };

  // Check if player is close enough to collect
  useEffect(() => {
    if (!collected) {
      const playerVec = new Vector3(...playerPosition);
      const itemVec = new Vector3(...position);
      const distance = playerVec.distanceTo(itemVec);
      
      // If player is very close, collect the item
      if (distance < 2) {
        handleCollect();
      }
    }
  }, [playerPosition, collected]);

  if (collected) return null;

  return (
    <RigidBody type="fixed" colliders={false} sensor>
      <CuboidCollider args={[scale, scale, scale]} position={position} onIntersectionEnter={handleCollect} />
      
      <mesh ref={collectibleRef} position={position} scale={scale}>
        {type === "health" && (
          <boxGeometry args={[1, 1, 1]} />
        )}
        
        {type === "armor" && (
          <icosahedronGeometry args={[1, 1]} />
        )}
        
        {type === "ammo" && (
          <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        )}
        
        {type === "score" && (
          <dodecahedronGeometry args={[1, 0]} />
        )}
        
        <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.5} />
      </mesh>
      
      <Text
        position={[position[0], position[1] + 1, position[2]]}
        fontSize={0.5}
        color={getColor()}
        anchorX="center"
        anchorY="middle"
      >
        {type === "health" && "+Health"}
        {type === "armor" && "+Armor"}
        {type === "ammo" && "+Ammo"}
        {type === "score" && "+Score"}
      </Text>
    </RigidBody>
  );
}
