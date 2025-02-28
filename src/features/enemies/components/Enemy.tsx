import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, Quaternion } from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";
import { EnemyProjectile } from "./EnemyProjectile";

// Define available enemy types
export type EnemyType = "grunt" | "soldier" | "commander";

// Enemy health levels based on type
const ENEMY_HEALTH: Record<EnemyType, number> = {
  grunt: 50,
  soldier: 100,
  commander: 200,
};

// Enemy speeds based on type
const ENEMY_SPEED: Record<EnemyType, number> = {
  grunt: 2.5,
  soldier: 3.5,
  commander: 2.0,
};

// Enemy attack properties
const ENEMY_ATTACK: Record<EnemyType, { damage: number; rate: number; range: number; projectileSpeed: number }> = {
  grunt: { damage: 10, rate: 1200, range: 10, projectileSpeed: 12 },
  soldier: { damage: 15, rate: 800, range: 15, projectileSpeed: 15 },
  commander: { damage: 25, rate: 1500, range: 20, projectileSpeed: 10 },
};

export interface EnemyProps {
  type: EnemyType;
  position: [number, number, number];
  onDeath?: (position: [number, number, number]) => void;
}

export function Enemy({ type, position, onDeath }: EnemyProps) {
  const enemyRef = useRef<Group>(null);
  const rigidBodyRef = useRef(null);
  
  // State
  const [health, setHealth] = useState(ENEMY_HEALTH[type]);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const [isDead, setIsDead] = useState(false);
  
  // Enemy movement
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());
  
  // Animation state
  const [animationState, setAnimationState] = useState<"idle" | "walking" | "attacking" | "hit" | "dying">("idle");
  
  // Projectile management
  const [projectiles, setProjectiles] = useState<{
    id: string;
    position: [number, number, number];
    direction: Vector3;
  }[]>([]);
  
  // Spring animations for smooth movement and hit reactions
  const [springs, api] = useSpring(() => ({
    position: position,
    scale: [1, 1, 1],
    color: "#ffffff",
    config: { tension: 100, friction: 15 },
  }));
  
  // Get player position on each frame
  useFrame(({ camera }) => {
    if (isDead) return;
    
    const playerPosition = new Vector3().setFromMatrixPosition(camera.matrixWorld);
    setTarget(playerPosition);
    
    // Calculate distance to player
    const currentPosition = new Vector3(
      springs.position.get()[0],
      springs.position.get()[1],
      springs.position.get()[2]
    );
    const distanceToPlayer = currentPosition.distanceTo(playerPosition);
    
    // Attack logic based on distance
    const attackProps = ENEMY_ATTACK[type];
    if (distanceToPlayer < attackProps.range) {
      setAnimationState("attacking");
      
      // Face player
      if (enemyRef.current) {
        const lookAtVector = new Vector3(playerPosition.x, currentPosition.y, playerPosition.z);
        const enemyQuat = new Quaternion();
        const upVector = new Vector3(0, 1, 0);
        const forwardVector = new Vector3().subVectors(lookAtVector, currentPosition).normalize();
        
        enemyQuat.setFromUnitVectors(new Vector3(0, 0, 1), forwardVector);
        enemyRef.current.quaternion.slerp(enemyQuat, 0.1);
      }
      
      // Attack with cooldown
      const now = Date.now();
      if (now - lastAttackTime > attackProps.rate) {
        setLastAttackTime(now);
        
        // Shoot projectile at player
        if (distanceToPlayer > 2) { // Only shoot if player is not too close
          shootProjectile(playerPosition, currentPosition);
        } else {
          // Melee attack if very close
          console.log(`${type} melee attacks player!`);
          // Would trigger direct damage to player here
        }
      }
      
      // Move away if player is too close (maintain distance)
      if (distanceToPlayer < 5) {
        direction.current.subVectors(currentPosition, playerPosition).normalize();
        velocity.current.set(
          direction.current.x * ENEMY_SPEED[type] * 0.5,
          0,
          direction.current.z * ENEMY_SPEED[type] * 0.5
        );
        
        api.start({
          position: [
            currentPosition.x + velocity.current.x * 0.01,
            position[1],
            currentPosition.z + velocity.current.z * 0.01
          ]
        });
      }
    } else {
      // Move towards player if outside attack range
      setAnimationState("walking");
      
      direction.current.subVectors(playerPosition, currentPosition).normalize();
      velocity.current.set(
        direction.current.x * ENEMY_SPEED[type],
        0, // Keep y movement at 0 to stay on ground
        direction.current.z * ENEMY_SPEED[type]
      );
      
      // Update position with spring physics
      api.start({
        position: [
          currentPosition.x + velocity.current.x * 0.01,
          position[1], // Keep original y position
          currentPosition.z + velocity.current.z * 0.01
        ]
      });
      
      // Calculate rotation to face player
      if (enemyRef.current) {
        const lookAtVector = new Vector3(playerPosition.x, currentPosition.y, playerPosition.z);
        const enemyQuat = new Quaternion();
        const upVector = new Vector3(0, 1, 0);
        const forwardVector = new Vector3().subVectors(lookAtVector, currentPosition).normalize();
        
        enemyQuat.setFromUnitVectors(new Vector3(0, 0, 1), forwardVector);
        enemyRef.current.quaternion.slerp(enemyQuat, 0.1);
      }
    }
  });
  
  // Shoot projectile at player
  const shootProjectile = (playerPos: Vector3, currentPos: Vector3) => {
    // Calculate direction vector to player with slight randomness for inaccuracy
    const shootDir = new Vector3()
      .subVectors(playerPos, currentPos)
      .normalize()
      .add(new Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1 + 0.05, // Slight upward bias
        (Math.random() - 0.5) * 0.1
      ))
      .normalize();
    
    // Create projectile
    const projectileId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Slightly offset position to avoid collision with enemy
    const startPosition: [number, number, number] = [
      currentPos.x + shootDir.x * 0.6,
      currentPos.y + 1, // Shoot from "head" height
      currentPos.z + shootDir.z * 0.6
    ];
    
    setProjectiles(prev => [
      ...prev, 
      { id: projectileId, position: startPosition, direction: shootDir }
    ]);
    
    // Visual effect for shooting
    api.start({
      scale: [1.1, 1.1, 1.1],
      config: { tension: 300, friction: 10, duration: 100 },
      onRest: () => {
        api.start({
          scale: [1, 1, 1],
          config: { tension: 100, friction: 15 }
        });
      }
    });
  };
  
  // Handle projectile hit
  const handleProjectileHit = (id: string) => {
    setProjectiles(prev => prev.filter(proj => proj.id !== id));
  };
  
  // Handle taking damage
  const takeDamage = (amount: number) => {
    if (isDead) return;
    
    setHealth((prev) => {
      const newHealth = prev - amount;
      
      if (newHealth <= 0) {
        die();
        return 0;
      }
      
      // Visual feedback for hit
      api.start({
        color: "#ff0000",
        scale: [1.2, 1.2, 1.2],
        config: { tension: 300, friction: 10 },
        onRest: () => {
          api.start({
            color: "#ffffff",
            scale: [1, 1, 1],
            config: { tension: 100, friction: 15 }
          });
        }
      });
      
      setAnimationState("hit");
      setTimeout(() => {
        if (!isDead) setAnimationState("idle");
      }, 300);
      
      return newHealth;
    });
  };
  
  // Handle death
  const die = () => {
    setIsDead(true);
    setAnimationState("dying");
    
    // Trigger death animation
    api.start({
      position: [springs.position.get()[0], position[1] - 0.5, springs.position.get()[2]],
      scale: [1.2, 0.2, 1.2],
      color: "#550000",
      config: { tension: 100, friction: 20 },
      onRest: () => {
        // Notify parent of death for potential spawning logic
        if (onDeath) {
          const finalPos: [number, number, number] = [
            springs.position.get()[0],
            position[1],
            springs.position.get()[2]
          ];
          onDeath(finalPos);
        }
        
        // Fade out and remove after death animation
        api.start({
          scale: [0, 0, 0],
          config: { tension: 100, friction: 15, duration: 1000 }
        });
      }
    });
  };
  
  // Expose takeDamage method to parent
  useEffect(() => {
    if (enemyRef.current) {
      (enemyRef.current as any).takeDamage = takeDamage;
    }
  }, [enemyRef.current]);
  
  return (
    <>
      <a.group
        ref={enemyRef}
        position={springs.position}
        scale={springs.scale}
      >
        <RigidBody
          ref={rigidBodyRef}
          type="dynamic"
          canSleep={false}
          lockRotations
          enabled={!isDead}
          name="enemy"
        >
          <CuboidCollider args={[0.5, 1, 0.5]} />
          
          {/* Simple enemy model based on type */}
          {type === "grunt" && (
            <a.mesh castShadow>
              <boxGeometry args={[1, 2, 1]} />
              <a.meshStandardMaterial color={springs.color} roughness={0.7} />
            </a.mesh>
          )}
          
          {type === "soldier" && (
            <a.mesh castShadow>
              <capsuleGeometry args={[0.5, 1.5, 4, 16]} />
              <a.meshStandardMaterial color={springs.color} roughness={0.5} />
            </a.mesh>
          )}
          
          {type === "commander" && (
            <a.mesh castShadow>
              <group>
                <mesh castShadow position={[0, 0, 0]}>
                  <capsuleGeometry args={[0.6, 1.8, 4, 16]} />
                  <a.meshStandardMaterial color={springs.color} roughness={0.4} />
                </mesh>
                <mesh castShadow position={[0, 0.8, 0.3]}>
                  <boxGeometry args={[1.2, 0.4, 0.6]} />
                  <a.meshStandardMaterial color="#333333" roughness={0.8} />
                </mesh>
              </group>
            </a.mesh>
          )}
          
          {/* Health bar above enemy */}
          <group position={[0, 2.5, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.2, 0.1]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[(health / ENEMY_HEALTH[type] - 1) * 0.6, 0, 0.05]}>
              <boxGeometry args={[1.2 * (health / ENEMY_HEALTH[type]), 0.15, 0.1]} />
              <meshBasicMaterial color={health > ENEMY_HEALTH[type] * 0.3 ? "#00ff00" : "#ff0000"} />
            </mesh>
          </group>
        </RigidBody>
      </a.group>
      
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        <EnemyProjectile
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          speed={ENEMY_ATTACK[type].projectileSpeed}
          damage={ENEMY_ATTACK[type].damage}
          onHit={() => handleProjectileHit(projectile.id)}
        />
      ))}
    </>
  );
}
