import { useState, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { PlayerTurret } from './game/PlayerTurret'
import { EnemySpawner } from './game/EnemySpawner'
import { GameProvider, useGameState } from './game/GameState'
import { ScoreDisplay, HealthBar, GameOverScreen, ScorePopup } from './components/GameUI'

// Screen shake camera component
function ShakeCamera({ shakeIntensity }: { shakeIntensity: number }) {
  useFrame(({ camera }) => {
    if (shakeIntensity > 0) {
      camera.position.x = (Math.random() - 0.5) * shakeIntensity * 0.1
      camera.position.y = 5 + (Math.random() - 0.5) * shakeIntensity * 0.1
    } else {
      camera.position.x = 0
      camera.position.y = 5
    }
  })
  
  return null
}

// Explosion particles component
function ExplosionParticles({ position, onComplete }: { position: THREE.Vector3; onComplete: () => void }) {
  const particlesRef = useRef<THREE.Points>(null)
  const velocitiesRef = useRef<THREE.Vector3[]>([])
  const lifetimeRef = useRef(0)
  
  // Initialize velocities
  if (velocitiesRef.current.length === 0) {
    for (let i = 0; i < 20; i++) {
      velocitiesRef.current.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        )
      )
    }
  }
  
  useFrame((_, delta) => {
    if (!particlesRef.current) return
    
    lifetimeRef.current += delta
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < 20; i++) {
      const vel = velocitiesRef.current[i]
      positions[i * 3] += vel.x * delta
      positions[i * 3 + 1] += vel.y * delta
      positions[i * 3 + 2] += vel.z * delta
      vel.y -= delta * 3 // gravity
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    
    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial
    material.opacity = Math.max(0, 1 - lifetimeRef.current * 2)
    
    if (lifetimeRef.current > 0.5) {
      onComplete()
    }
  })
  
  const positions = new Float32Array(20 * 3)
  for (let i = 0; i < 20; i++) {
    positions[i * 3] = position.x
    positions[i * 3 + 1] = position.y
    positions[i * 3 + 2] = position.z
  }
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={20}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff4400"
        size={0.15}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  )
}

interface SceneProps {
  onWeaponChange: (weapon: number) => void
  onScreenShake: () => void
  shakeIntensity: number
  onEnemyKilled: (position: THREE.Vector3) => void
  onEnemyDamaged: (damage: number, position: THREE.Vector3) => void
  onEnemyReachTurret: () => void
  explosions: Array<{ id: number; position: THREE.Vector3 }>
  onExplosionComplete: (id: number) => void
  isPaused: boolean
  isGameOver: boolean
}

function Scene({ 
  onWeaponChange, 
  onScreenShake, 
  shakeIntensity,
  onEnemyKilled,
  onEnemyDamaged,
  onEnemyReachTurret,
  explosions,
  onExplosionComplete,
  isPaused,
  isGameOver
}: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <PlayerTurret 
        position={[0, 0, 0]} 
        onWeaponChange={onWeaponChange}
        onScreenShake={onScreenShake}
      />
      <EnemySpawner 
        onEnemyKilled={onEnemyKilled}
        onEnemyDamaged={onEnemyDamaged}
        onEnemyReachTurret={onEnemyReachTurret}
        isPaused={isPaused}
        isGameOver={isGameOver}
      />
      {explosions.map(exp => (
        <ExplosionParticles
          key={exp.id}
          position={exp.position}
          onComplete={() => onExplosionComplete(exp.id)}
        />
      ))}
      <ShakeCamera shakeIntensity={shakeIntensity} />
      <OrbitControls />
      <EffectComposer>
        <Bloom 
          intensity={2.0} 
          luminanceThreshold={0.4} 
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

// Weapon names and colors
const weaponInfo = {
  1: { name: 'Photon Repeater', color: '#00ffff', description: 'Fast projectiles' },
  2: { name: 'Lancer Beam', color: '#ff0000', description: 'Hold to fire beam' },
  3: { name: 'Gravity Nova', color: '#aa00ff', description: 'AOE explosion' }
}

// Inner App component that uses game state
function GameContent() {
  const { addScore, addKill, takeDamage, isPaused, isGameOver } = useGameState()
  const [currentWeapon, setCurrentWeapon] = useState(1)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [explosions, setExplosions] = useState<Array<{ id: number; position: THREE.Vector3 }>>([])
  const [scorePopups, setScorePopups] = useState<Array<{ id: number; score: number; position: { x: number; y: number } }>>([])
  
  const handleWeaponChange = useCallback((weapon: number) => {
    setCurrentWeapon(weapon)
  }, [])
  
  const handleScreenShake = useCallback(() => {
    setShakeIntensity(1)
    setTimeout(() => setShakeIntensity(0), 100)
  }, [])
  
  const handleEnemyKilled = useCallback((position: THREE.Vector3) => {
    addKill()
    addScore(100, currentWeapon)
    setExplosions(prev => [...prev, { id: Date.now(), position }])
    setShakeIntensity(2)
    setTimeout(() => setShakeIntensity(0), 150)
    setScorePopups(prev => [...prev, {
      id: Date.now(),
      score: 100,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 }
    }])
  }, [addKill, addScore, currentWeapon])
  
  const handleEnemyDamaged = useCallback((_damage: number, _position: THREE.Vector3) => {
    // Could add damage numbers here
  }, [])
  
  const handleEnemyReachTurret = useCallback(() => {
    takeDamage(10)
    setShakeIntensity(3)
    setTimeout(() => setShakeIntensity(0), 200)
  }, [takeDamage])
  
  const handleExplosionComplete = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id))
  }, [])
  
  const handleScorePopupComplete = useCallback((id: number) => {
    setScorePopups(prev => prev.filter(p => p.id !== id))
  }, [])
  
  const weapon = weaponInfo[currentWeapon as keyof typeof weaponInfo]
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        camera={{
          fov: 75,
          position: [0, 5, 10],
          near: 0.1,
          far: 1000
        }}
      >
        <Scene 
          onWeaponChange={handleWeaponChange}
          onScreenShake={handleScreenShake}
          shakeIntensity={shakeIntensity}
          onEnemyKilled={handleEnemyKilled}
          onEnemyDamaged={handleEnemyDamaged}
          onEnemyReachTurret={handleEnemyReachTurret}
          explosions={explosions}
          onExplosionComplete={handleExplosionComplete}
          isPaused={isPaused}
          isGameOver={isGameOver}
        />
      </Canvas>
      
      {/* Game Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#00ffff',
        fontFamily: 'monospace',
        fontSize: '24px',
        textShadow: '0 0 10px #00ffff'
      }}>
        Cosmic Turret Infinity Jackpot
      </div>
      
      {/* Score Display */}
      <ScoreDisplay />
      
      {/* Health Bar */}
      <HealthBar />
      
      {/* Score Popups */}
      {scorePopups.map(popup => (
        <ScorePopup
          key={popup.id}
          score={popup.score}
          position={popup.position}
          onComplete={() => handleScorePopupComplete(popup.id)}
        />
      ))}
      
      {/* Weapon UI */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        fontFamily: 'monospace'
      }}>
        {[1, 2, 3].map((num) => {
          const w = weaponInfo[num as keyof typeof weaponInfo]
          const isActive = currentWeapon === num
          return (
            <div
              key={num}
              onClick={() => {
                setCurrentWeapon(num)
                window.dispatchEvent(new KeyboardEvent('keydown', { key: String(num) }))
              }}
              style={{
                padding: '10px 20px',
                background: isActive ? w.color : 'rgba(0,0,0,0.7)',
                border: `2px solid ${w.color}`,
                borderRadius: '5px',
                color: isActive ? '#000' : w.color,
                textAlign: 'center',
                boxShadow: isActive ? `0 0 20px ${w.color}` : 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{num}</div>
              <div style={{ fontSize: '12px' }}>{w.name}</div>
            </div>
          )
        })}
      </div>
      
      {/* Current Weapon Info */}
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: weapon.color,
        fontFamily: 'monospace',
        fontSize: '14px',
        textShadow: `0 0 10px ${weapon.color}`,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{weapon.name}</div>
        <div>{weapon.description}</div>
        <div style={{ marginTop: '5px', opacity: 0.7 }}>Press 1/2/3 to switch weapons</div>
      </div>
      
      {/* Game Over Screen */}
      <GameOverScreen />
    </div>
  )
}

function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}

export default App
