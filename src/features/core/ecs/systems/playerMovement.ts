import { PlayerEntity, System, World } from "../types";
import { inputState } from "./inputSystem";

/**
 * System that handles player movement
 */
export const playerMovementSystem: System = {
  name: "playerMovement",
  // Define dependencies to ensure input system runs first
  dependencies: ["input"],

  init(world: World) {
    // Log initial number of player entities
    const playerCount = world.query<PlayerEntity>(
      (entity): entity is PlayerEntity => {
        return Boolean(entity.player && entity.transform && entity.physics);
      }
    ).length;

    console.log(
      `Player movement system initialized. Found ${playerCount} player entities.`
    );
  },

  update(world: World, delta: number) {
    // Query for entities with player and transform components
    const players = world.query<PlayerEntity>(
      (entity): entity is PlayerEntity => {
        return Boolean(entity.player && entity.transform && entity.physics);
      }
    );

    // Process each player entity
    players.forEach((player) => {
      // Get input from the input system
      const { movement, buttons } = inputState;

      // Get the player's current state
      const { transform, physics, player: playerData } = player;

      // Calculate movement based on input and player speed
      const moveSpeed = playerData.speed * delta;

      // Apply movement to position (simplified, would normally use the physics system)
      transform.position[0] += movement.right * moveSpeed;
      transform.position[2] += movement.forward * moveSpeed;

      // Handle jumping
      if (buttons.jump && !playerData.isJumping) {
        physics.velocity[1] = playerData.jumpForce;
        playerData.isJumping = true;
      }

      // Apply gravity (simplified)
      if (playerData.isJumping) {
        physics.velocity[1] -= 9.8 * delta; // Simple gravity

        // Check if player has landed (simplified)
        if (transform.position[1] <= 0) {
          transform.position[1] = 0;
          physics.velocity[1] = 0;
          playerData.isJumping = false;
        }
      }

      // Apply velocity to position
      transform.position[0] += physics.velocity[0] * delta;
      transform.position[1] += physics.velocity[1] * delta;
      transform.position[2] += physics.velocity[2] * delta;

      // Update the entity in the world
      world.update(player);
    });
  },

  cleanup(world: World) {
    // Check how many player entities exist when cleaning up
    const playerCount = world.query<PlayerEntity>(
      (entity): entity is PlayerEntity => {
        return Boolean(entity.player && entity.transform && entity.physics);
      }
    ).length;

    console.log(
      `Player movement system cleaned up. Found ${playerCount} player entities.`
    );
  },
};
