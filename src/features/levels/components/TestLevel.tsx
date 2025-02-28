import { RigidBody } from "@react-three/rapier";

export function TestLevel() {
  return (
    <>
      {/* Floor */}
      <RigidBody type="fixed" friction={0.7}>
        <mesh
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#555" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls around the level */}
      <RigidBody type="fixed">
        <mesh position={[0, 2, -25]} receiveShadow castShadow>
          <boxGeometry args={[50, 5, 1]} />
          <meshStandardMaterial color="#775555" roughness={0.5} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[0, 2, 25]} receiveShadow castShadow>
          <boxGeometry args={[50, 5, 1]} />
          <meshStandardMaterial color="#775555" roughness={0.5} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[-25, 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1, 5, 50]} />
          <meshStandardMaterial color="#557755" roughness={0.5} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[25, 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1, 5, 50]} />
          <meshStandardMaterial color="#557755" roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Obstacles */}
      <RigidBody type="fixed">
        <mesh position={[-8, 1, -5]} receiveShadow castShadow>
          <boxGeometry args={[4, 2, 4]} />
          <meshStandardMaterial color="#5555aa" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[10, 1, -12]} receiveShadow castShadow>
          <boxGeometry args={[6, 2, 2]} />
          <meshStandardMaterial color="#aa5555" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[5, 1, 8]} receiveShadow castShadow>
          <boxGeometry args={[3, 2, 3]} />
          <meshStandardMaterial color="#55aa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Jumping platform */}
      <RigidBody type="fixed">
        <mesh position={[-12, 0.5, 12]} receiveShadow castShadow>
          <boxGeometry args={[4, 1, 4]} />
          <meshStandardMaterial color="#aaaa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[-12, 2, 18]} receiveShadow castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#aaaa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Ramps for sliding test */}
      <RigidBody type="fixed" rotation={[-Math.PI / 12, 0, 0]}>
        <mesh position={[0, 0.5, -15]} receiveShadow castShadow>
          <boxGeometry args={[10, 0.5, 8]} />
          <meshStandardMaterial color="#aa55aa" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Pillars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <RigidBody key={i} type="fixed">
          <mesh
            position={[
              Math.sin(i * Math.PI * 0.4) * 15,
              3,
              Math.cos(i * Math.PI * 0.4) * 15,
            ]}
            receiveShadow
            castShadow
          >
            <cylinderGeometry args={[1, 1, 6, 16]} />
            <meshStandardMaterial
              color={`hsl(${i * 50}, 70%, 60%)`}
              roughness={0.3}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
