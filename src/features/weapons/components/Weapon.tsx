import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import { Vector3, Group } from "three";
import { inputState } from "../../core/ecs/systems/inputSystem";

export type WeaponType = "pistol" | "shotgun" | "rifle" | "plasmagun";

export interface WeaponProps {
  type?: WeaponType;
  position?: [number, number, number];
  ammo?: number;
  maxAmmo?: number;
  onFire?: () => void;
  onReload?: () => void;
}

export function Weapon({
  type = "pistol",
  position = [0.25, -0.25, -0.5],
  ammo = 10,
  maxAmmo = 10,
  onFire,
  onReload,
}: WeaponProps) {
  const weaponRef = useRef<Group>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [lastFireTime, setLastFireTime] = useState(0);

  // Weapon specs based on type
  const weaponSpecs = {
    pistol: {
      fireRate: 0.5, // shots per second
      damage: 15,
      reloadTime: 1, // seconds
      model: <PistolModel />,
    },
    shotgun: {
      fireRate: 1.2,
      damage: 6, // per pellet
      reloadTime: 2,
      model: <ShotgunModel />,
    },
    rifle: {
      fireRate: 0.1,
      damage: 20,
      reloadTime: 1.5,
      model: <RifleModel />,
    },
    plasmagun: {
      fireRate: 0.2,
      damage: 30,
      reloadTime: 3,
      model: <PlasmagunModel />,
    },
  };

  // Get current weapon specs
  const specs = weaponSpecs[type];

  // Springs for weapon animations
  const [springs, api] = useSpring(() => ({
    position: position,
    rotation: [0, 0, 0],
    config: { tension: 100, friction: 15 },
  }));

  // Handle weapon movement and firing
  useFrame(() => {
    if (!weaponRef.current) return;

    // Weapon sway based on movement
    const { forward, right } = inputState.movement;
    if (forward !== 0 || right !== 0) {
      const swayX = Math.sin(Date.now() * 0.01) * 0.02;
      const swayY = Math.cos(Date.now() * 0.01) * 0.01;

      api.start({
        position: [position[0] + swayX, position[1] + swayY, position[2]],
      });
    } else {
      api.start({
        position: position,
      });
    }

    // Handle firing
    if (
      inputState.buttons.fire &&
      !isReloading &&
      ammo > 0 &&
      Date.now() - lastFireTime > specs.fireRate * 1000
    ) {
      // Play fire animation
      api.start({
        position: [position[0], position[1] + 0.1, position[2]],
        rotation: [-0.2, 0, 0],
        config: { tension: 800, friction: 15 },
        onRest: () => {
          api.start({
            position: position,
            rotation: [0, 0, 0],
            config: { tension: 100, friction: 15 },
          });
        },
      });

      // Call fire callback
      onFire?.();

      // Update last fire time
      setLastFireTime(Date.now());
    }

    // Handle reload
    if (inputState.keys["r"] && !isReloading && ammo < maxAmmo) {
      setIsReloading(true);

      // Play reload animation
      api.start({
        position: [position[0], position[1] - 0.2, position[2]],
        rotation: [0.5, 0, 0],
        config: { tension: 100, friction: 20 },
      });

      // Delay for reload time
      setTimeout(() => {
        api.start({
          position: position,
          rotation: [0, 0, 0],
          config: { tension: 100, friction: 15 },
        });

        onReload?.();
        setIsReloading(false);
      }, specs.reloadTime * 1000);
    }
  });

  return (
    <a.group
      ref={weaponRef}
      position={springs.position as unknown as Vector3}
      rotation={springs.rotation as unknown as [number, number, number]}
    >
      {specs.model}
    </a.group>
  );
}

// Simple weapon models
function PistolModel() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.35]} />
        <meshStandardMaterial color="#333" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[0.08, 0.1, 0.25]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.2]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ShotgunModel() {
  return (
    <group>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial color="#5a3b1c" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.1, -0.1]}>
        <boxGeometry args={[0.08, 0.15, 0.3]} />
        <meshStandardMaterial color="#493519" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function RifleModel() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.8]} />
        <meshStandardMaterial color="#333" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.1, -0.15]}>
        <boxGeometry args={[0.07, 0.15, 0.3]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function PlasmagunModel() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.6]} />
        <meshStandardMaterial color="#2a4a7a" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[0.1, 0.1, 0.2]} />
        <meshStandardMaterial
          color="#4a8afa"
          emissive="#2a5afa"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.06, 0.08, 0.4, 8]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
