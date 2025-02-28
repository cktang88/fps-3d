import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Vector3, Group, Raycaster, Vector2, Camera } from "three";
import { useRapier, RigidBody, CapsuleCollider, CuboidCollider } from "@react-three/rapier";
import type { RigidBody as RapierRigidBody } from "@react-three/rapier";
import { Collider } from "@dimforge/rapier3d-compat";
import { inputState } from "../../core/ecs/systems/inputSystem";
import { FirstPersonCamera } from "./FirstPersonCamera";
import { Weapon, WeaponType, Impact } from "../../weapons/components/Weapon";
import {
  MuzzleFlash,
  BulletTracer,
  ImpactEffect,
} from "../../weapons/components/ShootingEffects";
import { usePlayerStore } from "../stores/playerStore";
import { useEnemyStore } from "../../enemies/stores/enemyStore"; // Fix import path

// Extend Window interface to store camera reference
declare global {
  interface Window {
    camera?: Camera;
  }
}

// Weapon stats for different weapon types
const weaponStats = {
  pistol: {
    damage: 15,
    fireRate: 0.25,
    maxAmmo: 12,
    reloadTime: 1.2,
  },
  shotgun: {
    damage: 8,
    fireRate: 0.8,
    maxAmmo: 8,
    reloadTime: 2.0,
  },
  rifle: {
    damage: 20,
    fireRate: 0.1,
    maxAmmo: 30,
    reloadTime: 1.5,
  },
  plasmagun: {
    damage: 25,
    fireRate: 0.2,
    maxAmmo: 20,
    reloadTime: 1.8,
  },
};

interface PlayerControllerProps {
  position?: [number, number, number];
  moveSpeed?: number;
  jumpForce?: number;
  mass?: number;
  maxHealth?: number;
}

export function PlayerController({
  position = [0, 1, 0],
  moveSpeed = 5,
  jumpForce = 5,
  mass = 1,
  maxHealth = 100,
}: PlayerControllerProps) {
  // References
  const playerRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<any>(null);
  const groundSensor = useRef<boolean>(false);
  const jumpTimer = useRef<number>(0);
  const velocity = useRef<Vector3>(new Vector3());
  const directionOffset = useRef<number>(0);
  const raycaster = useRef(new Raycaster());
  const screenCenter = useRef(new Vector2(0, 0));
  const lastTakeDamageTime = useRef<number>(0);

  // Get camera and physics from three.js context
  const { camera } = useThree();
  const { rapier, world } = useRapier();

  // Player state
  const [health, setHealth] = useState(maxHealth);
  const [isDead, setIsDead] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isGrounded, setIsGrounded] = useState(false);

  // Visual effects state
  const [effects, setEffects] = useState<{
    muzzleFlash: { visible: boolean; position: [number, number, number] };
    bulletTracer: { visible: boolean; start: [number, number, number]; end: [number, number, number] };
  }>({
    muzzleFlash: { visible: false, position: [0, 0, 0] },
    bulletTracer: { visible: false, start: [0, 0, 0], end: [0, 0, 0] },
  });

  // Handle debug logging
  const DEBUG = true;
  const debugLog = (message: string) => {
    if (DEBUG) console.log(`[Player] ${message}`);
  };

  // Set up initial player position
  useEffect(() => {
    if (playerRef.current) {
      const body = playerRef.current;
      body.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true
      );
      debugLog(`Player initialized at position: ${position.join(", ")}`);
    }
  }, [position]);

  // Update camera and model positions
  useFrame((_, delta) => {
    if (!playerRef.current || isDead) return;

    const playerPos = playerRef.current.translation();
    const newPosition: [number, number, number] = [playerPos.x, playerPos.y, playerPos.z];
    
    // Update position state
    // setPosition(newPosition);
    
    // Update model position directly to match rigid body
    if (modelRef.current) {
      modelRef.current.position.set(playerPos.x, playerPos.y, playerPos.z);
    }
    
    // Update camera position - safely handle camera reference
    if (cameraRef.current) {
      if (typeof cameraRef.current.setPosition === 'function') {
        cameraRef.current.setPosition([playerPos.x, playerPos.y + 0.8, playerPos.z]);
      } 
    } else if (camera) {
      // Fallback to using the global camera
      camera.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
    }

    // Jumping logic
    if (inputState.jump) {
      // Only allow jumping if we're on the ground and jump timer expired
      if (groundSensor.current && jumpTimer.current <= 0) {
        const jumpStrength = jumpForce;
        playerRef.current.applyImpulse({ x: 0, y: jumpStrength, z: 0 }, true);
        jumpTimer.current = 0.3; // Cooldown between jumps
      }
    }

    // Update jump timer
    if (jumpTimer.current > 0) {
      jumpTimer.current -= delta;
    }

    // Handle movement
    const { forward, backward, left, right } = inputState.movement;
    
    // Get current velocity
    const playerVelocity = playerRef.current.linvel();
    
    // Preserve Y velocity (gravity/jump)
    const currentVelY = playerVelocity.y;

    // Get camera direction
    const cameraQuat = camera.quaternion.clone();
    
    // We only want rotation around Y axis (horizontal rotation)
    cameraQuat.x = 0;
    cameraQuat.z = 0;
    cameraQuat.normalize();
    
    // Calculate move direction based on inputs and camera rotation
    const moveDirection = new Vector3(0, 0, 0);
    
    if (forward) moveDirection.z -= 1;
    if (backward) moveDirection.z += 1;
    if (left) moveDirection.x -= 1;
    if (right) moveDirection.x += 1;
    
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.applyQuaternion(cameraQuat);
      
      // Apply movement with gradual acceleration for better control
      velocity.current.x = moveDirection.x * moveSpeed;
      velocity.current.z = moveDirection.z * moveSpeed;
    } else {
      // Gradual deceleration when no input
      velocity.current.x *= 0.9;
      velocity.current.z *= 0.9;
      
      // Stop completely if very slow
      if (Math.abs(velocity.current.x) < 0.01) velocity.current.x = 0;
      if (Math.abs(velocity.current.z) < 0.01) velocity.current.z = 0;
    }
    
    // Apply velocity to rigid body
    playerRef.current.setLinvel(
      { 
        x: velocity.current.x, 
        y: currentVelY, // Preserve y velocity for gravity/jumping
        z: velocity.current.z 
      }, 
      true
    );
  });

  // Update enemy store with player position for enemy targeting
  useEffect(() => {
    const enemyStore = useEnemyStore.getState();
    if (enemyStore) {
      // Update on position changes
      enemyStore.updatePlayerPosition({
        x: position[0],
        y: position[1],
        z: position[2]
      });
    }
  }, [position]);

  // Handle player damage
  const takeDamage = (amount: number) => {
    if (isDead) return;

    const currentTime = Date.now();
    if (currentTime - lastTakeDamageTime.current < 100) return;
    lastTakeDamageTime.current = currentTime;

    setHealth((prev) => {
      const newHealth = Math.max(0, prev - amount);
      if (newHealth <= 0) {
        setIsDead(true);
        debugLog("Player died");
      }
      return newHealth;
    });
  };

  // Ground sensor for jumping
  const onSensorCollisionEnter = ({ other }: { other: Collider }) => {
    // Skip if colliding with another sensor
    if (other.isSensor()) return;

    groundSensor.current = true;
    if (isJumping) {
      setIsJumping(false);
      debugLog("Landed on ground");
    }
  };

  const onSensorCollisionExit = ({ other }: { other: Collider }) => {
    // Skip if other object is a sensor
    if (other.isSensor()) return;

    groundSensor.current = false;
  };

  // Weapon state
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("pistol");
  const [ammo, setAmmo] = useState(30);
  const [reloading, setReloading] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [weaponPosition, setWeaponPosition] = useState<
    [number, number, number]
  >([0.3, -0.3, -0.5]);

  // Simplified weapon stats for the demo
  const weaponStats = {
    pistol: {
      damage: 15,
      fireRate: 0.3,
      range: 100,
      reloadTime: 1.5,
      maxAmmo: 12,
    },
    rifle: {
      damage: 25,
      fireRate: 0.1,
      range: 200,
      reloadTime: 2,
      maxAmmo: 30,
    },
    shotgun: {
      damage: 50,
      fireRate: 0.8,
      range: 50,
      reloadTime: 2.5,
      maxAmmo: 8,
    },
  };

  // Handle shooting
  const handleFire = () => {
    if (reloading || ammo <= 0) {
      // Auto reload if no ammo
      if (ammo <= 0) {
        handleReload();
      }
      return;
    }

    // Record that we're shooting
    setShooting(true);

    // Decrease ammo
    setAmmo((prev) => prev - 1);

    // Get current weapon stats
    const currentWeaponData = weaponStats[currentWeapon];

    // Calculate ray from camera
    const rayOrigin = new Vector3();
    const rayDirection = new Vector3();

    if (window.camera) {
      // Get ray start and direction from camera
      window.camera.getWorldPosition(rayOrigin);
      window.camera.getWorldDirection(rayDirection);

      // Set the raycaster
      raycaster.current.set(rayOrigin, rayDirection);

      // Convert to physics ray format
      const rayDirPhysics = {
        x: rayDirection.x,
        y: rayDirection.y,
        z: rayDirection.z,
      };

      // Get ray in the format expected by Rapier physics
      const rayOriginPhysics = { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z };
      const ray = new rapier.Ray(rayOriginPhysics, rayDirPhysics);

      // Cast the ray with proper filter
      const maxToi = currentWeaponData.range; // Maximum range
      const solid = true; // Only report solid objects
      const hit = world.castRayAndGetNormal(
        ray,
        maxToi,
        solid
      );

      // Default end position (if no hit)
      const endPosition: [number, number, number] = [
        rayOrigin.x + rayDirection.x * currentWeaponData.range,
        rayOrigin.y + rayDirection.y * currentWeaponData.range,
        rayOrigin.z + rayDirection.z * currentWeaponData.range,
      ];

      let normalVector: [number, number, number] = [0, 1, 0];

      // If we hit something
      if (hit) {
        const hitPoint = ray.pointAt(hit.toi);
        endPosition[0] = hitPoint.x;
        endPosition[1] = hitPoint.y;
        endPosition[2] = hitPoint.z;

        // Extract normal from the hit
        normalVector = [hit.normal.x, hit.normal.y, hit.normal.z];

        // If the collider has a parent (usually means it's an entity)
        if (hit.collider.parent()) {
          const hitObject = hit.collider.parent().userData;

          // Handle different hit types
          if (hitObject?.type === "enemy") {
            // Enemy hit
            if (hitObject.takeDamage) {
              hitObject.takeDamage(currentWeaponData.damage);
            }
          }
        }

        // Create an impact
        const newImpact: Impact = {
          id: Math.random().toString(36).substr(2, 9),
          position: endPosition,
          normal: normalVector,
          type:
            currentWeapon === "plasmagun"
              ? "plasma"
              : currentWeapon === "shotgun"
              ? "shotgun"
              : "bullet",
          createdAt: Date.now(),
        };

        setImpacts((prev) => [...prev, newImpact]);

        // Clean up old impacts after 2 seconds
        setTimeout(() => {
          setImpacts((prev) => prev.filter((i) => i.id !== newImpact.id));
        }, 2000);
      }

      // Set effects
      setEffects((prev) => ({
        ...prev,
        muzzleFlash: {
          visible: true,
          position: weaponPosition,
        },
        bulletTracer: {
          visible: true,
          start: [
            rayOrigin.x,
            rayOrigin.y,
            rayOrigin.z,
          ],
          end: endPosition,
        },
      }));

      // Hide effects after a short delay
      setTimeout(() => {
        setEffects((prev) => ({
          ...prev,
          muzzleFlash: {
            ...prev.muzzleFlash,
            visible: false,
          },
          bulletTracer: {
            ...prev.bulletTracer,
            visible: false,
          },
        }));

        // Reset shooting state
        setShooting(false);
      }, 100);
    }
  };

  // Handle reloading
  const handleReload = () => {
    if (reloading) return;

    // Start reloading
    setReloading(true);

    // After reload time, restore ammo
    setTimeout(() => {
      const currentWeaponData = weaponStats[currentWeapon];
      setReloading(false);
      setAmmo(currentWeaponData.maxAmmo);
    }, weaponStats[currentWeapon].reloadTime * 1000);
  };

  // Weapon switching
  useFrame(() => {
    // Number keys 1-4 to switch weapons
    if (inputState.keys["1"]) setCurrentWeapon("pistol");
    if (inputState.keys["2"]) setCurrentWeapon("shotgun");
    if (inputState.keys["3"]) setCurrentWeapon("rifle");
    if (inputState.keys["4"]) setCurrentWeapon("plasmagun");
  });

  return (
    <>
      {/* Player rigid body */}
      <RigidBody
        ref={playerRef}
        colliders={false}
        mass={mass}
        type="dynamic"
        position={position}
        enabledRotations={[false, false, false]}
        lockRotations
        userData={{ type: "player", takeDamage }}
      >
        {/* Player collider */}
        <CapsuleCollider args={[0.4, 0.8]} />

        {/* Ground sensor for jump detection */}
        <CuboidCollider
          args={[0.2, 0.1, 0.2]}
          position={[0, -0.9, 0]}
          sensor
          onIntersectionEnter={onSensorCollisionEnter}
          onIntersectionExit={onSensorCollisionExit}
        />
      </RigidBody>

      {/* Player model */}
      <group ref={modelRef} position={position}>
        {/* Simple character model placeholder */}
        <mesh castShadow position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
          <meshStandardMaterial color={isDead ? "red" : "blue"} />
        </mesh>
      </group>

      {/* First person camera */}
      <FirstPersonCamera
        position={[position[0], position[1] + 0.8, position[2]]}
        moveSpeed={moveSpeed}
        ref={cameraRef}
      />

      {/* Weapon model - now passes the player ref to attach to it */}
      <Weapon
        type={currentWeapon}
        position={weaponPosition}
        ammo={ammo}
        maxAmmo={weaponStats[currentWeapon].maxAmmo}
        onFire={handleFire}
        onReload={handleReload}
        playerRef={playerRef}
      />

      {/* Visual effects */}
      {effects.muzzleFlash.visible && <MuzzleFlash />}

      {effects.bulletTracer.visible && (
        <BulletTracer start={effects.bulletTracer.start} end={effects.bulletTracer.end} />
      )}

      {impacts.map((impact) => (
        <ImpactEffect
          key={impact.id}
          position={impact.position}
          normal={impact.normal}
          color={impact.type === 'plasma' ? '#00ffff' : impact.type === 'shotgun' ? '#ff8800' : '#ffff00'}
          size={impact.type === 'shotgun' ? 0.2 : 0.1}
        />
      ))}
    </>
  );
}
