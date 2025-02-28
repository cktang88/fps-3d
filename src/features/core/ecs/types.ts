// Core ECS Types

// Basic Entity type
export type Entity = {
  id: string;
  [key: string]: unknown;
};

// Component types
export type Component = {
  type: string;
  [key: string]: unknown;
};

// Forward declaration of World class for type reference
export interface World {
  entities: Entity[];
  add(entity: Entity): void;
  remove(entity: Entity): void;
  update(entity: Entity): void;
  query<T extends Entity>(queryFn: (entity: Entity) => entity is T): T[];
}

// System interface
export interface System {
  name: string;
  init?: (world: World) => void;
  update?: (world: World, delta: number, elapsedTime: number) => void;
  cleanup?: (world: World) => void;
  dependencies?: string[]; // Systems that must run before this one
}

// Query is a type that defines a filter for entities
export type Query<T extends Entity = Entity> = (entity: Entity) => entity is T;

// Specific entity types with required components
export type TransformEntity = Entity & {
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
};

export type PhysicsEntity = TransformEntity & {
  physics: {
    velocity: [number, number, number];
    mass: number;
    collider: string;
    static: boolean;
  };
};

export type CameraEntity = TransformEntity & {
  camera: {
    fov: number;
    near: number;
    far: number;
    isActive: boolean;
  };
};

export type PlayerEntity = PhysicsEntity & {
  player: {
    health: number;
    speed: number;
    jumpForce: number;
    isJumping: boolean;
    weapons: string[];
    currentWeapon: string;
  };
};

export type WeaponEntity = TransformEntity & {
  weapon: {
    name: string;
    damage: number;
    fireRate: number;
    ammo: number;
    maxAmmo: number;
    reloadTime: number;
    isReloading: boolean;
    lastFired: number;
    projectileType: string;
  };
};

export type EnemyEntity = PhysicsEntity & {
  enemy: {
    type: string;
    health: number;
    damage: number;
    speed: number;
    state: "idle" | "patrol" | "chase" | "attack" | "dead";
    detectionRadius: number;
    attackRadius: number;
    target?: string; // ID of the target entity
  };
};

export type ProjectileEntity = PhysicsEntity & {
  projectile: {
    damage: number;
    speed: number;
    source: string; // ID of the entity that fired the projectile
    lifetime: number; // How long the projectile lives in seconds
    createdAt: number; // Time when the projectile was created
  };
};
