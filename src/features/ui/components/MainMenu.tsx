import { useState, useEffect } from "react";
import { useGameStore } from "../../../stores/gameStore";
import { useLevelManager } from "../../levels/LevelManager";
import { usePlayerStore } from "../../player/stores/playerStore";

interface MainMenuProps {
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  isGameStarted: boolean;
}

export function MainMenu({ 
  onStartGame, 
  onResumeGame, 
  onRestartGame, 
  isGameStarted 
}: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'levels' | 'settings'>('main');
  const isDead = usePlayerStore(state => state.isDead);
  const score = usePlayerStore(state => state.score);
  const enemiesKilled = usePlayerStore(state => state.enemiesKilled);
  
  // Level data for level selection
  const levels = useLevelManager(state => state.levels);
  const unlockedLevels = useLevelManager(state => state.levelsUnlocked);
  const currentLevelId = useLevelManager(state => state.currentLevelId);
  const setCurrentLevel = useLevelManager(state => state.setCurrentLevel);
  
  // Start a specific level
  const handleLevelSelect = (levelId: string) => {
    setCurrentLevel(levelId);
    onStartGame();
  };
  
  // Reset focus when menu opens (accessibility)
  useEffect(() => {
    const mainButton = document.getElementById('main-menu-button');
    if (mainButton) {
      mainButton.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 p-8 rounded-lg max-w-xl w-full text-center shadow-2xl">
        {/* Menu header */}
        <h1 className="text-5xl font-bold text-red-600 mb-4">FPS 3D</h1>
        
        {/* Tabs navigation */}
        <div className="flex justify-center mb-6 border-b border-gray-700">
          <button
            className={`px-4 py-2 mr-2 font-semibold ${
              activeTab === 'main' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('main')}
          >
            Main
          </button>
          <button
            className={`px-4 py-2 mr-2 font-semibold ${
              activeTab === 'levels' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('levels')}
          >
            Levels
          </button>
          <button
            className={`px-4 py-2 font-semibold ${
              activeTab === 'settings' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        {/* Main tab */}
        {activeTab === 'main' && (
          <div>
            <p className="text-gray-300 mb-8">
              Modern first-person shooter game with fast-paced action and
              dynamic environments.
            </p>
            
            {isDead ? (
              <div className="mb-6">
                <div className="text-red-500 text-2xl mb-4">You Died!</div>
                <div className="mb-6 text-gray-400">
                  <div>Score: <span className="text-yellow-400">{score}</span></div>
                  <div>Enemies Killed: <span className="text-red-400">{enemiesKilled}</span></div>
                </div>
                <button
                  id="main-menu-button"
                  onClick={onRestartGame}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
                >
                  Restart Game
                </button>
              </div>
            ) : (
              <div>
                {!isGameStarted ? (
                  <button
                    id="main-menu-button"
                    onClick={onStartGame}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
                  >
                    Start Game
                  </button>
                ) : (
                  <button
                    id="main-menu-button"
                    onClick={onResumeGame}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
                  >
                    Resume Game
                  </button>
                )}
              </div>
            )}
            
            <div className="mt-8 text-gray-400 text-sm">
              <p className="text-white text-lg mb-2">Controls:</p>
              <div className="grid grid-cols-2 gap-2 text-left max-w-md mx-auto">
                <div>WASD</div><div>Move</div>
                <div>SPACE</div><div>Jump</div>
                <div>SHIFT</div><div>Sprint</div>
                <div>CTRL</div><div>Slide</div>
                <div>MOUSE</div><div>Aim</div>
                <div>LEFT CLICK</div><div>Shoot</div>
                <div>R</div><div>Reload</div>
                <div>ESC</div><div>Menu</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Levels tab */}
        {activeTab === 'levels' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Level Selection</h2>
            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
              {Object.values(levels).map((level) => (
                <div 
                  key={level.id}
                  className={`
                    p-4 rounded border 
                    ${unlockedLevels.includes(level.id) 
                      ? 'border-gray-600 hover:border-red-500 cursor-pointer' 
                      : 'border-gray-800 opacity-50 cursor-not-allowed'}
                    ${currentLevelId === level.id ? 'bg-gray-800' : 'bg-gray-900'}
                  `}
                  onClick={() => unlockedLevels.includes(level.id) && handleLevelSelect(level.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">{level.name}</h3>
                      <p className="text-gray-400 text-sm">{level.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-yellow-500 text-sm mb-1">
                        Difficulty: {Array(level.difficulty).fill('★').join('')}
                      </div>
                      {level.completed && (
                        <div className="text-green-500 text-sm">Completed ✓</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Game Settings</h2>
            
            {/* Volume controls */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2 text-left">Audio</h3>
              
              <div className="flex items-center mb-4">
                <span className="text-gray-300 w-32 text-left">Master Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-gray-300 w-12 text-right">80%</span>
              </div>
              
              <div className="flex items-center mb-4">
                <span className="text-gray-300 w-32 text-left">Effects Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-gray-300 w-12 text-right">100%</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-300 w-32 text-left">Music Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="60"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-gray-300 w-12 text-right">60%</span>
              </div>
            </div>
            
            {/* Graphics settings */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2 text-left">Graphics</h3>
              
              <div className="flex items-center mb-3">
                <span className="text-gray-300 w-32 text-left">Shadows</span>
                <select className="bg-gray-800 text-white p-2 rounded w-full">
                  <option value="high">High</option>
                  <option value="medium" selected>Medium</option>
                  <option value="low">Low</option>
                  <option value="off">Off</option>
                </select>
              </div>
              
              <div className="flex items-center mb-3">
                <span className="text-gray-300 w-32 text-left">Effects</span>
                <select className="bg-gray-800 text-white p-2 rounded w-full">
                  <option value="high" selected>High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-300 w-32 text-left">Resolution Scale</span>
                <select className="bg-gray-800 text-white p-2 rounded w-full">
                  <option value="100">100%</option>
                  <option value="75" selected>75%</option>
                  <option value="50">50%</option>
                </select>
              </div>
            </div>
            
            {/* Gameplay settings */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2 text-left">Gameplay</h3>
              
              <div className="flex items-center mb-3">
                <span className="text-gray-300 w-32 text-left">Mouse Sensitivity</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="5"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-gray-300 w-12 text-right">5</span>
              </div>
              
              <div className="flex items-center mb-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="relative w-11 h-6 bg-gray-700 peer-checked:bg-red-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ml-3 text-gray-300">Show Damage Numbers</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="relative w-11 h-6 bg-gray-700 peer-checked:bg-red-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ml-3 text-gray-300">Aim Assist</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
