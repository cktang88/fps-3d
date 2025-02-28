import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3, Euler } from "three";
import { inputState } from "../../core/ecs/systems/inputSystem";

interface FirstPersonCameraProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  lockPointer?: boolean;
  lookSpeed?: number;
  headBobEnabled?: boolean;
  headBobSpeed?: number;
  headBobAmount?: number;
}

export function FirstPersonCamera({
  position = [0, 1.6, 0],
  rotation = [0, 0, 0],
  lockPointer = true,
  lookSpeed = 0.003,
  headBobEnabled = true,
  headBobSpeed = 10,
  headBobAmount = 0.05,
}: FirstPersonCameraProps) {
  const { camera, gl } = useThree();
  const canvasRef = useRef<HTMLCanvasElement>(gl.domElement);

  // Camera state
  const cameraPosition = useRef(new Vector3(...position));
  const cameraRotation = useRef(new Euler(...rotation));
  const headBobPhase = useRef(0);

  // Pointer lock handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !lockPointer) return;

    const requestPointerLock = () => {
      canvas.requestPointerLock();
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      console.log(`Pointer is ${isLocked ? "locked" : "unlocked"}`);
    };

    canvas.addEventListener("click", requestPointerLock);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      canvas.removeEventListener("click", requestPointerLock);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
    };
  }, [lockPointer]);

  // Update camera every frame
  useFrame((_, delta) => {
    // Update rotation based on mouse movement
    if (document.pointerLockElement === canvasRef.current) {
      cameraRotation.current.y -= inputState.mouse.deltaX * lookSpeed;
      cameraRotation.current.x -= inputState.mouse.deltaY * lookSpeed;

      // Clamp vertical rotation (prevent flipping over)
      cameraRotation.current.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, cameraRotation.current.x)
      );
    }

    // Apply head bobbing if enabled and player is moving
    const isMoving =
      inputState.movement.forward !== 0 || inputState.movement.right !== 0;
    if (headBobEnabled && isMoving) {
      headBobPhase.current += delta * headBobSpeed;

      const headBobY = Math.sin(headBobPhase.current) * headBobAmount;
      cameraPosition.current.y = position[1] + headBobY;
    } else {
      // Reset to default height when not moving
      cameraPosition.current.y = position[1];
    }

    // Update camera position and rotation
    camera.position.copy(cameraPosition.current);
    camera.rotation.x = cameraRotation.current.x;
    camera.rotation.y = cameraRotation.current.y;
    camera.rotation.z = cameraRotation.current.z;
  });

  return null;
}
