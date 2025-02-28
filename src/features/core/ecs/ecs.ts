import { nanoid } from "nanoid";
import { Entity, System } from "./types";

/**
 * Custom World class that manages entities
 */
class World {
  entities: Entity[] = [];

  /**
   * Add an entity to the world
   */
  add(entity: Entity): void {
    this.entities.push(entity);
  }

  /**
   * Remove an entity from the world
   */
  remove(entity: Entity): void {
    const index = this.entities.findIndex((e) => e.id === entity.id);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Update an entity in the world
   */
  update(entity: Entity): void {
    const index = this.entities.findIndex((e) => e.id === entity.id);
    if (index !== -1) {
      this.entities[index] = entity;
    }
  }

  /**
   * Get entities that match a specific query function
   */
  query<T extends Entity>(queryFn: (entity: Entity) => entity is T): T[] {
    return this.entities.filter(queryFn) as T[];
  }
}

/**
 * Main ECS class that manages entities and systems
 */
export class ECS {
  private world: World;
  private systems: System[] = [];
  private isRunning: boolean = false;

  constructor() {
    this.world = new World();
  }

  /**
   * Get the world instance
   */
  getWorld() {
    return this.world;
  }

  /**
   * Create a new entity
   */
  createEntity(components: Partial<Entity> = {}): Entity {
    const entity: Entity = {
      id: nanoid(),
      ...components,
    };

    this.world.add(entity);
    return entity;
  }

  /**
   * Remove an entity by id
   */
  removeEntity(entityId: string): void {
    const entity = this.world.entities.find((e) => e.id === entityId);
    if (entity) {
      this.world.remove(entity);
    }
  }

  /**
   * Get an entity by id
   */
  getEntity(entityId: string): Entity | undefined {
    return this.world.entities.find((e) => e.id === entityId);
  }

  /**
   * Add a component to an entity
   */
  addComponent<T extends Record<string, unknown>>(
    entityId: string,
    componentType: string,
    componentData: T
  ): void {
    const entity = this.getEntity(entityId);
    if (entity) {
      entity[componentType] = {
        ...componentData,
      };
      this.world.update(entity);
    }
  }

  /**
   * Remove a component from an entity
   */
  removeComponent(entityId: string, componentType: string): void {
    const entity = this.getEntity(entityId);
    if (entity && entity[componentType]) {
      delete entity[componentType];
      this.world.update(entity);
    }
  }

  /**
   * Register a system
   */
  registerSystem(system: System): void {
    this.systems.push(system);

    // Sort systems by dependencies
    this.sortSystems();

    // Initialize system if ECS is already running
    if (this.isRunning && system.init) {
      system.init(this.world);
    }
  }

  /**
   * Initialize all systems
   */
  init(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Initialize all systems
    for (const system of this.systems) {
      if (system.init) {
        system.init(this.world);
      }
    }
  }

  /**
   * Update all systems
   */
  update(delta: number, elapsedTime: number): void {
    if (!this.isRunning) return;

    // Update all systems
    for (const system of this.systems) {
      if (system.update) {
        system.update(this.world, delta, elapsedTime);
      }
    }
  }

  /**
   * Shutdown all systems
   */
  shutdown(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Cleanup all systems
    for (const system of this.systems) {
      if (system.cleanup) {
        system.cleanup(this.world);
      }
    }
  }

  /**
   * Sort systems by dependencies
   */
  private sortSystems(): void {
    // Create a map of system names to their indices
    const systemIndices = new Map<string, number>();
    this.systems.forEach((system, index) => {
      systemIndices.set(system.name, index);
    });

    // Sort systems based on dependencies
    this.systems.sort((a, b) => {
      // If b depends on a, a should come first
      if (b.dependencies?.includes(a.name)) {
        return -1;
      }

      // If a depends on b, b should come first
      if (a.dependencies?.includes(b.name)) {
        return 1;
      }

      // Otherwise, preserve original order
      return (
        (systemIndices.get(a.name) || 0) - (systemIndices.get(b.name) || 0)
      );
    });
  }
}
