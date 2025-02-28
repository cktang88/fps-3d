import { useEffect, useRef, useCallback } from "react";
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
  const animationFrameRef = useRef<number>();
  
  // Use refs to store state values
  const playerPositionRef = useRef(usePlayerStore.getState().position);
  const playerRotationRef = useRef(usePlayerStore.getState().rotation);
  const enemiesRef = useRef(useEnemyStore.getState().enemies);
  const objectivesRef = useRef(useLevelManager.getState().currentLevelObjectives || []);
  const wallsRef = useRef(useLevelManager.getState().currentLevelWalls || []);
  
  // Set up subscription to update values when they change
  useEffect(() => {
    const unsubPlayer = usePlayerStore.subscribe(
      state => {
        playerPositionRef.current = state.position;
        playerRotationRef.current = state.rotation;
      }
    );
    
    const unsubEnemies = useEnemyStore.subscribe(
      state => {
        enemiesRef.current = state.enemies;
      }
    );
    
    const unsubLevel = useLevelManager.subscribe(
      state => {
        objectivesRef.current = state.currentLevelObjectives || [];
        wallsRef.current = state.currentLevelWalls || [];
      }
    );
    
    return () => {
      unsubPlayer();
      unsubEnemies();
      unsubLevel();
    };
  }, []);
  
  // Set up the canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = size;
      canvas.height = size;
    }
  }, [size]);

  // Memoize renderMinimap function
  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get current state values from refs
    const playerPosition = playerPositionRef.current;
    const playerRotation = playerRotationRef.current;
    const enemies = enemiesRef.current;
    const objectives = objectivesRef.current;
    const walls = wallsRef.current;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw world boundaries or walls if available
    if (walls && walls.length > 0) {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      
      walls.forEach(wall => {
        // Skip if the wall is too far from player to be in minimap
        if (!wall.position) return;
        
        const relX = (wall.position.x - playerPosition[0]) * scale + size / 2;
        const relZ = (wall.position.z - playerPosition[2]) * scale + size / 2;
        
        // Only draw if within the minimap view
        if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
          const wallSize = (wall.size || 1) * scale;
          ctx.fillStyle = '#555';
          ctx.fillRect(
            relX - wallSize / 2,
            relZ - wallSize / 2,
            wallSize,
            wallSize
          );
        }
      });
    }
    
    // Draw objectives if enabled and available
    if (showObjectives && objectives && objectives.length > 0) {
      ctx.fillStyle = '#ffcc00';
      
      objectives.forEach(objective => {
        if (!objective.position) return;
        
        const relX = (objective.position.x - playerPosition[0]) * scale + size / 2;
        const relZ = (objective.position.z - playerPosition[2]) * scale + size / 2;
        
        // Only draw if within the minimap view
        if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
          ctx.beginPath();
          ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    
    // Draw enemies if enabled and available
    if (showEnemies && enemies && enemies.length > 0) {
      ctx.fillStyle = '#ff4444';
      
      enemies.forEach(enemy => {
        if (enemy.isDead) return; // Don't show dead enemies
        
        const relX = (enemy.position.x - playerPosition[0]) * scale + size / 2;
        const relZ = (enemy.position.z - playerPosition[2]) * scale + size / 2;
        
        // Only draw if within the minimap view
        if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
          // Enemies that are alerted have a different appearance
          if (enemy.isAlerted) {
            ctx.fillStyle = '#ff2222';
            ctx.beginPath();
            ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(relX, relZ, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
    
    // Draw player (always in center)
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction
    const dirLength = 8;
    // Add null check to ensure playerRotation exists and has index 1
    const rotationAngle = playerRotation && playerRotation[1] ? playerRotation[1] : 0;
    const dirX = size / 2 + Math.sin(rotationAngle) * dirLength;
    const dirZ = size / 2 + Math.cos(rotationAngle) * dirLength;
    
    ctx.strokeStyle = '#44aaff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.lineTo(dirX, dirZ);
    ctx.stroke();
  }, [size, scale, showEnemies, showObjectives]);

  // Use requestAnimationFrame instead of useFrame
  useEffect(() => {
    const animate = () => {
      renderMinimap();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderMinimap]);
  
  return (
    <div 
      className="absolute rounded-full overflow-hidden border-2"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: position.top ? `${position.top}px` : 'auto',
        right: position.right ? `${position.right}px` : 'auto',
        bottom: position.bottom ? `${position.bottom}px` : 'auto',
        left: position.left ? `${position.left}px` : 'auto',
        borderColor: borderColor
      }}
    >
      <canvas 
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full"
      />
    </div>
  );
}
