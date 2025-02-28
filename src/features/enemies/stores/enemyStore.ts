import { create } from "zustand";
import { EnemyType } from "../components/Enemy";
import { Vector3 } from "three";

export interface EnemyData {
  id: string;
  type: EnemyType;
  position: { x: number, y: number, z: number };
  health: number;
  maxHealth: number;
  isDead: boolean;
  isAlerted: boolean;
  lastAttackTime: number;
}

export interface ProjectileData {
  id: string;
  position: [number, number, number]; 
  velocity: [number, number, number];
  damage: number;
  type: EnemyType;
  createdAt: number;
}

interface EnemyState {
  // Collection of all enemies in the game
  enemies: EnemyData[];
  
  // Player data for targeting
  player: { x: number, y: number, z: number } | null;
  
  // Projectiles
  projectiles: ProjectileData[];
  
  // Counters and stats
  totalEnemies: number;
  aliveEnemies: number;
  
  // CRUD operations
  addEnemy: (enemy: Omit<EnemyData, "id">) => string;
  updateEnemy: (id: string, data: Partial<EnemyData>) => void;
  removeEnemy: (id: string) => void;
  getEnemyById: (id: string) => EnemyData | undefined;
  
  // Projectile operations
  addProjectile: (projectile: Omit<ProjectileData, "id" | "createdAt">) => string;
  removeProjectile: (id: string) => void;
  getProjectiles: () => ProjectileData[];
  clearProjectiles: () => void;
  
  // Player tracking
  updatePlayerPosition: (position: { x: number, y: number, z: number }) => void;
  getPlayer: () => { x: number, y: number, z: number } | null;
  
  // Batch operations
  updateEnemyPositions: (positions: { id: string, position: { x: number, y: number, z: number } }[]) => void;
  updateEnemyPosition: (id: string, position: { x: number, y: number, z: number }) => void;
  resetEnemies: () => void;
  
  // Game events
  damageEnemy: (id: string, damage: number) => boolean; // returns true if enemy died
  alertEnemy: (id: string, isAlerted: boolean) => void;
}

export const useEnemyStore = create<EnemyState>()((set, get) => ({
  // Initial state
  enemies: [],
  projectiles: [],
  player: null,
  totalEnemies: 0,
  aliveEnemies: 0,
  
  // CRUD operations
  addEnemy: (enemy) => {
    const id = `enemy-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => {
      const newEnemy = {
        id,
        ...enemy,
        isDead: false,
        isAlerted: false,
        lastAttackTime: 0
      };
      
      return {
        enemies: [...state.enemies, newEnemy],
        totalEnemies: state.totalEnemies + 1,
        aliveEnemies: state.aliveEnemies + 1
      };
    });
    return id;
  },
  
  updateEnemy: (id, data) => {
    set((state) => ({
      enemies: state.enemies.map((enemy) => 
        enemy.id === id ? { ...enemy, ...data } : enemy
      )
    }));
  },
  
  removeEnemy: (id) => {
    set((state) => {
      const enemyToRemove = state.enemies.find(enemy => enemy.id === id);
      const aliveEnemiesChange = enemyToRemove && !enemyToRemove.isDead ? -1 : 0;
      
      return {
        enemies: state.enemies.filter((enemy) => enemy.id !== id),
        totalEnemies: state.totalEnemies - 1,
        aliveEnemies: state.aliveEnemies + aliveEnemiesChange
      };
    });
  },
  
  getEnemyById: (id) => {
    return get().enemies.find((enemy) => enemy.id === id);
  },
  
  // Projectile operations
  addProjectile: (projectile) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      projectiles: [
        ...state.projectiles,
        {
          id,
          ...projectile,
          createdAt: Date.now()
        }
      ]
    }));
    return id;
  },
  
  removeProjectile: (id) => {
    set((state) => ({
      projectiles: state.projectiles.filter(p => p.id !== id)
    }));
  },
  
  getProjectiles: () => {
    return get().projectiles;
  },
  
  clearProjectiles: () => {
    set({ projectiles: [] });
  },
  
  // Player tracking
  updatePlayerPosition: (position) => {
    set({ player: position });
  },
  
  getPlayer: () => {
    return get().player;
  },
  
  // Batch operations
  updateEnemyPositions: (positions) => {
    set((state) => ({
      enemies: state.enemies.map((enemy) => {
        const posUpdate = positions.find((pos) => pos.id === enemy.id);
        return posUpdate ? { ...enemy, position: posUpdate.position } : enemy;
      })
    }));
  },
  
  updateEnemyPosition: (id, position) => {
    set((state) => ({
      enemies: state.enemies.map((enemy) => 
        enemy.id === id ? { ...enemy, position } : enemy
      )
    }));
  },
  
  resetEnemies: () => {
    set({ enemies: [], totalEnemies: 0, aliveEnemies: 0 });
  },
  
  // Game events
  damageEnemy: (id, damage) => {
    let died = false;
    
    set((state) => {
      const updatedEnemies = state.enemies.map((enemy) => {
        if (enemy.id === id) {
          const newHealth = Math.max(0, enemy.health - damage);
          const justDied = newHealth <= 0 && !enemy.isDead;
          died = justDied;
          
          return {
            ...enemy,
            health: newHealth,
            isDead: newHealth <= 0
          };
        }
        return enemy;
      });
      
      const aliveEnemies = died ? state.aliveEnemies - 1 : state.aliveEnemies;
      
      return {
        enemies: updatedEnemies,
        aliveEnemies
      };
    });
    
    return died;
  },
  
  alertEnemy: (id, isAlerted) => {
    set((state) => ({
      enemies: state.enemies.map((enemy) => 
        enemy.id === id ? { ...enemy, isAlerted } : enemy
      )
    }));
  }
}));
