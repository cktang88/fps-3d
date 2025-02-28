import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight } from '@react-three/drei';
import { Color, Vector3, PointLight } from 'three';

// Visual muzzle flash effect when shooting
export function MuzzleFlash({ 
  position = [0, 0, 0],
  color = "#ffaa00", 
  intensity = 10,
  decay = 1.7,
  duration = 0.1
}) {
  const lightRef = useRef<any>();
  const timer = useRef(duration);
  
  // Reset timer when component mounts (new flash)
  useEffect(() => {
    timer.current = duration;
  }, [duration]);
  
  // Fade out and remove the flash
  useFrame((_, delta) => {
    if (lightRef.current && timer.current > 0) {
      timer.current -= delta;
      
      // Fade intensity as timer runs down
      const progress = timer.current / duration;
      lightRef.current.intensity = intensity * progress;
    }
  });
  
  return (
    <group position={position}>
      <PointLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        distance={2}
        decay={decay}
      />
    </group>
  );
}

// Visual bullet tracer that shows bullet path
export function BulletTracer({
  start = [0, 0, 0],
  end = [0, 0, 0],
  color = "#ffaa00",
  thickness = 0.02,
  duration = 0.2
}) {
  const groupRef = useRef<any>();
  const timer = useRef(duration);
  
  // Get direction and distance
  const startVec = new Vector3(...start);
  const endVec = new Vector3(...end);
  const direction = endVec.clone().sub(startVec).normalize();
  const distance = startVec.distanceTo(endVec);
  
  // Reset timer when component mounts (new tracer)
  useEffect(() => {
    timer.current = duration;
  }, [duration]);
  
  // Fade out the tracer
  useFrame((_, delta) => {
    if (groupRef.current && timer.current > 0) {
      timer.current -= delta;
      
      // Fade opacity as timer runs down
      const progress = timer.current / duration;
      groupRef.current.children.forEach((child:any) => {
        if (child.material) {
          child.material.opacity = progress;
        }
      });
    }
  });
  
  // Position halfway between start and end
  const midpoint = startVec.clone().add(endVec).multiplyScalar(0.5);
  
  return (
    <group ref={groupRef} position={midpoint}>
      <mesh
        rotation={[0, 0, Math.atan2(direction.y, direction.x)]}
        lookAt={endVec}
      >
        <cylinderGeometry args={[thickness, thickness, distance, 8, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Visual impact effect at hit location
export function ImpactEffect({
  position = [0, 0, 0],
  normal = [0, 1, 0],
  color = "#ffaa00",
  size = 0.1,
  duration = 1.0
}) {
  const groupRef = useRef<any>();
  const timer = useRef(duration);
  
  // Reset timer when component mounts (new impact)
  useEffect(() => {
    timer.current = duration;
  }, [duration]);
  
  // Fade out the impact
  useFrame((_, delta) => {
    if (groupRef.current && timer.current > 0) {
      timer.current -= delta;
      
      // Fade and scale as timer runs down
      const progress = timer.current / duration;
      groupRef.current.scale.set(
        progress * size,
        progress * size,
        progress * size
      );
      
      if (groupRef.current.children.length > 0) {
        groupRef.current.children.forEach((child:any) => {
          if (child.material) {
            child.material.opacity = progress;
          }
        });
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <pointLight color={color} intensity={2} distance={1} decay={2} />
      <mesh>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={1}
        />
      </mesh>
    </group>
  );
}

// Main component to handle all shooting effects
export function ShootingEffects({
  active = false,
  position = [0, 0, 0],
  type = "pistol",
}) {
  // Different effects based on weapon type
  const getEffectColor = () => {
    switch (type) {
      case "pistol":
        return "#ffaa00";
      case "shotgun":
        return "#ff7700";
      case "rifle":
        return "#ff5500";
      case "plasmagun":
        return "#44aaff";
      default:
        return "#ffaa00";
    }
  };
  
  // Only render effects when active (shooting)
  if (!active) return null;
  
  return (
    <group position={position}>
      <MuzzleFlash 
        position={[0, 0, 0]}
        color={getEffectColor()}
        intensity={type === "plasmagun" ? 5 : 10}
      />
    </group>
  );
}
