import { PhysicsEntity, System, World } from "../types";

// Define simple collision box type
export type CollisionBox = {
  min: [number, number, number];
  max: [number, number, number];
};

// Generate a collision box from position and a fixed size
function generateCollisionBox(
  position: [number, number, number],
  size: [number, number, number] = [1, 2, 1]
): CollisionBox {
  return {
    min: [position[0] - size[0] / 2, position[1], position[2] - size[2] / 2],
    max: [
      position[0] + size[0] / 2,
      position[1] + size[1],
      position[2] + size[2] / 2,
    ],
  };
}

// Check collision between two boxes
function checkCollision(box1: CollisionBox, box2: CollisionBox): boolean {
  return (
    box1.min[0] <= box2.max[0] &&
    box1.max[0] >= box2.min[0] &&
    box1.min[1] <= box2.max[1] &&
    box1.max[1] >= box2.min[1] &&
    box1.min[2] <= box2.max[2] &&
    box1.max[2] >= box2.min[2]
  );
}

/**
 * System that handles basic physics and collisions
 */
export const physicsSystem: System = {
  name: "physics",
  // Run after player movement to apply physics constraints
  dependencies: ["playerMovement"],

  init(world: World) {
    // Log initial number of physics entities
    const physicsEntitiesCount = world.query<PhysicsEntity>(
      (entity): entity is PhysicsEntity => {
        return Boolean(entity.physics && entity.transform);
      }
    ).length;

    console.log(
      `Physics system initialized. Found ${physicsEntitiesCount} physics entities.`
    );
  },

  update(world: World, delta: number) {
    // Get all entities with physics components
    const physicsEntities = world.query<PhysicsEntity>(
      (entity): entity is PhysicsEntity => {
        return Boolean(entity.physics && entity.transform);
      }
    );

    // Step 1: Apply forces and update velocities
    physicsEntities.forEach((entity) => {
      if (entity.physics.static) return; // Skip static objects

      // Apply gravity
      entity.physics.velocity[1] -= 9.8 * delta;

      // Apply drag/damping to horizontal velocity
      entity.physics.velocity[0] *= 0.9;
      entity.physics.velocity[2] *= 0.9;
    });

    // Step 2: Update positions based on velocities
    physicsEntities.forEach((entity) => {
      if (entity.physics.static) return; // Skip static objects

      // Store previous position for collision resolution
      const prevPosition: [number, number, number] = [
        ...entity.transform.position,
      ];

      // Update position based on velocity
      entity.transform.position[0] += entity.physics.velocity[0] * delta;
      entity.transform.position[1] += entity.physics.velocity[1] * delta;
      entity.transform.position[2] += entity.physics.velocity[2] * delta;

      // Basic ground collision (simplified)
      if (entity.transform.position[1] < 0) {
        entity.transform.position[1] = 0;
        entity.physics.velocity[1] = 0;
      }

      // Generate collision box for this entity
      const entityBox = generateCollisionBox(entity.transform.position);

      // Step 3: Check for collisions with static objects
      physicsEntities.forEach((other) => {
        // Skip self or non-static objects
        if (entity.id === other.id || !other.physics.static) return;

        const otherBox = generateCollisionBox(other.transform.position);

        if (checkCollision(entityBox, otherBox)) {
          // Simple collision response - revert to previous position
          entity.transform.position = prevPosition;

          // Zero out velocity in the direction of collision (simplified)
          entity.physics.velocity = [0, 0, 0];
        }
      });

      // Update the entity in the world
      world.update(entity);
    });
  },

  cleanup(world: World) {
    const physicsEntitiesCount = world.query<PhysicsEntity>(
      (entity): entity is PhysicsEntity => {
        return Boolean(entity.physics && entity.transform);
      }
    ).length;

    console.log(
      `Physics system cleaned up. Found ${physicsEntitiesCount} physics entities.`
    );
  },
};
