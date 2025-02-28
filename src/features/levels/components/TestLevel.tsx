import { RigidBody } from "@react-three/rapier";
import { EnemySpawner } from "../../enemies/components/EnemySpawner";

export function TestLevel() {
  // Define spawn points around the level
  const spawnPoints: [number, number, number][] = [
    [-15, 1, -15],
    [15, 1, -15],
    [15, 1, 15],
    [-15, 1, 15],
    [0, 1, -20],
    [0, 1, 20],
    [-20, 1, 0],
    [20, 1, 0],
  ];

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
        <mesh position={[8, 1, 5]} receiveShadow castShadow>
          <boxGeometry args={[4, 2, 4]} />
          <meshStandardMaterial color="#5555aa" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[0, 1, 10]} receiveShadow castShadow>
          <boxGeometry args={[8, 2, 2]} />
          <meshStandardMaterial color="#aa5555" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[0, 1, -10]} receiveShadow castShadow>
          <boxGeometry args={[8, 2, 2]} />
          <meshStandardMaterial color="#aa5555" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Platforms */}
      <RigidBody type="fixed">
        <mesh position={[-15, 2, -15]} receiveShadow castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#55aa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[15, 2, -15]} receiveShadow castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#55aa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[15, 2, 15]} receiveShadow castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#55aa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        <mesh position={[-15, 2, 15]} receiveShadow castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#55aa55" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Enemy Spawner */}
      <EnemySpawner 
        maxEnemies={10}
        spawnPoints={spawnPoints}
        spawnRate={6}
        difficulty={3}
        active={true}
      />
    </>
  );
}
