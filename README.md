# Cosmic Turret Infinity Jackpot

A 3D multiplayer space shooter game where players control turrets to battle against AI Bosses in an epic cosmic arena.

## Implemented Features

- Turret Controller (mouse rotation)
- Photon Repeater weapon (click to fire)
- Enemy spawning system
- Collision detection and damage system
- Bloom post-processing effects

## Deploy

Click the Deploy button to deploy on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kaydenn-k/cosmic-turret-infinity-jackpot)

## Project Overview

**Game Type:** 3D Multiplayer Space Shooter (1-4 Player Co-op PvE)

Players control powerful turrets to defend against waves of AI Bosses including:
- **Mecha-Piranha** - Agile mechanical predators
- **Crystal Jellyfish** - Ethereal energy beings
- **Void Eater** - Giant cyber whale boss

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **@react-three/postprocessing** - Post-processing effects

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare Durable Objects** - Game state management
- **Cloudflare KV** - Lobby data storage

### Deployment
- **Vercel** - Frontend hosting

## Features

### Weapon Systems (3 Types)
1. **Photon Repeater** - Rapid-fire photon projectiles
2. **Lancer Beam** - Continuous beam weapon
3. **Gravity Nova** - AOE damage with shader distortion effects

### Multiplayer System
- Support for 1-4 simultaneous players
- **Quick Match** - Fast matchmaking
- **Private Room** - Room code system
- **Solo Mode** - Single player experience
- **Drop-in/Drop-out** - Join or leave battles anytime
- **Server Authority** - Cloudflare Durable Objects for game logic

### Visual Effects (VFX)
- **Bloom** post-processing
- **Particle Systems** for projectiles and explosions
- **Screen Shake** for impact feedback
- **Muzzle Flash** - Sprite + PointLight + Trail Renderer + Emissive Shader
- **AOE Effects** - Perlin Noise + Shader distortion
- **Impact Feedback** - 0.1s GPU-accelerated elastic animations

## Project Structure

```
/src
  /components     # React UI components
  /game           # Core game logic
  /weapons        # Weapon systems
  /enemies        # Boss AI
  /shaders        # Custom shaders
  /effects        # Visual effects
  /multiplayer    # Multiplayer networking
  /assets         # 3D models, textures
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kuma800409-lgtm/cosmic-turret-infinity-jackpot.git

# Navigate to project directory
cd cosmic-turret-infinity-jackpot

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Development Roadmap

### Phase 1 - Foundation
- [x] Project setup with Vite + React + TypeScript
- [x] Three.js scene initialization
- [x] Basic post-processing (Bloom)
- [x] Turret controls

### Phase 2 - Weapons
- [x] Photon Repeater implementation
- [ ] Lancer Beam implementation
- [ ] Gravity Nova implementation

### Phase 3 - Enemies
- [x] Enemy spawning system
- [x] Collision detection
- [ ] Mecha-Piranha AI
- [ ] Crystal Jellyfish AI
- [ ] Void Eater Boss AI

### Phase 4 - Multiplayer
- [ ] Cloudflare Workers setup
- [ ] Durable Objects integration
- [ ] Lobby system with KV

### Phase 5 - Polish
- [ ] Advanced VFX
- [ ] Sound design
- [ ] Performance optimization

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
