import { useEffect, useState } from "react";
import { usePlayerStore } from "../../player/stores/playerStore";
import { useLevelManager } from "../../levels/LevelManager";
import { useGameStore } from "../../../stores/gameStore";

interface GameOverScreenProps {
  onRestart: () => void;
  onMainMenu: () => void;
  onNextLevel?: () => void;
  didWin?: boolean;
}

export function GameOverScreen({ 
  onRestart, 
  onMainMenu, 
  onNextLevel,
  didWin = false
}: GameOverScreenProps) {
  const [showStats, setShowStats] = useState(false);
  const score = usePlayerStore((state) => state.score);
  const enemiesKilled = usePlayerStore((state) => state.enemiesKilled);
  const accuracy = usePlayerStore((state) => state.accuracy);
  const damageDealt = usePlayerStore((state) => state.damageDealt);
  const damageTaken = usePlayerStore((state) => state.totalDamageTaken);
  const itemsCollected = usePlayerStore((state) => state.itemsCollected);
  const timePlayed = usePlayerStore((state) => state.timePlayed);
  
  const currentLevelId = useLevelManager((state) => state.currentLevelId);
  const levels = useLevelManager((state) => state.levels);
  const hasNextLevel = useLevelManager((state) => {
    if (!currentLevelId) return false;
    const currentIndex = Object.keys(levels).indexOf(currentLevelId);
    return currentIndex < Object.keys(levels).length - 1;
  });
  
  // Format time played
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate grade based on score, time, and accuracy
  const calculateGrade = () => {
    // This is a simplified grading system, can be expanded
    const scoreGrade = Math.min(100, (score / 5000) * 100);
    const accuracyGrade = Math.min(100, accuracy * 100);
    const timeGrade = Math.min(100, Math.max(0, 100 - timePlayed / 3));
    
    const totalGrade = (scoreGrade * 0.4) + (accuracyGrade * 0.4) + (timeGrade * 0.2);
    
    if (totalGrade >= 90) return "S";
    if (totalGrade >= 80) return "A";
    if (totalGrade >= 70) return "B";
    if (totalGrade >= 60) return "C";
    if (totalGrade >= 50) return "D";
    return "F";
  };
  
  // Animate stats in
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStats(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full px-8 py-10 bg-gray-900 rounded-lg shadow-2xl text-center">
        <h1 className={`text-5xl font-bold mb-6 ${didWin ? 'text-green-500' : 'text-red-500'}`}>
          {didWin ? 'LEVEL COMPLETE' : 'GAME OVER'}
        </h1>
        
        {didWin && (
          <div className="text-3xl font-bold text-yellow-400 mb-6">
            Final Grade: {calculateGrade()}
          </div>
        )}
        
        {/* Stats section */}
        <div className={`transition-all duration-1000 ease-out ${showStats ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold text-white mb-2">Combat Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Enemies Killed:</div>
                <div className="text-white text-right">{enemiesKilled}</div>
                <div className="text-gray-400">Accuracy:</div>
                <div className="text-white text-right">{Math.round(accuracy * 100)}%</div>
                <div className="text-gray-400">Damage Dealt:</div>
                <div className="text-white text-right">{damageDealt}</div>
                <div className="text-gray-400">Damage Taken:</div>
                <div className="text-white text-right">{damageTaken}</div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold text-white mb-2">Game Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Score:</div>
                <div className="text-white text-right">{score}</div>
                <div className="text-gray-400">Items Collected:</div>
                <div className="text-white text-right">{itemsCollected}</div>
                <div className="text-gray-400">Time Played:</div>
                <div className="text-white text-right">{formatTime(timePlayed)}</div>
                <div className="text-gray-400">Level:</div>
                <div className="text-white text-right">{levels[currentLevelId || ""]?.name || "Unknown"}</div>
              </div>
            </div>
          </div>
          
          {/* Achievement section */}
          {didWin && (
            <div className="bg-gray-800 p-4 rounded mb-8">
              <h3 className="text-lg font-bold text-white mb-2">Achievements</h3>
              <div className="flex justify-around">
                {accuracy > 0.7 && (
                  <div className="text-center p-2">
                    <div className="text-yellow-400 text-2xl">🎯</div>
                    <div className="text-white">Sharpshooter</div>
                  </div>
                )}
                {enemiesKilled > 20 && (
                  <div className="text-center p-2">
                    <div className="text-yellow-400 text-2xl">💥</div>
                    <div className="text-white">Terminator</div>
                  </div>
                )}
                {score > 5000 && (
                  <div className="text-center p-2">
                    <div className="text-yellow-400 text-2xl">🏆</div>
                    <div className="text-white">High Scorer</div>
                  </div>
                )}
                {itemsCollected > 15 && (
                  <div className="text-center p-2">
                    <div className="text-yellow-400 text-2xl">🧰</div>
                    <div className="text-white">Collector</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors"
          >
            Restart Level
          </button>
          
          {didWin && hasNextLevel && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              Next Level
            </button>
          )}
          
          <button
            onClick={onMainMenu}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
