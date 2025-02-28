import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stats } from "@react-three/drei";
import { useGameStore } from "../../stores/gameStore";

/**
 * Scene component that handles rendering entities
 */
const Scene: React.FC = () => {
  const ecs = useGameStore((state) => state.ecs);
  const showDebug = useGameStore((state) => state.showDebug);
  const gamePaused = useGameStore((state) => state.gamePaused);

  // Update scene logic
  useFrame((state, delta) => {
    // Delta time is handled by the game loop, no need to do anything here
  });

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Debug helpers */}
      {showDebug && (
        <>
          <gridHelper args={[10, 10]} />
          <axesHelper args={[5]} />
        </>
      )}

      {/* Example entity - can be replaced with dynamic rendering of entities */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </>
  );
};

/**
 * Main render system component
 */
export const RenderSystem: React.FC = () => {
  const showDebug = useGameStore((state) => state.showDebug);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputManager = useGameStore((state) => state.inputManager);

  // Set up pointer lock when canvas is clicked
  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas && inputManager) {
      const handleClick = () => {
        inputManager.lockPointer(canvas);
      };

      canvas.addEventListener("click", handleClick);

      return () => {
        canvas.removeEventListener("click", handleClick);
      };
    }
  }, [canvasRef, inputManager]);

  return (
    <div className="game-container">
      <Canvas
        ref={canvasRef}
        shadows
        gl={{ antialias: true }}
        dpr={window.devicePixelRatio}
      >
        <Scene />

        {/* Debug controls */}
        {showDebug && (
          <>
            <Stats />
            <OrbitControls />
          </>
        )}
      </Canvas>
    </div>
  );
};
