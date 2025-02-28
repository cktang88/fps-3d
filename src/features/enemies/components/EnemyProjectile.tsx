import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Group } from "three";
import { RigidBody, CuboidCollider, useRapier, RaycastOptions } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { useEnemyStore } from "../stores/enemyStore";
import { EnemyType } from "./Enemy";

export interface EnemyProjectileProps {
  position: [number, number, number];
  velocity: [number, number, number];
  damage?: number;
  type: EnemyType;
  id: string;
  onHit?: (position: [number, number, number]) => void;
}

export function EnemyProjectile({
  position,
  velocity,
  damage = 10,
  type,
  id,
  onHit
}: EnemyProjectileProps) {
  const { scene } = useThree();
  const projectileRef = useRef<Group>(null);
  const rigidBodyRef = useRef<any>(null);
  const enemyStore = useEnemyStore();
  const [hasHit, setHasHit] = useState(false);
  const { raycast } = useRapier();
  
  // Projectile lifetime management
  useEffect(() => {
    // Remove projectile after 5 seconds if it hasn't hit anything
    const timeout = setTimeout(() => {
      if (!hasHit) {
        // Mark as hit first to prevent multiple removal attempts
        setHasHit(true);
        // Add a small delay before store removal to allow physics cleanup
        setTimeout(() => {
          enemyStore.removeProjectile(id);
        }, 50);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [id, hasHit, enemyStore]);
  
  // Disable physics before unmounting
  useEffect(() => {
    return () => {
      // Attempt to disable the rigid body before React unmounts it
      if (rigidBodyRef.current) {
        try {
          rigidBodyRef.current.setEnabled(false);
        } catch (e) {
          // Silently catch any errors during cleanup
          console.warn("Error during projectile cleanup:", e);
        }
      }
    };
  }, []);

  // Update projectile position and check for collisions
  useFrame(() => {
    if (hasHit || !rigidBodyRef.current) return;
    
    const position = rigidBodyRef.current.translation();
    
    // Set up ray for collision detection
    const rayOrigin = new Vector3(position.x, position.y, position.z);
    const rayDirection = new Vector3(velocity[0], velocity[1], velocity[2]).normalize();
    
    // Cast ray to detect collisions
    const raycastResult = raycast({
      origin: rayOrigin,
      direction: rayDirection,
      maxToi: 0.5, // Distance to check ahead
      excludeCollider: rigidBodyRef.current
    });
    
    if (raycastResult.hasHit) {
      const hitObject = raycastResult.collider.parent();
      const hitObjectName = hitObject?.name || '';
      
      // Handle collision with player
      if (hitObjectName.includes('player')) {
        console.log('Player hit by projectile');
        // Get player via scene and apply damage
        const playerObjects = scene.children.filter(obj => 
          obj.name?.includes('player') && obj.userData?.takeDamage
        );
        
        if (playerObjects.length > 0 && playerObjects[0].userData?.takeDamage) {
          playerObjects[0].userData.takeDamage(damage);
        }
        
        // Create hit effect at impact point
        if (onHit) {
          const hitPosition: [number, number, number] = [
            raycastResult.point.x,
            raycastResult.point.y,
            raycastResult.point.z
          ];
          onHit(hitPosition);
        }
        
        // Mark as hit first, then remove from store with slight delay
        setHasHit(true);
        setTimeout(() => {
          enemyStore.removeProjectile(id);
        }, 50);
      }
      // Handle collision with environment
      else if (!hitObjectName.includes('enemy')) {
        // Create hit effect at impact point for environment hits
        if (onHit) {
          const hitPosition: [number, number, number] = [
            raycastResult.point.x,
            raycastResult.point.y,
            raycastResult.point.z
          ];
          onHit(hitPosition);
        }
        
        // Mark as hit first, then remove from store with slight delay
        setHasHit(true);
        setTimeout(() => {
          enemyStore.removeProjectile(id);
        }, 50);
      }
    }
  });
  
  // Render different projectile styles based on enemy type
  const getProjectileColor = () => {
    switch (type) {
      case 'grunt': return '#ff5500';
      case 'soldier': return '#ff0000';
      case 'commander': return '#aa00ff';
      default: return '#ff0000';
    }
  };
  
  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      gravityScale={0}
      linearVelocity={velocity}
      name={`projectile-${id}`}
      userData={{ isEnemyProjectile: true }}
      enabled={!hasHit} // Disable physics when hit
    >
      <CuboidCollider args={[0.05, 0.05, 0.05]} sensor />
      <group ref={projectileRef}>
        <mesh castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial 
            emissive={getProjectileColor()} 
            emissiveIntensity={2} 
            color={getProjectileColor()} 
          />
        </mesh>
        <pointLight 
          color={getProjectileColor()} 
          intensity={1} 
          distance={2} 
        />
      </group>
    </RigidBody>
  );
}
