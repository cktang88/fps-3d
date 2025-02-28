import { useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Howl } from "howler";
import { Vector3 } from "three";
import { usePlayerStore } from "../../../player/stores/playerStore";

// Sound effects
const doorOpenSound = new Howl({
  src: ["/sounds/door_open.mp3"],
  volume: 0.6,
});

const doorCloseSound = new Howl({
  src: ["/sounds/door_close.mp3"],
  volume: 0.6,
});

interface DoorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  initialState?: "open" | "closed";
  autoClose?: boolean;
  autoCloseDelay?: number;
  locked?: boolean;
  requiresKey?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

export function Door({
  position,
  rotation = [0, 0, 0],
  size = [4, 4, 0.5],
  color = "#8B4513",
  initialState = "closed",
  autoClose = true,
  autoCloseDelay = 5,
  locked = false,
  requiresKey,
  onOpen,
  onClose,
}: DoorProps) {
  const [isOpen, setIsOpen] = useState(initialState === "open");
  const [isMoving, setIsMoving] = useState(false);
  const [isPlayerNear, setIsPlayerNear] = useState(false);
  const doorRef = useRef<THREE.Mesh>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const playerItems = usePlayerStore((state) => state.items || []);
  
  // Check if player has the required key
  const hasRequiredKey = () => {
    if (!requiresKey) return true;
    return playerItems?.includes(requiresKey);
  };
  
  // Door animation
  useFrame(() => {
    if (!doorRef.current || !isMoving) return;
    
    // Determine the target rotation based on door state
    const targetYRotation = isOpen ? rotation[1] + Math.PI / 2 : rotation[1];
    const currentYRotation = doorRef.current.rotation.y;
    
    // Smoothly interpolate rotation
    const step = 0.05;
    const newRotation = isOpen 
      ? Math.min(targetYRotation, currentYRotation + step)
      : Math.max(targetYRotation, currentYRotation - step);
    
    doorRef.current.rotation.y = newRotation;
    
    // Check if door has reached target position
    if (
      (isOpen && Math.abs(newRotation - targetYRotation) < 0.01) ||
      (!isOpen && Math.abs(newRotation - targetYRotation) < 0.01)
    ) {
      setIsMoving(false);
      
      // Trigger callbacks
      if (isOpen && onOpen) {
        onOpen();
      } else if (!isOpen && onClose) {
        onClose();
      }
    }
  });
  
  // Auto-close timer
  useEffect(() => {
    let closeTimer: NodeJS.Timeout;
    
    if (isOpen && autoClose && !isPlayerNear) {
      closeTimer = setTimeout(() => {
        toggleDoor();
      }, autoCloseDelay * 1000);
    }
    
    return () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
    };
  }, [isOpen, autoClose, isPlayerNear]);
  
  // Check if player is near the door
  useEffect(() => {
    const playerVec = new Vector3(...playerPosition);
    const doorVec = new Vector3(...position);
    const distance = playerVec.distanceTo(doorVec);
    
    const wasNear = isPlayerNear;
    const isNear = distance < 3;
    
    setIsPlayerNear(isNear);
    
    // Auto-open door when player approaches
    if (isNear && !wasNear && !isOpen && !locked) {
      // Only open if player has the key
      if (hasRequiredKey()) {
        toggleDoor();
      }
    }
  }, [playerPosition]);
  
  // Toggle door state
  const toggleDoor = () => {
    if (isMoving) return;
    
    if (locked && !isOpen) {
      // Check if player has the key
      if (!hasRequiredKey()) {
        // Play locked sound or show message
        return;
      }
    }
    
    setIsOpen(!isOpen);
    setIsMoving(true);
    
    // Play sound
    if (!isOpen) {
      doorOpenSound.play();
    } else {
      doorCloseSound.play();
    }
  };
  
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <mesh
        ref={doorRef}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </RigidBody>
  );
}
