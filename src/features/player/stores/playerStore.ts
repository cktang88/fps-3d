import { create } from "zustand";

interface PlayerState {
  // Health system
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  isDead: boolean;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
  
  // Weapon system
  ammo: number;
  maxAmmo: number;
  reloading: boolean;
  
  // Combat status
  enemyHit: boolean;
  damageTaken: boolean;
  
  // Score and game progress
  score: number;
  enemiesKilled: number;
  
  // Player position and items
  position: [number, number, number];
  items: string[];
  
  // Actions
  setHealth: (health: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  setArmor: (armor: number) => void;
  setAmmo: (ammo: number) => void;
  setReloading: (reloading: boolean) => void;
  setEnemyHit: (hit: boolean) => void;
  setDamageTaken: (damaged: boolean) => void;
  setIsInvulnerable: (invulnerable: boolean) => void;
  setInvulnerabilityTimer: (time: number) => void;
  incrementScore: (points: number) => void;
  incrementEnemiesKilled: () => void;
  resetPlayerState: () => void;
  resetPlayerPosition: (position: [number, number, number]) => void;
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
  hasItem: (item: string) => boolean;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  // Initial health values
  health: 100,
  maxHealth: 100,
  armor: 0,
  maxArmor: 50,
  isDead: false,
  isInvulnerable: false,
  invulnerabilityTimer: 0,
  
  // Initial weapon values
  ammo: 30,
  maxAmmo: 120,
  reloading: false,
  
  // Combat status
  enemyHit: false,
  damageTaken: false,
  
  // Score tracking
  score: 0,
  enemiesKilled: 0,
  
  // Player position and items
  position: [0, 2, 0],
  items: [],
  
  // Actions
  setHealth: (health) => set((state) => {
    const isDead = health <= 0;
    return { 
      health: Math.max(0, Math.min(health, state.maxHealth)),
      isDead
    };
  }),
  
  takeDamage: (amount) => set((state) => {
    if (state.isInvulnerable || state.isDead) return {};
    
    // Calculate actual damage after armor
    let remainingDamage = amount;
    let newArmor = state.armor;
    
    if (state.armor > 0) {
      const armorDamage = Math.min(state.armor, amount * 0.5);
      newArmor = state.armor - armorDamage;
      remainingDamage = amount - armorDamage;
    }
    
    const newHealth = Math.max(0, state.health - remainingDamage);
    const isDead = newHealth <= 0;
    
    return {
      health: newHealth,
      armor: newArmor,
      isDead,
      damageTaken: true,
      isInvulnerable: !isDead // Become invulnerable when hit (if not dead)
    };
  }),
  
  heal: (amount) => set((state) => ({
    health: Math.min(state.maxHealth, state.health + amount)
  })),
  
  setArmor: (armor) => set((state) => ({
    armor: Math.max(0, Math.min(armor, state.maxArmor))
  })),
  
  setAmmo: (ammo) => set((state) => ({
    ammo: Math.max(0, Math.min(ammo, state.maxAmmo))
  })),
  
  setReloading: (reloading) => set({
    reloading
  }),
  
  setEnemyHit: (hit) => set({
    enemyHit: hit
  }),
  
  setDamageTaken: (damaged) => set({
    damageTaken: damaged
  }),
  
  setIsInvulnerable: (invulnerable) => set({
    isInvulnerable: invulnerable
  }),
  
  setInvulnerabilityTimer: (time) => set({
    invulnerabilityTimer: time
  }),
  
  incrementScore: (points) => set((state) => ({
    score: state.score + points
  })),
  
  incrementEnemiesKilled: () => set((state) => ({
    enemiesKilled: state.enemiesKilled + 1
  })),
  
  resetPlayerState: () => {
    set({
      health: 100,
      maxHealth: 100,
      armor: 0,
      maxArmor: 50,
      isDead: false,
      isInvulnerable: false,
      invulnerabilityTimer: 0,
      ammo: 30,
      maxAmmo: 120,
      reloading: false,
      enemyHit: false,
      damageTaken: false,
      score: 0,
      enemiesKilled: 0,
      position: [0, 2, 0],
      items: []
    });
  },
  
  resetPlayerPosition: (position: [number, number, number]) => {
    set({ position });
  },
  
  addItem: (item) => set((state) => {
    if (state.items.includes(item)) return state;
    return { items: [...state.items, item] };
  }),
  
  removeItem: (item) => set((state) => ({
    items: state.items.filter(i => i !== item)
  })),
  
  hasItem: (item) => {
    return get().items.includes(item);
  }
}));
