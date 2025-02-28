import { useState, useEffect } from "react";
import { GameCanvas } from "./features/core/components/GameCanvas";
import { usePlayerStore } from "./features/player/stores/playerStore";

function App() {
  const [showMenu, setShowMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const isDead = usePlayerStore((state) => state.isDead);
  const resetPlayerState = usePlayerStore((state) => state.resetPlayerState);

  // Auto-start the game
  useEffect(() => {
    // Short delay to allow everything to load
    const timer = setTimeout(() => {
      startGame();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const startGame = () => {
    setShowMenu(false);
    setGameStarted(true);
    resetPlayerState();
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const restartGame = () => {
    resetPlayerState();
  };

  // Show menu when dead with restart option
  useEffect(() => {
    if (isDead) {
      // Short delay to show the death screen before showing menu
      const timer = setTimeout(() => {
        setShowMenu(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isDead]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {/* Game Canvas (always rendered) */}
      <div className="w-full h-full absolute top-0 left-0 z-0">
        <GameCanvas />
      </div>

      {/* Game UI overlays (visible when game is active but menu is not showing) */}
      {gameStarted && !showMenu && !isDead && (
        <div className="absolute inset-0 z-5 pointer-events-none">
          {/* Any additional UI elements that should overlay the game can go here */}
        </div>
      )}

      {/* Menu Overlay */}
      {showMenu && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 p-8 rounded-lg max-w-md text-center shadow-2xl border border-gray-700">
            <h1 className="text-4xl font-bold text-red-600 mb-6">FPS 3D</h1>

            <p className="text-gray-300 mb-8">
              Modern first-person shooter game with fast-paced action and
              dynamic environments.
            </p>

            {isDead ? (
              <>
                <div className="text-red-500 text-2xl mb-4">You Died!</div>
                <button
                  onClick={restartGame}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition-colors"
                >
                  Restart Game
                </button>
              </>
            ) : (
              <>
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
              </>
            )}

            <div className="mt-8 text-gray-400 text-sm p-4 bg-gray-800 rounded-lg">
              <p className="font-bold mb-2">Controls:</p>
              <p className="mb-1">WASD - Move | SPACE - Jump | SHIFT - Sprint | CTRL - Slide</p>
              <p className="mb-1">MOUSE - Aim | LEFT CLICK - Shoot | R - Reload</p>
              <p>ESC - Menu</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
