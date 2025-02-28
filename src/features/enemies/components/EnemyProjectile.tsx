import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group } from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

export interface EnemyProjectileProps {
  position: [number, number, number];
  direction: Vector3;
  speed?: number;
  damage?: number;
  onHit?: (position: [number, number, number]) => void;
  lifespan?: number; // milliseconds
}

export function EnemyProjectile({
  position,
  direction,
  speed = 15,
  damage = 10,
  onHit,
  lifespan = 2000,
}: EnemyProjectileProps) {
  const projectileRef = useRef<Group>(null);
  const normalizedDirection = direction.clone().normalize();
  const creationTime = useRef(Date.now());
  const hasHit = useRef(false);
  
  // Move projectile in direction
  useFrame((_, delta) => {
    if (projectileRef.current && !hasHit.current) {
      // Move in direction at constant speed
      projectileRef.current.position.x += normalizedDirection.x * speed * delta;
      projectileRef.current.position.y += normalizedDirection.y * speed * delta;
      projectileRef.current.position.z += normalizedDirection.z * speed * delta;
      
      // Check lifetime
      if (Date.now() - creationTime.current > lifespan) {
        hasHit.current = true;
        if (onHit) {
          const currentPos: [number, number, number] = [
            projectileRef.current.position.x,
            projectileRef.current.position.y,
            projectileRef.current.position.z,
          ];
          onHit(currentPos);
        }
      }
    }
  });
  
  // Handle collision events
  const handleCollision = (e: any) => {
    if (hasHit.current) return;
    
    // Ignore collisions with other enemy projectiles
    if (e.other.rigidBodyObject?.name === 'enemy-projectile') return;
    
    hasHit.current = true;
    
    // Check if hit player
    if (e.other.rigidBodyObject?.name === 'player') {
      // Player hit logic would go here
      console.log('Player hit by enemy projectile');
      
      // In a real implementation, this would trigger player damage
      // e.g., playerRef.current.takeDamage(damage);
    }
    
    if (onHit && projectileRef.current) {
      const hitPos: [number, number, number] = [
        projectileRef.current.position.x,
        projectileRef.current.position.y,
        projectileRef.current.position.z,
      ];
      onHit(hitPos);
    }
  };
  
  // Clean up after lifespan is over
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasHit.current && onHit && projectileRef.current) {
        hasHit.current = true;
        const finalPos: [number, number, number] = [
          projectileRef.current.position.x,
          projectileRef.current.position.y,
          projectileRef.current.position.z,
        ];
        onHit(finalPos);
      }
    }, lifespan);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <group ref={projectileRef} position={position} name="enemy-projectile">
      <RigidBody
        type="dynamic"
        colliders={false}
        gravityScale={0}
        canSleep={false}
        onCollisionEnter={handleCollision}
        sensor
      >
        <CuboidCollider args={[0.1, 0.1, 0.1]} />
        
        {/* Visual representation */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ff3300" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      </RigidBody>
    </group>
  );
}
