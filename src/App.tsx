import { useState } from "react";
import { GameCanvas } from "./features/core/components/GameCanvas";

function App() {
  const [showMenu, setShowMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setShowMenu(false);
    setGameStarted(true);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {/* Game Canvas (always rendered) */}
      <div className="w-full h-full absolute top-0 left-0 z-0">
        {gameStarted && <GameCanvas />}
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 p-8 rounded-lg max-w-md text-center shadow-2xl">
            <h1 className="text-4xl font-bold text-red-600 mb-6">FPS 3D</h1>

            <p className="text-gray-300 mb-8">
              Modern first-person shooter game with fast-paced action and
              dynamic environments.
            </p>

            {!gameStarted ? (
              <button
                onClick={startGame}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
              >
                Start Game
              </button>
            ) : (
              <button
                onClick={toggleMenu}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
              >
                Resume Game
              </button>
            )}

            <div className="mt-8 text-gray-400 text-sm">
              <p className="mb-2">Controls:</p>
              <ul className="text-left mx-auto inline-block">
                <li>WASD - Movement</li>
                <li>Mouse - Look around</li>
                <li>Space - Jump</li>
                <li>Left Click - Shoot</li>
                <li>R - Reload</li>
                <li>Esc - Menu</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* In-game HUD (when not in menu) */}
      {gameStarted && !showMenu && (
        <div className="absolute bottom-4 left-4 z-20 text-white">
          <div className="bg-black bg-opacity-50 p-2 rounded">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="text-red-500">Health: 100</div>
                <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 w-full"></div>
                </div>
              </div>

              <div>
                <div className="text-yellow-500">Ammo: 30/90</div>
                <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-600 w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu button */}
      {gameStarted && !showMenu && (
        <button
          onClick={toggleMenu}
          className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-70"
        >
          Menu (Esc)
        </button>
      )}
    </div>
  );
}

export default App;
