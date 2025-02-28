import { ECS } from "../ecs/ecs";
import { inputSystem } from "../ecs/systems/inputSystem";
import { playerMovementSystem } from "../ecs/systems/playerMovement";
import { physicsSystem } from "../ecs/systems/physicsSystem";
import { PlayerEntity } from "../ecs/types";

// Create a singleton instance of the ECS
const ecs = new ECS();

/**
 * Initialize the game systems and register default entities
 */
export function initializeGame(): ECS {
  // Register systems in the order they should execute
  ecs.registerSystem(inputSystem);
  ecs.registerSystem(playerMovementSystem);
  ecs.registerSystem(physicsSystem);

  // Create a player entity
  createDefaultPlayer();

  // Create some static level geometry
  createDefaultLevel();

  // Initialize all systems
  ecs.init();

  return ecs;
}

/**
 * Update the game state for a single frame
 */
export function updateGame(time: number, delta: number): void {
  // Convert delta from ms to seconds
  const deltaSeconds = delta / 1000;

  // Update all systems
  ecs.update(deltaSeconds, time);
}

/**
 * Clean up game resources
 */
export function shutdownGame(): void {
  ecs.shutdown();
}

/**
 * Create the default player entity
 */
function createDefaultPlayer(): PlayerEntity {
  const player = ecs.createEntity({
    transform: {
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    physics: {
      velocity: [0, 0, 0],
      mass: 1,
      collider: "box",
      static: false,
    },
    player: {
      health: 100,
      speed: 5,
      jumpForce: 5,
      isJumping: false,
      weapons: [],
      currentWeapon: "",
    },
  }) as PlayerEntity;

  return player;
}

/**
 * Create default level geometry
 */
function createDefaultLevel(): void {
  // Create floor
  ecs.createEntity({
    transform: {
      position: [0, -0.5, 0],
      rotation: [0, 0, 0],
      scale: [50, 1, 50],
    },
    physics: {
      velocity: [0, 0, 0],
      mass: 0,
      collider: "box",
      static: true,
    },
  });

  // Create some walls/obstacles
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * 20 - 10;
    const z = Math.random() * 20 - 10;

    if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // Don't place obstacles too close to player

    ecs.createEntity({
      transform: {
        position: [x, 1, z],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        scale: [1, 2, 1],
      },
      physics: {
        velocity: [0, 0, 0],
        mass: 0,
        collider: "box",
        static: true,
      },
    });
  }
}

/**
 * Game loop class to handle frame updates
 */
export class GameLoop {
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulatedTime: number = 0;
  private elapsedTime: number = 0;
  private frameRate: number = 60;
  private timeStep: number = 1000 / 60; // 60 FPS default
  private maxDeltaTime: number = 250; // Maximum allowed delta time (ms)

  private subscribers: Array<(delta: number, elapsedTime: number) => void> = [];

  constructor(options?: { frameRate?: number; maxDeltaTime?: number }) {
    if (options?.frameRate) {
      this.frameRate = options.frameRate;
      this.timeStep = 1000 / this.frameRate;
    }

    if (options?.maxDeltaTime) {
      this.maxDeltaTime = options.maxDeltaTime;
    }
  }

  /**
   * Subscribe to loop updates
   */
  subscribe(
    callback: (delta: number, elapsedTime: number) => void
  ): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main loop function
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Calculate time since last frame
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap maximum delta time
    if (deltaTime > this.maxDeltaTime) {
      deltaTime = this.maxDeltaTime;
    }

    // Accumulate time
    this.accumulatedTime += deltaTime;
    this.elapsedTime += deltaTime / 1000; // Convert to seconds

    // Update in fixed timesteps for physics stability
    while (this.accumulatedTime >= this.timeStep) {
      const deltaSeconds = this.timeStep / 1000; // Convert to seconds

      // Notify subscribers
      for (const subscriber of this.subscribers) {
        subscriber(deltaSeconds, this.elapsedTime);
      }

      this.accumulatedTime -= this.timeStep;
    }

    // Schedule next frame
    this.rafId = requestAnimationFrame(this.loop);
  };

  /**
   * Get current elapsed time in seconds
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Check if the game loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
