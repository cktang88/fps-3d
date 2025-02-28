import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { Vector3, Euler, MathUtils } from "three";
import { PointerLockControls } from "@react-three/drei";
import { inputState } from "../../core/ecs/systems/inputSystem";

// Log debugging information
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log("[Camera]", ...args);
  }
}

interface FirstPersonCameraProps {
  position?: [number, number, number];
  height?: number;
  moveSpeed?: number;
  lookSpeed?: number;
  headBobEnabled?: boolean;
  headBobSpeed?: number;
  headBobAmount?: number;
}

export const FirstPersonCamera = forwardRef(({
  position = [0, 1.6, 0],
  height = 1.6,
  moveSpeed = 5,
  lookSpeed = 0.5,
  headBobEnabled = true,
  headBobSpeed = 10,
  headBobAmount = 0.05,
}: FirstPersonCameraProps, ref) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const isLocked = useRef(false);
  const headBobPhase = useRef(0);
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());

  // Expose controls to parent component through ref
  useImperativeHandle(ref, () => ({
    getControls: () => controlsRef.current,
    getLocked: () => isLocked.current,
    getPosition: () => camera.position.clone(),
    setPosition: (newPos: [number, number, number]) => {
      camera.position.set(...newPos);
    },
    moveForward: (distance: number) => {
      if (controlsRef.current) {
        controlsRef.current.moveForward(distance);
      }
    },
    moveRight: (distance: number) => {
      if (controlsRef.current) {
        controlsRef.current.moveRight(distance);
      }
    }
  }), [controlsRef.current, camera.position]);

  // Initialize camera position
  useEffect(() => {
    camera.position.set(...position);
    log("Camera initialized at", position);
    
    // Store camera in window for access by other components
    window.camera = camera;
    
    return () => {
      window.camera = undefined;
    };
  }, [camera, position]);

  // Handle pointer lock events
  useEffect(() => {
    // Set up event listeners
    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
      log("Pointer lock state changed:", isLocked.current);
    };
    
    const onLockError = () => {
      log("Pointer lock error");
    };
    
    // Attempt to lock when canvas is clicked
    const onClick = () => {
      if (!isLocked.current) {
        log("Requesting pointer lock");
        gl.domElement.requestPointerLock();
      }
    };
    
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    gl.domElement.addEventListener('click', onClick);
    
    // Cleanup
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [gl]);

  // Handle camera movement each frame
  useFrame((_, delta) => {
    if (!isLocked.current || !controlsRef.current) {
      return;
    }
    
    // Get movement input from input system
    const { forward, right } = inputState.movement;
    
    // Skip if no movement
    if (forward === 0 && right === 0) {
      return;
    }
    
    // Get camera direction
    direction.current.set(0, 0, 0);
    
    // Forward/backward movement
    if (forward !== 0) {
      direction.current.z = forward;
    }
    
    // Left/right movement
    if (right !== 0) {
      direction.current.x = right;
    }
    
    // Normalize if moving in both directions
    if (direction.current.length() > 1) {
      direction.current.normalize();
    }
    
    // Scale by speed and delta time
    const actualMoveSpeed = moveSpeed * delta;
    direction.current.multiplyScalar(actualMoveSpeed);
    
    // Apply direction to controls
    controlsRef.current.moveForward(-direction.current.z);
    controlsRef.current.moveRight(direction.current.x);
    
    // Apply head bobbing if enabled and moving
    if (headBobEnabled && (forward !== 0 || right !== 0)) {
      headBobPhase.current += delta * headBobSpeed;
      const headBobY = Math.sin(headBobPhase.current) * headBobAmount;
      const currentPos = camera.position.clone();
      currentPos.y = position[1] + headBobY;
      camera.position.copy(currentPos);
    }
    
    // Log camera position occasionally for debugging
    if (DEBUG && Math.random() < 0.01) {
      const pos = camera.position;
      log(`Position: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`);
    }
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
    />
  );
});
