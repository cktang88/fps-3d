import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import { Sky, Environment, KeyboardControls, Stats, OrbitControls } from "@react-three/drei";
import { PlayerController } from "../../player/components/PlayerController";
import { TestLevel } from "../../levels/components/TestLevel";
import { EnhancedHUD } from "../../ui/components/EnhancedHUD";
import { Minimap } from "../../ui/components/Minimap";

/**
 * Main game canvas component
 */
export function GameCanvas() {
  // Define specific keyboard control mapping to make movement reliable
  const keyboardMap = [
    { name: "forward", keys: ["w", "ArrowUp"] },
    { name: "backward", keys: ["s", "ArrowDown"] },
    { name: "left", keys: ["a", "ArrowLeft"] },
    { name: "right", keys: ["d", "ArrowRight"] },
    { name: "jump", keys: ["Space"] },
    { name: "sprint", keys: ["ShiftLeft", "Shift"] },
    { name: "slide", keys: ["ControlLeft", "Control"] },
    { name: "shoot", keys: ["Mouse0"] },
    { name: "reload", keys: ["r"] },
  ];

  return (
    <div className="absolute inset-0 w-full h-full">
      <KeyboardControls map={keyboardMap}>
        <Canvas 
          shadows 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          camera={{ position: [0, 1.6, 0], fov: 75 }}
        >
          {/* Performance monitor */}
          <Stats />
          
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

        {/* UI Elements */}
        <div className="pointer-events-none">
          <EnhancedHUD />
          <div className="absolute top-6 right-6 w-40 h-40">
            <Minimap size={200} />
          </div>
          
          {/* Debug tools - only in development */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="absolute top-16 left-2 bg-black bg-opacity-70 text-white p-2 text-xs font-mono">
              <div>WASD = Move, Mouse = Look</div>
              <div>Space = Jump, Shift = Sprint</div>
              <div>Left Click = Shoot, R = Reload</div>
            </div>
          )}
        </div>
      </KeyboardControls>
    </div>
  );
}
