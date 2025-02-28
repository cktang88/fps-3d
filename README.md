# FPS-3D Game

A modern 3D First-Person Shooter (FPS) game inspired by classic Doom but with contemporary UI, movement mechanics, graphics, and gameplay features.

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **3D Rendering**: React Three Fiber (@react-three/fiber)
- **Physics**: @react-three/rapier
- **ECS System**: Custom ECS implementation
- **UI**: Tailwind CSS
- **Animation**: react-spring
- **Sound**: Howler.js
- **Build Tool**: Vite

## Project Structure

The project follows a feature-based organization:

```
fps-3d/
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── core/      # Core game systems
│   │   │   ├── ecs/   # Custom Entity Component System
│   │   │   ├── input/ # Input handling
│   │   │   └── loop/  # Game loop
│   │   ├── player/    # Player features
│   │   ├── weapons/   # Weapon systems
│   │   ├── enemies/   # Enemy AI and behavior
│   │   ├── levels/    # Game levels and environments
│   │   ├── physics/   # Physics systems
│   │   ├── ui/        # Game UI (HUD, menus)
│   │   └── effects/   # Visual effects
```

## Core Technical Features

### Entity Component System (ECS)

The game uses a custom ECS architecture to manage game objects and behavior:

- **Entities**: Unique IDs representing game objects (player, enemies, weapons, etc.)
- **Components**: Pure data attached to entities (position, health, weapon stats)
- **Systems**: Functions that operate on entities with specific components

### Game Systems

- **Input System**: Handles keyboard and mouse input
- **Player Movement System**: Controls player movement and camera
- **Physics System**: Handles collision detection and response
- **Rendering System**: Manages 3D rendering with React Three Fiber

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fps-3d.git
cd fps-3d

# Install dependencies
npm install
# or
yarn

# Start development server
npm run dev
# or
yarn dev
```

### Controls

- **WASD**: Movement
- **Mouse**: Look around
- **Space**: Jump
- **Left Click**: Shoot
- **R**: Reload
- **Esc**: Menu

## Current State and Roadmap

### Current Features

- Custom ECS implementation
- Basic player movement
- Simple physics and collision
- 3D environment rendering with React Three Fiber

### Upcoming Features

- Weapons system with multiple weapon types
- Enemy AI
- Level design and loading system
- Sound effects and music
- Visual effects (muzzle flashes, explosions)
- Score system

## License

MIT
