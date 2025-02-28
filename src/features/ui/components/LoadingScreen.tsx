import { useEffect, useState } from "react";
import { useLevelManager } from "../../levels/LevelManager";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  const isLoading = useLevelManager((state) => state.isLoading);
  const currentLevelId = useLevelManager((state) => state.currentLevelId);
  const levels = useLevelManager((state) => state.levels);
  
  // Get current level name
  const levelName = currentLevelId ? levels[currentLevelId]?.name : "Unknown Level";
  
  // Simulate loading progress
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down progress as it gets closer to 100%
        const increment = Math.max(1, 10 * (1 - prev / 100));
        const newProgress = Math.min(99, prev + increment);
        
        // Stop at 99% - will jump to 100% when actually loaded
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  // Complete loading when no longer in loading state
  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100);
      
      // Small delay before completely hiding
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, progress]);
  
  // Animated dots for loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="w-64 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Loading {levelName}</h2>
        <p className="text-gray-400 mb-6">{message || `Preparing environment${dots}`}</p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
          <div 
            className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-gray-500">{Math.round(progress)}%</p>
        
        {/* Tips carousel could go here */}
        <div className="mt-8 max-w-sm text-gray-400 text-sm italic">
          <p>"Remember to use cover and keep moving to avoid enemy fire."</p>
        </div>
      </div>
    </div>
  );
}
