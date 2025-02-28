import { useFrame } from "@react-three/fiber";
import { useEnemyStore } from "../stores/enemyStore";
import { EnemyProjectile } from "./EnemyProjectile";
import { ImpactEffect } from "../../weapons/components/ShootingEffects";
import { useState } from "react";

/**
 * Manages all enemy projectiles from the enemyStore
 */
export function EnemyProjectileManager() {
  const { projectiles, removeProjectile } = useEnemyStore();
  const [impacts, setImpacts] = useState<{ id: string; position: [number, number, number]; time: number }[]>([]);
  
  // Handle hit effects
  const handleHit = (position: [number, number, number]) => {
    const id = `impact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add impact effect
    setImpacts(prev => [...prev, { id, position, time: Date.now() }]);
    
    // Remove impact effect after 2 seconds
    setTimeout(() => {
      setImpacts(prev => prev.filter(impact => impact.id !== id));
    }, 2000);
  };
  
  // Cleanup old projectiles (failsafe)
  useFrame(() => {
    const now = Date.now();
    projectiles.forEach(projectile => {
      // Remove projectiles older than 10 seconds
      if (now - projectile.createdAt > 10000) {
        // Don't remove directly, use a delayed cleanup to avoid React Three Fiber/Rapier issues
        setTimeout(() => {
          removeProjectile(projectile.id);
        }, 50);
      }
    });
  });
  
  return (
    <group name="enemy-projectiles">
      {/* Render all active projectiles */}
      {projectiles.map(projectile => (
        <EnemyProjectile
          key={projectile.id}
          id={projectile.id}
          position={projectile.position}
          velocity={projectile.velocity}
          damage={projectile.damage}
          type={projectile.type}
          onHit={handleHit}
        />
      ))}
      
      {/* Render impact effects */}
      {impacts.map(impact => (
        <ImpactEffect
          key={impact.id}
          position={impact.position}
          color="#ff3300"
          size={0.2}
        />
      ))}
    </group>
  );
}
