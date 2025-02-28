import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Vector3, Group, Raycaster, Vector2, Camera } from "three";
import { useRapier, RigidBody } from "@react-three/rapier";
import { inputState } from "../../core/ecs/systems/inputSystem";
import { FirstPersonCamera } from "./FirstPersonCamera";
import { Weapon, WeaponType } from "../../weapons/components/Weapon";
import {
  MuzzleFlash,
  BulletTracer,
  ImpactEffect,
} from "../../weapons/components/ShootingEffects";
import { usePlayerStore } from "../stores/playerStore";

// Extend Window interface to store camera reference
declare global {
  interface Window {
    camera: Camera | undefined;
  }
}

interface PlayerControllerProps {
  position?: [number, number, number];
  speed?: number;
  jumpForce?: number;
  sprintMultiplier?: number;
  slideForce?: number;
  slideDuration?: number;
}

export function PlayerController({
  position = [0, 1, 0],
  speed = 5,
  jumpForce = 5,
  sprintMultiplier = 1.5,
  slideForce = 8,
  slideDuration = 600,
}: PlayerControllerProps) {
  const playerRef = useRef<Group>(null);
  const rigidBodyRef = useRef(null);
  const { rapier, world } = useRapier();

  // Player state
  const isJumping = useRef(false);
  const isSprinting = useRef(false);
  const isSliding = useRef(false);
  const slideTimer = useRef(0);
  const slideDirection = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const playerRotation = useRef(0);

  // Player health and combat stats
  const health = usePlayerStore((state) => state.health);
  const isDead = usePlayerStore((state) => state.isDead);
  const takeDamage = usePlayerStore((state) => state.takeDamage);
  const setHealth = usePlayerStore((state) => state.setHealth);
  const isInvulnerable = usePlayerStore((state) => state.isInvulnerable);
  const invulnerabilityTimer = usePlayerStore((state) => state.invulnerabilityTimer);
  const setIsInvulnerable = usePlayerStore((state) => state.setIsInvulnerable);
  const setInvulnerabilityTimer = usePlayerStore((state) => state.setInvulnerabilityTimer);
  const damageTaken = usePlayerStore((state) => state.damageTaken);
  const setDamageTaken = usePlayerStore((state) => state.setDamageTaken);

  // Weapon state
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("pistol");
  const ammo = usePlayerStore((state) => state.ammo);
  const setAmmo = usePlayerStore((state) => state.setAmmo);
  const reloading = usePlayerStore((state) => state.reloading);
  const setReloading = usePlayerStore((state) => state.setReloading);

  // Visual effects state
  const [effects, setEffects] = useState<{
    muzzleFlash: boolean;
    tracers: Array<{
      id: number;
      start: [number, number, number];
      end: [number, number, number];
    }>;
    impacts: Array<{
      id: number;
      position: [number, number, number];
      type: "concrete" | "metal" | "dirt" | "enemy";
    }>;
  }>({
    muzzleFlash: false,
    tracers: [],
    impacts: [],
  });

  // Track effect IDs
  const nextEffectId = useRef(0);

  // Cleanup effects after they expire
  useEffect(() => {
    if (effects.muzzleFlash) {
      const timer = setTimeout(() => {
        setEffects((prev) => ({ ...prev, muzzleFlash: false }));
      }, 100); // Match duration in MuzzleFlash component

      return () => clearTimeout(timer);
    }
  }, [effects.muzzleFlash]);

  // Cleanup damage indicator
  useEffect(() => {
    if (damageTaken) {
      const timer = setTimeout(() => {
        setDamageTaken(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [damageTaken]);

  // Raycaster for shooting
  const raycaster = useRef(new Raycaster());
  const screenCenter = useRef(new Vector2(0, 0));

  // Weapon switching
  useFrame(() => {
    // Number keys 1-4 to switch weapons
    if (inputState.keys["1"]) setCurrentWeapon("pistol");
    if (inputState.keys["2"]) setCurrentWeapon("shotgun");
    if (inputState.keys["3"]) setCurrentWeapon("rifle");
    if (inputState.keys["4"]) setCurrentWeapon("plasmagun");
  });

  // Handle player shooting
  const handleFire = () => {
    if (ammo > 0 && window.camera) {
      setAmmo(ammo - 1);

      // Show muzzle flash
      setEffects((prev) => ({ ...prev, muzzleFlash: true }));

      // Cast ray from camera direction
      raycaster.current.setFromCamera(screenCenter.current, window.camera);

      // Calculate raycast range based on weapon
      const range = currentWeapon === "shotgun" ? 20 : 100;

      // Get ray origin and direction
      const rayOrigin = raycaster.current.ray.origin.clone();
      const rayDirection = raycaster.current.ray.direction.clone();

      // Create raycast for physics
      const rayDirPhysics = {
        x: rayDirection.x,
        y: rayDirection.y,
        z: rayDirection.z,
      };

      const ray = new rapier.Ray(rayOrigin, rayDirPhysics);
      const hit = world.castRay(ray, range, true);

      // Default end position (if no hit)
      const endPosition: [number, number, number] = [
        rayOrigin.x + rayDirection.x * range,
        rayOrigin.y + rayDirection.y * range,
        rayOrigin.z + rayDirection.z * range,
      ];

      if (hit) {
        // Get hit position
        const hitDistance = hit.toi ?? range;
        endPosition[0] = rayOrigin.x + rayDirection.x * hitDistance;
        endPosition[1] = rayOrigin.y + rayDirection.y * hitDistance;
        endPosition[2] = rayOrigin.z + rayDirection.z * hitDistance;

        // Determine hit surface type
        const hitType: "concrete" | "metal" | "dirt" | "enemy" = "concrete";

        // Add impact effect
        setEffects((prev) => ({
          ...prev,
          impacts: [
            ...prev.impacts,
            {
              id: nextEffectId.current++,
              position: [...endPosition] as [number, number, number],
              type: hitType,
            },
          ],
        }));

        // TODO: Apply damage if we hit an enemy
      }

      // Get weapon position (muzzle)
      const weaponPos: [number, number, number] = [
        rayOrigin.x + 0.25,
        rayOrigin.y - 0.25,
        rayOrigin.z - 0.3,
      ];

      // Add tracer effect
      setEffects((prev) => ({
        ...prev,
        tracers: [
          ...prev.tracers,
          {
            id: nextEffectId.current++,
            start: weaponPos,
            end: endPosition,
          },
        ],
      }));

      // Remove expired effects after a delay
      setTimeout(() => {
        setEffects((prev) => ({
          ...prev,
          tracers: prev.tracers.filter(
            (t) => t.id !== nextEffectId.current - 1
          ),
          impacts: prev.impacts.filter(
            (i) => i.id !== nextEffectId.current - 1
          ),
        }));
      }, 2000);
    }
  };

  // Handle player reloading
  const handleReload = () => {
    setReloading(true);
    
    // Reload after delay
    setTimeout(() => {
      setAmmo(10); // Set to full magazine
      setReloading(false);
    }, 2000);
  };

  // Handle player movement
  useFrame((state, delta) => {
    if (!rigidBodyRef.current || isDead) return;

    // Store camera for raycasting
    if (typeof window !== "undefined") {
      window.camera = state.camera;
    }

    const { forward, right } = inputState.movement;

    // Calculate move direction from input
    direction.current.set(
      right,
      0,
      forward
    ).normalize().multiplyScalar(isSprinting.current ? speed * sprintMultiplier : speed);

    // Rotate direction based on camera angle
    playerRotation.current = state.camera.rotation.y;
    direction.current.applyAxisAngle(new Vector3(0, 1, 0), playerRotation.current);

    // Move player
    if (isSliding.current) {
      // During slide, keep sliding in the slide direction with decay
      direction.current.copy(slideDirection.current);
      slideTimer.current -= delta * 1000;

      if (slideTimer.current <= 0) {
        isSliding.current = false;
      }
    } else {
      // Normal movement
      if (inputState.buttons.slide && (forward !== 0 || right !== 0) && !isJumping.current) {
        // Start sliding
        isSliding.current = true;
        slideTimer.current = slideDuration;
        slideDirection.current.copy(direction.current).normalize().multiplyScalar(slideForce);
      }
    }

    // Update sprinting state
    isSprinting.current = inputState.buttons.sprint;

    // Apply movement - use higher values to increase responsiveness
    const rigidBody = rigidBodyRef.current as any;
    const linvel = rigidBody.linvel();
    
    // Move faster for better responsiveness
    const movementMultiplier = 30; 
    
    rigidBody.setLinvel({
      x: direction.current.x * movementMultiplier,
      y: linvel.y, // Keep current y velocity (for jumping/falling)
      z: direction.current.z * movementMultiplier,
    }, true);

    // Jumping
    if (inputState.buttons.jump && !isJumping.current) {
      const rayFrom = {
        x: rigidBody.translation().x,
        y: rigidBody.translation().y - 0.05,
        z: rigidBody.translation().z,
      };
      const rayDir = { x: 0, y: -1, z: 0 };
      const ray = new rapier.Ray(rayFrom, rayDir);
      const hit = world.castRay(ray, 1.1, true);

      if (hit) {
        isJumping.current = true;
        rigidBody.setLinvel({
          x: linvel.x,
          y: jumpForce,
          z: linvel.z,
        }, true);

        // Reset jumping state when landing
        setTimeout(() => {
          isJumping.current = false;
        }, 500);
      }
    }
  });

  // Handle collision detection
  const handleCollision = (e: any) => {
    // Check if collision with enemy or enemy projectile
    if (e.other.rigidBodyObject?.name === 'enemy-projectile') {
      takeDamage(10); // Default damage amount for enemy projectile
    } else if (e.other.rigidBodyObject?.name === 'enemy') {
      takeDamage(5); // Default damage amount for enemy contact
    }
  };

  return (
    <group ref={playerRef}>
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        enabledRotations={[false, false, false]}
        linearDamping={isSliding.current ? 0.5 : 5}
        onCollisionEnter={handleCollision}
        name="player"
      >
        {/* Player collision shape */}
        <mesh visible={false}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshBasicMaterial wireframe color="red" />
        </mesh>
      </RigidBody>

      {/* Camera */}
      <FirstPersonCamera />

      {/* Weapon model - positioned to be more visible */}
      <Weapon
        type={currentWeapon}
        position={[0.3, -0.2, -0.4]} 
        ammo={ammo}
        maxAmmo={10}
        onFire={handleFire}
        onReload={handleReload}
      />

      {/* Visual effects */}
      {effects.muzzleFlash && <MuzzleFlash />}
      
      {effects.tracers.map((tracer) => (
        <BulletTracer
          key={tracer.id}
          start={tracer.start}
          end={tracer.end}
        />
      ))}
      
      {effects.impacts.map((impact) => (
        <ImpactEffect
          key={impact.id}
          position={impact.position}
          type={impact.type}
        />
      ))}

      {/* Damage indicator overlay */}
      {damageTaken && (
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial color="red" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
