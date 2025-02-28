import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, CapsuleCollider } from "@react-three/rapier";
import { Vector3, Quaternion, Group } from "three";
import { useSpring, animated } from "@react-spring/three";
import { useGLTF } from "@react-three/drei";
import { useEnemyStore } from "../stores/enemyStore";
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
const ENEMY_ATTACK: Record<EnemyType, { damage: number; rate: number; range: number; speed: number }> = {
  grunt: { damage: 10, rate: 1200, range: 10, speed: 12 },
  soldier: { damage: 15, rate: 800, range: 15, speed: 15 },
  commander: { damage: 25, rate: 1500, range: 20, speed: 10 },
};

export interface EnemyProps {
  type: EnemyType;
  position: [number, number, number];
  onDeath?: (position: [number, number, number]) => void;
}

export function Enemy({ type, position, onDeath }: EnemyProps) {
  const enemyRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const playerPosition = useRef<Vector3>(new Vector3());
  const playerPositionTrackingRef = useRef<Vector3>(new Vector3());
  const lastShotTime = useRef<number>(0);
  const lastShootAttempt = useRef<number>(Date.now());
  const shootCooldown = useRef<number>(ENEMY_ATTACK[type].rate);
  const turnSpeed = 3; // Speed at which enemy rotates toward player
  
  // AI state using refs for performance
  const path = useRef<Vector3[]>([]);
  const currentPathIndex = useRef<number>(0);
  const isStuck = useRef<boolean>(false);
  const stuckCheckTimer = useRef<number>(0);
  const lastPosition = useRef<Vector3>(new Vector3());
  
  // State
  const [health, setHealth] = useState(ENEMY_HEALTH[type]);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [enemyId, setEnemyId] = useState<string>("");
  const [animationState, setAnimationState] = useState<"idle" | "walking" | "attacking" | "hit" | "dying">("idle");
  const [removed, setRemoved] = useState(false);
  
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
  
  // Update enemy position and behavior
  useFrame((_, delta) => {
    if (isDead || !enemyRef.current) return;

    // Update enemy position if rigid body exists
    if (rigidBodyRef.current) {
      const enemyPos = rigidBodyRef.current.translation();
      
      // Only update model position if it exists
      if (modelRef.current) {
        modelRef.current.position.set(enemyPos.x, enemyPos.y, enemyPos.z);
      }
      
      // Get player position from enemy store
      const player = enemyStore.getPlayer();
      if (player) {
        playerPosition.current.set(player.x, player.y, player.z);
        playerPositionTrackingRef.current.copy(playerPosition.current);
      }
      
      // Calculate distance to player
      const currentPosition = new Vector3(enemyPos.x, enemyPos.y, enemyPos.z);
      const distanceToPlayer = currentPosition.distanceTo(playerPosition.current);
      
      // Calculate direction to player (ignoring y)
      const directionToPlayer = new Vector3()
        .subVectors(playerPosition.current, currentPosition)
        .setY(0) // Keep movement on the horizontal plane
        .normalize();
      
      // Calculate target rotation (face the player)
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      
      // Update the model rotation
      if (modelRef.current) {
        const currentRotation = modelRef.current.rotation.y;
        // Smooth rotation (lerp between current and target)
        const newRotation = currentRotation + (targetRotation - currentRotation) * Math.min(delta * turnSpeed, 1);
        modelRef.current.rotation.y = newRotation;
      }
      
      // Update rigid body velocity based on distance to player
      const speed = ENEMY_SPEED[type] * delta * 10; // Scale by delta and a factor
      
      // Handle movement based on distance
      if (distanceToPlayer < 3) {
        // Too close - back away slightly
        rigidBodyRef.current.setLinvel({
          x: -directionToPlayer.x * speed * 0.5,
          y: 0,
          z: -directionToPlayer.z * speed * 0.5
        }, true);
        setAnimationState("walking");
      } else if (distanceToPlayer > 15) {
        // Too far - move faster toward player
        rigidBodyRef.current.setLinvel({
          x: directionToPlayer.x * speed * 1.5,
          y: 0,
          z: directionToPlayer.z * speed * 1.5
        }, true);
        setAnimationState("walking");
      } else if (distanceToPlayer > 5) {
        // Standard follow behavior
        rigidBodyRef.current.setLinvel({
          x: directionToPlayer.x * speed,
          y: 0,
          z: directionToPlayer.z * speed
        }, true);
        setAnimationState("walking");
      } else {
        // In attack range - stop and attack
        rigidBodyRef.current.setLinvel({
          x: 0,
          y: 0,
          z: 0
        }, true);
        setAnimationState("attacking");
        
        // Attempt to shoot if enough time has passed
        const currentTime = Date.now();
        if (currentTime - lastShootAttempt.current > shootCooldown.current) {
          lastShootAttempt.current = currentTime;
          shootProjectile(playerPosition.current, currentPosition);
        }
      }
    }
  });
  
  // Handle taking damage
  const takeDamage = (amount: number) => {
    if (isDead) return;
    
    setHealth((prev) => {
      const newHealth = prev - amount;
      if (newHealth <= 0) {
        die();
        return 0;
      }
      setAnimationState("hit");
      return newHealth;
    });
  };
  
  // Death handling
  const die = () => {
    setIsDead(true);
    setAnimationState("death");
    
    // Change collider to represent fallen enemy
    if (rigidBodyRef.current) {
      // Disable the current collider
      rigidBodyRef.current.setEnabled(false);
    }
    
    // Notify parent of death for potential item drops or score
    if (onDeath) {
      onDeath(position);
    }
    
    // Remove from scene after death animation
    setTimeout(() => {
      setRemoved(true);
    }, 3000);
  };
  
  // Handle collisions
  const handleCollision = (e: any) => {
    // If we collide with a player bullet or other projectile
    if (e.other.rigidBodyObject?.userData?.type === "projectile") {
      // Extract damage from the projectile
      const damage = e.other.rigidBodyObject?.userData?.damage || 10;
      takeDamage(damage);
    }
  };
  
  // Shoot projectile at player
  const shootProjectile = (targetPosition: Vector3, sourcePosition: Vector3) => {
    // Don't shoot if dead
    if (isDead) return;
    
    // Calculate direction vector from enemy to player
    const direction = new Vector3()
      .subVectors(targetPosition, sourcePosition)
      .normalize();
    
    // Add a slight vertical offset to projectile start position
    const projectileStart = sourcePosition.clone().add(new Vector3(0, 0.5, 0));
    
    // Get weapon properties based on enemy type
    const attackProps = ENEMY_ATTACK[type];
    
    // Play attack animation
    setAnimationState("attacking");
    
    // Get velocity from direction and speed
    const velocity: [number, number, number] = [
      direction.x * attackProps.speed,
      direction.y * attackProps.speed,
      direction.z * attackProps.speed
    ];
    
    // Spawn projectile through enemy store
    enemyStore.addProjectile({
      position: [projectileStart.x, projectileStart.y, projectileStart.z],
      velocity: velocity,
      damage: attackProps.damage,
      type: type
    });
    
    // Reset attack animation after delay
    setTimeout(() => {
      if (!isDead) {
        setAnimationState("idle");
      }
    }, 500);
  };
  
  // Handle projectile hit
  const handleProjectileHit = (id: string) => {
    setProjectiles(prev => prev.filter(proj => proj.id !== id));
  };
  
  const enemyStore = useEnemyStore();

  // Register with enemy store on mount
  useEffect(() => {
    // Convert position array to object format for the store
    const posObj = {
      x: position[0],
      y: position[1], 
      z: position[2]
    };
    
    // Add enemy to store and save the ID
    const id = enemyStore.addEnemy({
      type,
      position: posObj,
      health: ENEMY_HEALTH[type],
      maxHealth: ENEMY_HEALTH[type],
      isDead: false,
      isAlerted: false,
      lastAttackTime: 0
    });
    
    setEnemyId(id);

    // Cleanup on unmount
    return () => {
      if (enemyId) {
        enemyStore.removeEnemy(enemyId);
      }
    };
  }, []);

  // Update position in store when it changes
  useFrame(() => {
    if (enemyId && enemyRef.current) {
      const currentPos = enemyRef.current.position;
      
      // Get player position for distance calculation
      const playerPosition = target ? new Vector3().copy(target) : new Vector3();
      const enemyPosition = new Vector3(currentPos.x, currentPos.y, currentPos.z);
      const distanceToPlayer = target ? enemyPosition.distanceTo(playerPosition) : Infinity;
      
      enemyStore.updateEnemy(enemyId, {
        position: {
          x: currentPos.x,
          y: currentPos.y,
          z: currentPos.z
        },
        isDead,
        isAlerted: distanceToPlayer < ENEMY_ATTACK[type].range
      });
    }
  });

  // Update enemy health in store when it changes
  useEffect(() => {
    if (enemyId) {
      enemyStore.updateEnemy(enemyId, { health, isDead });
    }
  }, [health, isDead]);

  // Expose takeDamage method to parent
  useEffect(() => {
    if (enemyRef.current) {
      (enemyRef.current as any).takeDamage = takeDamage;
    }
  }, [enemyRef.current]);

  return (
    <group ref={enemyRef} position={position} name={`enemy-${enemyId}`}>
      <RigidBody 
        ref={rigidBodyRef}
        type="dynamic"
        colliders={false}
        mass={80}
        lockRotations
        enabledRotations={[false, false, false]}
        userData={{ type: "enemy", takeDamage, damage: type === 'commander' ? 20 : 10 }}
        onCollisionEnter={handleCollision}
        friction={0.5}
      >
        {/* Main enemy collider - use capsule for humanoid shape */}
        <CapsuleCollider args={[0.5, 0.7]} position={[0, 0.9, 0]} />
        
        {/* Group for the animated model */}
        <group ref={modelRef} scale={1.0} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          {/* Simple enemy model */}
          <group>
            {/* Body */}
            <mesh castShadow position={[0, 0.9, 0]}>
              <capsuleGeometry args={[0.5, 0.7, 8, 8]} />
              <meshStandardMaterial 
                color={
                  type === 'grunt' ? '#884400' :
                  type === 'soldier' ? '#446688' :
                  '#884466'
                } 
              />
            </mesh>
            
            {/* Head */}
            <mesh castShadow position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial 
                color={
                  type === 'grunt' ? '#aa5500' :
                  type === 'soldier' ? '#5577aa' :
                  '#aa5577'
                } 
              />
            </mesh>
            
            {/* Arms */}
            <mesh castShadow position={[0.7, 0.9, 0]}>
              <capsuleGeometry args={[0.2, 0.7, 8, 8]} />
              <meshStandardMaterial 
                color={
                  type === 'grunt' ? '#773300' :
                  type === 'soldier' ? '#335577' :
                  '#773355'
                } 
              />
            </mesh>
            <mesh castShadow position={[-0.7, 0.9, 0]}>
              <capsuleGeometry args={[0.2, 0.7, 8, 8]} />
              <meshStandardMaterial 
                color={
                  type === 'grunt' ? '#773300' :
                  type === 'soldier' ? '#335577' :
                  '#773355'
                } 
              />
            </mesh>
            
            {/* Weapon (for soldier and commander) */}
            {(type === 'soldier' || type === 'commander') && (
              <mesh castShadow position={[0.7, 0.9, 0.5]}>
                <boxGeometry args={[0.1, 0.1, 0.8]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
            )}
            
            {/* Health bar - scales with health percentage */}
            <mesh position={[0, 2.3, 0]}>
              <boxGeometry args={[1.2 * (health / 100), 0.1, 0.1]} />
              <meshBasicMaterial color={health > 50 ? 'green' : health > 25 ? 'yellow' : 'red'} />
            </mesh>
          </group>
        </group>
      </RigidBody>
      
      {/* Render projectiles */}
      {projectiles.map(projectile => (
        <EnemyProjectile
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          speed={ENEMY_ATTACK[type].speed}
          damage={ENEMY_ATTACK[type].damage}
          onHit={() => handleProjectileHit(projectile.id)}
        />
      ))}
    </group>
  );
}
