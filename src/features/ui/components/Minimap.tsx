import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePlayerStore } from "../../player/stores/playerStore";
import { useEnemyStore } from "../../enemies/stores/enemyStore";
import { useLevelManager } from "../../levels/LevelManager";

interface MinimapProps {
  size?: number;
  scale?: number;
  showEnemies?: boolean;
  showObjectives?: boolean;
  borderColor?: string;
  position?: { top?: number; right?: number; bottom?: number; left?: number };
}

export function Minimap({
  size = 180,
  scale = 0.05,
  showEnemies = true,
  showObjectives = true,
  borderColor = "#444",
  position = { top: 20, right: 20 },
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPosition = usePlayerStore((state) => state.position);
  const playerRotation = usePlayerStore((state) => state.rotation);
  const enemies = useEnemyStore((state) => state.enemies);
  const objectives = useLevelManager((state) => state.currentLevelObjectives);
  const walls = useLevelManager((state) => state.currentLevelWalls);
  
  // Use frame to update the minimap on each frame
  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set the center of the minimap
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls if available
    if (walls && walls.length > 0) {
      ctx.fillStyle = "#555";
      
      walls.forEach((wall) => {
        const relX = (wall.position[0] - playerPosition[0]) * scale;
        const relZ = (wall.position[2] - playerPosition[2]) * scale;
        
        const x = centerX + relX;
        const y = centerY + relZ;
        
        ctx.fillRect(
          x - (wall.size[0] * scale) / 2,
          y - (wall.size[2] * scale) / 2,
          wall.size[0] * scale,
          wall.size[2] * scale
        );
      });
    }
    
    // Draw objectives if enabled
    if (showObjectives && objectives && objectives.length > 0) {
      ctx.fillStyle = "#ffcc00";
      
      objectives.forEach((objective) => {
        const relX = (objective.position[0] - playerPosition[0]) * scale;
        const relZ = (objective.position[2] - playerPosition[2]) * scale;
        
        const x = centerX + relX;
        const y = centerY + relZ;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw enemies if enabled
    if (showEnemies && enemies && enemies.length > 0) {
      ctx.fillStyle = "#ff0000";
      
      enemies.forEach((enemy) => {
        const relX = (enemy.position[0] - playerPosition[0]) * scale;
        const relZ = (enemy.position[2] - playerPosition[2]) * scale;
        
        const x = centerX + relX;
        const y = centerY + relZ;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw player in the center (as a triangle pointing in the direction)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(playerRotation[1]); // Use y-rotation for player direction
    
    ctx.fillStyle = "#00aaff";
    ctx.beginPath();
    ctx.moveTo(0, -6); // Point in the direction the player is facing
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: position.top !== undefined ? `${position.top}px` : "auto",
        right: position.right !== undefined ? `${position.right}px` : "auto",
        bottom: position.bottom !== undefined ? `${position.bottom}px` : "auto",
        left: position.left !== undefined ? `${position.left}px` : "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
}
