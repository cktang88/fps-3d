import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import { Sky, Environment, KeyboardControls } from "@react-three/drei";
import { PlayerController } from "../../player/components/PlayerController";
import { TestLevel } from "../../levels/components/TestLevel";
import { HUD } from "../../ui/components/HUD";

/**
 * Main game canvas component
 */
export function GameCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["w", "ArrowUp"] },
          { name: "backward", keys: ["s", "ArrowDown"] },
          { name: "left", keys: ["a", "ArrowLeft"] },
          { name: "right", keys: ["d", "ArrowRight"] },
          { name: "jump", keys: ["Space"] },
          { name: "sprint", keys: ["ShiftLeft"] },
          { name: "slide", keys: ["ControlLeft"] },
          { name: "shoot", keys: ["Mouse0"] },
          { name: "reload", keys: ["r"] },
        ]}
      >
        <Canvas shadows camera={{ position: [0, 1.6, 0], fov: 75 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {/* Environment */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={2048}
          />
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="forest" />

          {/* Game physics and entities */}
          <Physics debug={false}>
            <Suspense fallback={null}>
              {/* Test level */}
              <TestLevel />

              {/* Player */}
              <PlayerController position={[0, 2, 0]} />
            </Suspense>
          </Physics>
        </Canvas>
        
        {/* HUD overlays the Canvas */}
        <HUD showCrosshair={true} />
      </KeyboardControls>
    </div>
  );
}
