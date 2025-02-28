import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, SpotLight } from "@react-three/drei";
import { Object3D, Vector3 } from "three";

// Types for different effects
interface MuzzleFlashProps {
  position: [number, number, number];
  direction?: [number, number, number];
  scale?: number;
  duration?: number;
}

interface ImpactProps {
  position: [number, number, number];
  normal?: [number, number, number];
  type?: "concrete" | "metal" | "dirt" | "enemy";
  scale?: number;
}

interface TracerProps {
  start: [number, number, number];
  end: [number, number, number];
  speed?: number;
  thickness?: number;
}

// Muzzle flash effect
export function MuzzleFlash({
  position,
  direction = [0, 0, 1],
  scale = 1,
  duration = 100,
}: MuzzleFlashProps) {
  const [visible, setVisible] = useState(true);
  const muzzleRef = useRef<Object3D>(null);

  // Hide the flash after duration
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [duration]);

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      {/* Center flash */}
      <Sphere ref={muzzleRef} args={[0.05, 8, 8]} position={[0, 0, 0.1]}>
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.8} />
      </Sphere>

      {/* Glow effect */}
      <SpotLight
        position={[0, 0, 0]}
        distance={2}
        angle={0.5}
        attenuation={5}
        anglePower={5}
        intensity={5}
        color="#ffaa44"
      />
    </group>
  );
}

// Impact effect (bullet hit)
export function ImpactEffect({
  position,
  normal = [0, 0, 1],
  type = "concrete",
  scale = 1,
}: ImpactProps) {
  const [visible, setVisible] = useState(true);
  const impactRef = useRef<Object3D>(null);

  // Define colors and sizes based on surface type
  const colors = {
    concrete: "#aaaaaa",
    metal: "#8888ff",
    dirt: "#8b4513",
    enemy: "#ff0000",
  };

  // Hide effect after a short duration
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setVisible(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Particles flying outward animation
  useFrame(() => {
    if (!impactRef.current) return;

    // Scale down over time for fade-out effect
    impactRef.current.scale.multiplyScalar(0.95);
  });

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      {/* Impact mark */}
      <Sphere ref={impactRef} args={[0.1, 8, 8]}>
        <meshBasicMaterial color={colors[type]} transparent opacity={0.7} />
      </Sphere>

      {/* Particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const particleDir = new Vector3(
          Math.sin(i * Math.PI * 0.25) + (Math.random() * 0.4 - 0.2),
          Math.cos(i * Math.PI * 0.25) + (Math.random() * 0.4 - 0.2),
          0.5 + Math.random() * 0.5
        );

        return (
          <ExplosionParticle
            key={i}
            position={[0, 0, 0]}
            direction={particleDir.toArray() as [number, number, number]}
            color={colors[type]}
          />
        );
      })}
    </group>
  );
}

// Individual explosion particle
function ExplosionParticle({
  position,
  direction,
  color,
}: {
  position: [number, number, number];
  direction: [number, number, number];
  color: string;
}) {
  const particleRef = useRef<Object3D>(null);
  const speed = useRef(0.05 + Math.random() * 0.1);
  const [visible, setVisible] = useState(true);

  // Animate particle movement
  useFrame(() => {
    if (!particleRef.current) return;

    // Move in direction
    particleRef.current.position.x += direction[0] * speed.current;
    particleRef.current.position.y += direction[1] * speed.current;
    particleRef.current.position.z += direction[2] * speed.current;

    // Slow down over time
    speed.current *= 0.92;

    // Shrink
    particleRef.current.scale.multiplyScalar(0.95);

    // Remove if too small
    if (particleRef.current.scale.x < 0.05) {
      setVisible(false);
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={particleRef} position={position}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Bullet tracer effect
export function BulletTracer({
  start,
  end,
  speed = 100,
  thickness = 0.02,
}: TracerProps) {
  const tracerRef = useRef<Object3D>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  // Animate tracer movement
  useFrame((_, delta) => {
    if (!tracerRef.current) return;

    // Update progress along trajectory
    const newProgress = Math.min(progress + speed * delta, 1);
    setProgress(newProgress);

    if (newProgress >= 1) {
      setTimeout(() => setVisible(false), 100);
    }

    // Calculate current position based on progress
    const currentPos = [
      start[0] + (end[0] - start[0]) * newProgress,
      start[1] + (end[1] - start[1]) * newProgress,
      start[2] + (end[2] - start[2]) * newProgress,
    ];

    tracerRef.current.position.set(currentPos[0], currentPos[1], currentPos[2]);
  });

  if (!visible) return null;

  // Calculate distance and direction
  const distance = Math.sqrt(
    Math.pow(end[0] - start[0], 2) +
      Math.pow(end[1] - start[1], 2) +
      Math.pow(end[2] - start[2], 2)
  );

  // Calculate rotation to point along trajectory
  const dirVector = new Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).normalize();

  return (
    <group ref={tracerRef} position={start}>
      {/* Tracer streak */}
      <mesh rotation={[0, 0, 0]} scale={[thickness, thickness, distance * 0.3]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial color="#ffff88" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
