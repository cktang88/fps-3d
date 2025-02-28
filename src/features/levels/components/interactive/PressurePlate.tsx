import { useState, useRef, useEffect } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Howl } from "howler";
import { usePlayerStore } from "../../../player/stores/playerStore";
import { Vector3 } from "three";

// Sound effects
const plateActivateSound = new Howl({
  src: ["/sounds/plate_activate.mp3"],
  volume: 0.5,
});

const plateDeactivateSound = new Howl({
  src: ["/sounds/plate_deactivate.mp3"],
  volume: 0.5,
});

interface PressurePlateProps {
  position: [number, number, number];
  size?: [number, number, number];
  activationDistance?: number;
  color?: string;
  activeColor?: string;
  autoReset?: boolean;
  resetDelay?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  requiresPlayer?: boolean;
}

export function PressurePlate({
  position,
  size = [2, 0.1, 2],
  activationDistance = 1,
  color = "#888888",
  activeColor = "#44ff44",
  autoReset = true,
  resetDelay = 3,
  onActivate,
  onDeactivate,
  requiresPlayer = true,
}: PressurePlateProps) {
  const [isActive, setIsActive] = useState(false);
  const [wasPlayerActivated, setWasPlayerActivated] = useState(false);
  const plateRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  const playerPosition = usePlayerStore((state) => state.position);
  
  // Check if player is on the plate
  useEffect(() => {
    if (!requiresPlayer) return;
    
    const playerVec = new Vector3(...playerPosition);
    const plateVec = new Vector3(...position);
    // Ignore Y axis for distance calculation - just check XZ plane
    playerVec.y = 0;
    plateVec.y = 0;
    
    const distance = playerVec.distanceTo(plateVec);
    
    if (distance < activationDistance) {
      if (!isActive) {
        activatePlate(true);
      }
      setWasPlayerActivated(true);
    } else if (isActive && wasPlayerActivated) {
      // Only deactivate if player was the one who activated it
      if (autoReset) {
        deactivatePlate();
      }
    }
  }, [playerPosition, requiresPlayer]);
  
  // Handle auto reset
  useEffect(() => {
    let resetTimer: NodeJS.Timeout;
    
    if (isActive && autoReset && !requiresPlayer) {
      resetTimer = setTimeout(() => {
        deactivatePlate();
      }, resetDelay * 1000);
    }
    
    return () => {
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, [isActive, autoReset, requiresPlayer]);
  
  // Plate animation
  useFrame(() => {
    if (!plateRef.current) return;
    
    const targetY = isActive ? initialY - 0.05 : initialY;
    const currentY = plateRef.current.position.y;
    
    // Smoothly interpolate position
    plateRef.current.position.y = currentY + (targetY - currentY) * 0.2;
  });
  
  // Activate the pressure plate
  const activatePlate = (byPlayer = false) => {
    if (!isActive) {
      setIsActive(true);
      setWasPlayerActivated(byPlayer);
      plateActivateSound.play();
      
      if (onActivate) {
        onActivate();
      }
    }
  };
  
  // Deactivate the pressure plate
  const deactivatePlate = () => {
    if (isActive) {
      setIsActive(false);
      setWasPlayerActivated(false);
      plateDeactivateSound.play();
      
      if (onDeactivate) {
        onDeactivate();
      }
    }
  };
  
  // Handle external bodies triggering the plate (if not requiring player)
  const handleIntersectionEnter = () => {
    if (!requiresPlayer && !isActive) {
      activatePlate(false);
    }
  };
  
  const handleIntersectionExit = () => {
    if (!requiresPlayer && isActive && autoReset) {
      // Add small delay before checking if all bodies have exited
      setTimeout(() => {
        deactivatePlate();
      }, 100);
    }
  };

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider 
        args={[size[0]/2, size[1]/2, size[2]/2]} 
        sensor 
        onIntersectionEnter={handleIntersectionEnter}
        onIntersectionExit={handleIntersectionExit}
      />
      
      <mesh
        ref={plateRef}
        rotation={[0, 0, 0]}
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={isActive ? activeColor : color} 
          roughness={0.5}
          emissive={isActive ? activeColor : "#000000"}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>
    </RigidBody>
  );
}
