import { useEffect, useState } from "react";
import { usePlayerStore } from "../../player/stores/playerStore";

interface HUDProps {
  showCrosshair?: boolean;
}

export function HUD({ showCrosshair = true }: HUDProps) {
  const health = usePlayerStore((state) => state.health);
  const maxHealth = usePlayerStore((state) => state.maxHealth);
  const ammo = usePlayerStore((state) => state.ammo);
  const maxAmmo = usePlayerStore((state) => state.maxAmmo);
  const isDead = usePlayerStore((state) => state.isDead);
  const [hitMarker, setHitMarker] = useState(false);

  // Subscribe to hit events
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(
      (state) => state.enemyHit,
      (hit) => {
        if (hit) {
          setHitMarker(true);
          setTimeout(() => setHitMarker(false), 200);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
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

      {/* Health bar */}
      <div className="absolute bottom-6 left-6 w-64">
        <div className="flex items-center mb-1">
          <div className="text-red-500 font-bold mr-2">HP</div>
          <div className="text-white">{health}</div>
        </div>
        <div className="bg-gray-900 bg-opacity-50 h-4 rounded-full overflow-hidden">
          <div
            className="bg-red-600 h-full"
            style={{ width: `${(health / maxHealth) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Ammo counter */}
      <div className="absolute bottom-6 right-6 text-white">
        <div className="text-right text-2xl font-bold">
          {ammo} <span className="text-gray-400 text-sm">/ {maxAmmo}</span>
        </div>
      </div>

      {/* Dead overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-30 flex items-center justify-center">
          <div className="text-4xl font-bold text-white">YOU DIED</div>
        </div>
      )}
    </div>
  );
}
