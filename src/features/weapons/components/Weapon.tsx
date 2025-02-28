import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Euler, Group } from "three";
import { ShootingEffects } from "./ShootingEffects";
import { RigidBody } from "@react-three/rapier";
import { inputState } from "../../core/ecs/systems/inputSystem";

// Weapon types
export type WeaponType = "pistol" | "shotgun" | "rifle" | "plasmagun";

// Component Props
interface WeaponProps {
  type: WeaponType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  ammo: number;
  maxAmmo: number;
  onFire?: () => void;
  onReload?: () => void;
  visible?: boolean;
  playerRef?: React.RefObject<any>; // Reference to the player's rigid body
}

export function Weapon({
  type = "pistol",
  position = [0.3, -0.3, -0.5],
  rotation = [0, 0, 0],
  ammo,
  maxAmmo,
  onFire,
  onReload,
  visible = true,
  playerRef,
}: WeaponProps) {
  // Refs for weapon positioning and effects
  const weaponRef = useRef<Group>(null);
  const bobPhase = useRef<number>(0);
  const eulerRot = useRef<Euler>(new Euler(...rotation));
  
  // Visual states for weapon animations
  const [isRecoiling, setIsRecoiling] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [bobValue, setBobValue] = useState(0);
  
  const { camera } = useThree();
  
  // Handle firing effects
  const handleFire = () => {
    if (ammo <= 0 || isReloading) return;
    
    // Trigger fire callback
    if (onFire) onFire();
    
    // Visual feedback
    setIsRecoiling(true);
    setIsFiring(true);
    
    // Reset recoil
    setTimeout(() => {
      setIsRecoiling(false);
    }, 100);
    
    // Reset firing effect
    setTimeout(() => {
      setIsFiring(false);
    }, 50);
  };
  
  // Handle reloading animation
  const handleReload = () => {
    if (isReloading || ammo === maxAmmo) return;
    
    setIsReloading(true);
    
    // Call reload callback
    if (onReload) onReload();
    
    // Reset reloading state after animation completes
    setTimeout(() => {
      setIsReloading(false);
    }, 1500); // 1.5 second reload animation
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyR") {
        handleReload();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ammo, maxAmmo, isReloading]);
  
  // Handle weapon position, rotation and bobbing
  useFrame((_, delta) => {
    if (!weaponRef.current || !camera) return;
    
    // Simple weapon bob while walking (assuming global walking state)
    // In a real implementation, tie this to player movement state
    if (window.inputState?.forward || window.inputState?.backward || 
        window.inputState?.left || window.inputState?.right) {
      // Increase bob speed when moving
      bobPhase.current += delta * 8;
      const newBobValue = Math.sin(bobPhase.current) * 0.02;
      setBobValue(newBobValue);
    } else {
      // Reset bob when not moving
      bobPhase.current = 0;
      setBobValue(0);
    }
    
    // Get camera position as the base position
    const cameraPosition = new Vector3();
    camera.getWorldPosition(cameraPosition);
    
    // Reset weapon position to camera position
    weaponRef.current.position.copy(cameraPosition);
    
    // Calculate weapon offset in camera space
    const offsetPosition = new Vector3(...position);
    
    // Add subtle bob effect
    offsetPosition.y += bobValue;
    
    // Apply custom recoil when firing
    if (isRecoiling) {
      const recoilAmount = 
        type === "shotgun" ? 0.04 : 
        type === "rifle" ? 0.02 : 
        type === "plasmagun" ? 0.01 : 0.03;
      
      offsetPosition.z += recoilAmount;
    }
    
    // Apply reload animation
    if (isReloading) {
      offsetPosition.y -= 0.1;
      eulerRot.current.x = Math.PI / 4; // Tilt down during reload
    } else {
      eulerRot.current.set(...rotation);
    }
    
    // Transform offset to camera space and add to weapon position
    const transformedOffset = offsetPosition.clone().applyEuler(camera.rotation);
    weaponRef.current.position.add(transformedOffset);
    
    // Copy camera rotation for first-person perspective
    weaponRef.current.rotation.copy(camera.rotation);
  });
  
  // Weapon models based on type
  const renderWeaponModel = () => {
    switch (type) {
      case "pistol":
        return (
          <group rotation={[0, Math.PI, 0]}>
            {/* Pistol body */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.05, 0.12, 0.2]} />
              <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Pistol handle */}
            <mesh castShadow position={[0, -0.1, 0.05]}>
              <boxGeometry args={[0.04, 0.12, 0.08]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </mesh>
            
            {/* Barrel */}
            <mesh castShadow position={[0, 0.02, -0.12]}>
              <boxGeometry args={[0.03, 0.03, 0.14]} />
              <meshStandardMaterial color="#222222" metalness={0.9} />
            </mesh>
            
            {/* Trigger */}
            <mesh castShadow position={[0, -0.03, 0]}>
              <boxGeometry args={[0.02, 0.04, 0.02]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        );
        
      case "shotgun":
        return (
          <group rotation={[0, Math.PI, 0]}>
            {/* Shotgun body */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.06, 0.06, 0.5]} />
              <meshStandardMaterial color="#5b3b0c" roughness={0.7} />
            </mesh>
            
            {/* Barrel */}
            <mesh castShadow position={[0, 0, -0.3]}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#444444" metalness={0.7} />
            </mesh>
            
            {/* Stock */}
            <mesh castShadow position={[0, -0.04, 0.25]}>
              <boxGeometry args={[0.05, 0.12, 0.25]} />
              <meshStandardMaterial color="#3a240b" roughness={0.9} />
            </mesh>
            
            {/* Pump */}
            <mesh castShadow position={[0, -0.07, -0.1]}>
              <boxGeometry args={[0.07, 0.04, 0.2]} />
              <meshStandardMaterial color="#222222" roughness={0.5} />
            </mesh>
          </group>
        );
        
      case "rifle":
        return (
          <group rotation={[0, Math.PI, 0]}>
            {/* Rifle body */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.05, 0.08, 0.6]} />
              <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.3} />
            </mesh>
            
            {/* Barrel */}
            <mesh castShadow position={[0, 0, -0.35]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 12]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#111111" metalness={0.8} />
            </mesh>
            
            {/* Magazine */}
            <mesh castShadow position={[0, -0.1, 0.05]}>
              <boxGeometry args={[0.04, 0.15, 0.08]} />
              <meshStandardMaterial color="#444444" roughness={0.5} />
            </mesh>
            
            {/* Stock */}
            <mesh castShadow position={[0, -0.03, 0.3]}>
              <boxGeometry args={[0.05, 0.1, 0.2]} />
              <meshStandardMaterial color="#333333" roughness={0.6} />
            </mesh>
            
            {/* Scope (simple) */}
            <mesh castShadow position={[0, 0.05, -0.1]}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        );
        
      case "plasmagun":
        return (
          <group rotation={[0, Math.PI, 0]}>
            {/* Main body */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.4]} />
              <meshStandardMaterial color="#1a3366" metalness={0.7} roughness={0.3} />
            </mesh>
            
            {/* Energy core (glowing) */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#66aaff" emissive="#4488ff" emissiveIntensity={2} />
            </mesh>
            
            {/* Barrel */}
            <mesh castShadow position={[0, 0, -0.25]}>
              <cylinderGeometry args={[0.04, 0.03, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#2255aa" metalness={0.8} />
            </mesh>
            
            {/* Cooling fins */}
            <mesh castShadow position={[0, 0.08, -0.1]}>
              <boxGeometry args={[0.12, 0.01, 0.2]} />
              <meshStandardMaterial color="#3366cc" metalness={0.6} />
            </mesh>
            <mesh castShadow position={[0, -0.08, -0.1]}>
              <boxGeometry args={[0.12, 0.01, 0.2]} />
              <meshStandardMaterial color="#3366cc" metalness={0.6} />
            </mesh>
            <mesh castShadow position={[0.08, 0, -0.1]}>
              <boxGeometry args={[0.01, 0.12, 0.2]} />
              <meshStandardMaterial color="#3366cc" metalness={0.6} />
            </mesh>
            <mesh castShadow position={[-0.08, 0, -0.1]}>
              <boxGeometry args={[0.01, 0.12, 0.2]} />
              <meshStandardMaterial color="#3366cc" metalness={0.6} />
            </mesh>
            
            {/* Handle */}
            <mesh castShadow position={[0, -0.12, 0.05]}>
              <boxGeometry args={[0.05, 0.14, 0.1]} />
              <meshStandardMaterial color="#222244" roughness={0.5} />
            </mesh>
          </group>
        );
        
      default:
        return null;
    }
  };
  
  if (!visible) return null;
  
  // Render weapon with muzzle flash effect
  return (
    <group ref={weaponRef}>
      {renderWeaponModel()}
      
      {/* Shooting effects including muzzle flash */}
      <ShootingEffects
        active={isFiring}
        position={[0, 0.02, -0.3]}
        type={type}
      />
      
      {/* Ammo counter - positioned at bottom right of weapon */}
      <group position={[0.06, -0.06, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.1, 0.04]} />
          <meshBasicMaterial color="black" transparent opacity={0.7} />
        </mesh>
        {/* Using simple planes for text since TextGeometry isn't imported */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[0.08, 0.02]} />
          <meshBasicMaterial color="white" transparent opacity={0}/>
        </mesh>
      </group>
    </group>
  );
}
