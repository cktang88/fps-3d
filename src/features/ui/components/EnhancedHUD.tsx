import { useEffect, useState } from "react";
import { usePlayerStore } from "../../player/stores/playerStore";
import { useGameStore } from "../../../stores/gameStore";
import { useLevelManager } from "../../levels/LevelManager";

interface EnhancedHUDProps {
  showCrosshair?: boolean;
  showObjective?: boolean;
}

export function EnhancedHUD({ showCrosshair = true, showObjective = true }: EnhancedHUDProps) {
  const health = usePlayerStore((state) => state.health);
  const maxHealth = usePlayerStore((state) => state.maxHealth);
  const armor = usePlayerStore((state) => state.armor);
  const maxArmor = usePlayerStore((state) => state.maxArmor);
  const ammo = usePlayerStore((state) => state.ammo);
  const maxAmmo = usePlayerStore((state) => state.maxAmmo);
  const score = usePlayerStore((state) => state.score);
  const enemiesKilled = usePlayerStore((state) => state.enemiesKilled);
  const isDead = usePlayerStore((state) => state.isDead);
  const [hitMarker, setHitMarker] = useState(false);
  const [damageTaken, setDamageTaken] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  
  // Game state
  const showHUD = useGameStore((state) => state.showHUD);
  const currentLevel = useGameStore((state) => state.currentLevel);
  
  // Level info
  const levelData = useLevelManager((state) => 
    state.levels[currentLevel] || { name: "Unknown Level", description: "" }
  );

  // Subscribe to hit events
  useEffect(() => {
    const unsubscribeHit = usePlayerStore.subscribe(
      (state) => state.enemyHit,
      (hit) => {
        if (hit) {
          setHitMarker(true);
          setTimeout(() => setHitMarker(false), 200);
        }
      }
    );
    
    const unsubscribeDamage = usePlayerStore.subscribe(
      (state) => state.damageTaken,
      (damaged) => {
        if (damaged) {
          setDamageTaken(true);
          setTimeout(() => setDamageTaken(false), 300);
          
          // Reset the damage taken flag in the store
          setTimeout(() => {
            usePlayerStore.getState().setDamageTaken(false);
          }, 100);
        }
      }
    );

    return () => {
      unsubscribeHit();
      unsubscribeDamage();
    };
  }, []);
  
  // Show game message for a duration
  const showGameMessage = (text: string, duration = 3000) => {
    setMessage(text);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };
  
  // If HUD is disabled, don't render
  if (!showHUD) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Damage overlay effect */}
      {damageTaken && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-30 animate-pulse pointer-events-none" />
      )}
      
      {/* Crosshair */}
      {showCrosshair && !isDead && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className={`w-6 h-0.5 bg-white opacity-80 ${
                hitMarker ? "bg-red-500" : ""
              }`}
            ></div>
            <div
              className={`h-6 w-0.5 bg-white opacity-80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                hitMarker ? "bg-red-500" : ""
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* Health and armor bars */}
      <div className="absolute bottom-6 left-6 w-64">
        {/* Health bar */}
        <div className="flex items-center mb-1">
          <div className="text-red-500 font-bold mr-2">HP</div>
          <div className="text-white">{health}</div>
        </div>
        <div className="bg-gray-900 bg-opacity-50 h-4 rounded-full overflow-hidden mb-2">
          <div
            className="bg-red-600 h-full"
            style={{ width: `${(health / maxHealth) * 100}%` }}
          ></div>
        </div>
        
        {/* Armor bar */}
        <div className="flex items-center mb-1">
          <div className="text-blue-500 font-bold mr-2">ARMOR</div>
          <div className="text-white">{armor}</div>
        </div>
        <div className="bg-gray-900 bg-opacity-50 h-4 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full"
            style={{ width: `${(armor / maxArmor) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Ammo counter */}
      <div className="absolute bottom-6 right-6 text-white">
        <div className="text-right text-2xl font-bold">
          {ammo} <span className="text-gray-400 text-sm">/ {maxAmmo}</span>
        </div>
      </div>
      
      {/* Score and stats */}
      <div className="absolute top-6 right-6 text-white">
        <div className="text-right mb-1">
          <span className="text-yellow-400 font-bold">SCORE:</span> {score}
        </div>
        <div className="text-right">
          <span className="text-red-400 font-bold">KILLS:</span> {enemiesKilled}
        </div>
      </div>
      
      {/* Level info / objective */}
      {showObjective && (
        <div className="absolute top-6 left-6 text-white max-w-xs">
          <div className="bg-gray-900 bg-opacity-50 p-3 rounded">
            <div className="text-lg font-bold mb-1">{levelData.name}</div>
            <div className="text-sm opacity-80">{levelData.description}</div>
          </div>
        </div>
      )}
      
      {/* Game message */}
      {showMessage && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold text-center bg-black bg-opacity-50 p-4 rounded whitespace-nowrap">
          {message}
        </div>
      )}

      {/* Dead overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-30 flex items-center justify-center">
          <div className="text-5xl font-bold text-white">YOU DIED</div>
        </div>
      )}
    </div>
  );
}
