import { useState, useRef, useEffect } from "react";
import { useLevelManager } from "../../levels/LevelManager";

interface LevelSelectionScreenProps {
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
}

export function LevelSelectionScreen({ 
  onSelectLevel, 
  onBack 
}: LevelSelectionScreenProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  
  const levels = useLevelManager((state) => state.levels);
  const unlockedLevels = useLevelManager((state) => state.levelsUnlocked);
  const currentLevelId = useLevelManager((state) => state.currentLevelId);
  
  // Select current level by default
  useEffect(() => {
    if (currentLevelId) {
      setSelectedLevel(currentLevelId);
    } else if (unlockedLevels.length > 0) {
      setSelectedLevel(unlockedLevels[0]);
    }
  }, [currentLevelId, unlockedLevels]);
  
  // Handle level selection
  const handleLevelSelect = (levelId: string) => {
    if (unlockedLevels.includes(levelId)) {
      setSelectedLevel(levelId);
    }
  };
  
  // Start selected level
  const startLevel = () => {
    if (selectedLevel) {
      onSelectLevel(selectedLevel);
    }
  };
  
  // Get level details for the selected level
  const selectedLevelDetails = selectedLevel ? levels[selectedLevel] : null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full px-8 py-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Select Level</h1>
        
        <div className="flex space-x-8">
          {/* Level list */}
          <div className="w-2/3 bg-gray-900 p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {Object.values(levels).map((level) => {
                const isUnlocked = unlockedLevels.includes(level.id);
                const isSelected = selectedLevel === level.id;
                const isHovered = hoveredLevel === level.id;
                
                return (
                  <div
                    key={level.id}
                    className={`
                      p-4 rounded border transition-all duration-200
                      ${isUnlocked 
                        ? 'cursor-pointer hover:border-blue-500 hover:bg-gray-800' 
                        : 'opacity-50 cursor-not-allowed border-gray-800'}
                      ${isSelected ? 'border-blue-500 bg-gray-800' : 'border-gray-700'}
                    `}
                    onClick={() => isUnlocked && handleLevelSelect(level.id)}
                    onMouseEnter={() => setHoveredLevel(level.id)}
                    onMouseLeave={() => setHoveredLevel(null)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{level.name}</h3>
                        <p className="text-gray-400 text-sm">{level.description}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-yellow-500 text-sm mb-1">
                          {Array(level.difficulty).fill('★').join('')}
                        </div>
                        {level.completed && (
                          <div className="text-green-500 text-sm">Completed ✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Level details */}
          <div className="w-1/3 bg-gray-900 p-6 rounded-lg shadow-lg text-left flex flex-col">
            {selectedLevelDetails ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">{selectedLevelDetails.name}</h2>
                
                <div className="mb-4">
                  <div className="text-yellow-500 mb-1">
                    Difficulty: {Array(selectedLevelDetails.difficulty).fill('★').join('')}
                  </div>
                  <div className="text-gray-300 mb-4">
                    {selectedLevelDetails.description}
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">Objectives</h3>
                    <ul className="list-disc pl-5 text-gray-300">
                      {selectedLevelDetails.objectives?.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedLevelDetails.enemies && (
                    <div className="bg-gray-800 p-3 rounded mb-4">
                      <h3 className="text-lg font-bold text-white mb-2">Enemies</h3>
                      <div className="text-gray-300">
                        {selectedLevelDetails.enemies}
                      </div>
                    </div>
                  )}
                  
                  {selectedLevelDetails.challenges && (
                    <div className="bg-gray-800 p-3 rounded">
                      <h3 className="text-lg font-bold text-white mb-2">Challenges</h3>
                      <ul className="list-disc pl-5 text-gray-300">
                        {selectedLevelDetails.challenges.map((challenge, index) => (
                          <li key={index}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  <button
                    onClick={startLevel}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded w-full transition-colors mb-3"
                  >
                    Start Level
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center flex-grow flex items-center justify-center">
                Select a level to view details
              </div>
            )}
            
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
