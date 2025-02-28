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

  // Weapon state
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("pistol");
  const [ammo, setAmmo] = useState(10);
  const [maxAmmo] = useState(10);

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

  // Handle weapon firing
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

  // Handle weapon reloading
  const handleReload = () => {
    setAmmo(maxAmmo);
  };

  // Store camera reference for raycasting
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.camera = undefined;
    }
  }, []);

  // Main movement logic
  useFrame((state, delta) => {
    if (!playerRef.current || !rigidBodyRef.current) return;

    // Store camera for raycasting
    if (typeof window !== "undefined") {
      window.camera = state.camera;
    }

    // Get rigid body API
    const rigidBody = rigidBodyRef.current as any;

    // Get input direction
    const { forward, right } = inputState.movement;

    // Handle slide mechanic
    if (
      inputState.keys["ControlLeft"] &&
      isSprinting.current &&
      !isSliding.current
    ) {
      // Start sliding
      isSliding.current = true;
      slideTimer.current = slideDuration;

      // Capture the current movement direction
      slideDirection.current.copy(direction.current);
    }

    // Update slide timer
    if (isSliding.current) {
      slideTimer.current -= delta * 1000; // Convert delta to ms

      if (slideTimer.current <= 0) {
        isSliding.current = false;
      }
    }

    // Handle sprint input
    isSprinting.current = Boolean(inputState.keys["ShiftLeft"]);
    const currentSpeed = isSprinting.current ? speed * sprintMultiplier : speed;

    // Calculate movement based on camera direction
    if (!isSliding.current) {
      direction.current.set(right, 0, forward).normalize();

      // Apply camera rotation to movement direction
      direction.current.applyAxisAngle(
        new Vector3(0, 1, 0),
        playerRotation.current
      );
    }

    // Apply movement to rigid body
    const currentVel = rigidBody.linvel();

    if (isSliding.current) {
      // Apply sliding force
      rigidBody.setLinvel({
        x: slideDirection.current.x * slideForce,
        y: currentVel.y,
        z: slideDirection.current.z * slideForce,
      });
    } else {
      // Apply normal movement
      const moveImpulse = direction.current.multiplyScalar(
        currentSpeed * delta
      );

      rigidBody.setLinvel({
        x: moveImpulse.x * 50,
        y: currentVel.y,
        z: moveImpulse.z * 50,
      });
    }

    // Handle jumping
    if (inputState.buttons.jump && !isJumping.current) {
      // Cast a ray downward to check if player is grounded
      const rayOrigin = playerRef.current.position.clone();
      const rayDir = { x: 0, y: -1, z: 0 };

      // Create ray and cast it
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const hit = world.castRay(ray, 1.1, true);

      if (hit) {
        rigidBody.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
        isJumping.current = true;

        // Reset jumping state after a short delay
        setTimeout(() => {
          isJumping.current = false;
        }, 500);
      }
    }

    // Update player rotation from camera
    playerRotation.current = state.camera.rotation.y;
  });

  // Calculate weapon position
  const weaponPosition: [number, number, number] = [
    0.25,
    isSliding.current ? -0.4 : -0.25,
    -0.5,
  ];

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      enabledRotations={[false, false, false]}
      type="dynamic"
      colliders="hull"
      friction={0.1}
      linearDamping={0.5}
    >
      <group ref={playerRef}>
        <FirstPersonCamera
          position={[0, isSliding.current ? 0.8 : 1.6, 0]}
          headBobEnabled={!isSliding.current}
          headBobSpeed={isSprinting.current ? 15 : 10}
          headBobAmount={isSprinting.current ? 0.08 : 0.05}
        />

        {/* Weapon */}
        <Weapon
          type={currentWeapon}
          position={weaponPosition}
          ammo={ammo}
          maxAmmo={maxAmmo}
          onFire={handleFire}
          onReload={handleReload}
        />

        {/* Visual effects */}
        {effects.muzzleFlash && (
          <MuzzleFlash
            position={[
              weaponPosition[0] + 0.05,
              weaponPosition[1] + 0.05,
              weaponPosition[2] - 0.3,
            ]}
            scale={0.5}
          />
        )}

        {effects.tracers.map((tracer) => (
          <BulletTracer
            key={tracer.id}
            start={tracer.start}
            end={tracer.end}
            speed={200}
          />
        ))}

        {effects.impacts.map((impact) => (
          <ImpactEffect
            key={impact.id}
            position={impact.position}
            type={impact.type}
          />
        ))}

        {/* Player model - invisible in first person */}
        <mesh visible={false}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshBasicMaterial color="blue" wireframe />
        </mesh>
      </group>
    </RigidBody>
  );
}
