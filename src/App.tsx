import { useState, useCallback, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
// OrbitControls removed - camera is now fixed above turret
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { PlayerTurret } from './game/PlayerTurret'
import { EnemySpawner } from './game/EnemySpawner'
import { GameProvider, useGameState } from './game/GameState'
import { AudioProvider, useAudio } from './audio/AudioManager'
import { ScoreDisplay, HealthBar, GameOverScreen, ScorePopup } from './components/GameUI'
import { PauseMenu, PauseButton } from './components/PauseMenu'
import { JackpotDisplay, CoinSpawner, useJackpotSystem } from './game/JackpotSystem'
import { Starfield } from './effects/Starfield'

// Screen shake camera component - camera is fixed above turret
function ShakeCamera({ shakeIntensity }: { shakeIntensity: number }) {
  useFrame(({ camera }) => {
    // Base camera position: fixed above and behind turret
    const baseX = 0
    const baseY = 3.5
    const baseZ = 7
    
    if (shakeIntensity > 0) {
      // Apply shake as small offset from base position
      camera.position.x = baseX + (Math.random() - 0.5) * shakeIntensity * 0.1
      camera.position.y = baseY + (Math.random() - 0.5) * shakeIntensity * 0.1
      camera.position.z = baseZ + (Math.random() - 0.5) * shakeIntensity * 0.05
    } else {
      // Reset to base position when no shake
      camera.position.x = baseX
      camera.position.y = baseY
      camera.position.z = baseZ
    }
    
    // Always look at turret center
    camera.lookAt(0, 0.5, 0)
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
  coinEntities: Array<{ id: number; position: THREE.Vector3 }>
  onCoinCollect: (id: number) => void
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
  isGameOver,
  coinEntities,
  onCoinCollect
}: SceneProps) {
  return (
    <>
      {/* Starfield background */}
      <Starfield count={500} depth={50} speed={0.5} />
      
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
      <CoinSpawner coins={coinEntities} onCoinCollect={onCoinCollect} />
      <ShakeCamera shakeIntensity={shakeIntensity} />
      {/* OrbitControls removed - camera is now fixed above turret */}
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

// Game Tutorial Component
function GameTutorial({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 5000) // Auto-dismiss after 5 seconds
    
    return () => clearTimeout(timer)
  }, [onDismiss])
  
  const handleClick = () => {
    setVisible(false)
    onDismiss()
  }
  
  if (!visible) return null
  
  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 20, 40, 0.95)',
        border: '2px solid #00ffff',
        borderRadius: '10px',
        padding: '30px 40px',
        fontFamily: 'monospace',
        color: '#00ffff',
        textAlign: 'center',
        zIndex: 800,
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
        cursor: 'pointer',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textShadow: '0 0 10px #00ffff' }}>
        HOW TO PLAY
      </div>
      <div style={{ fontSize: '16px', lineHeight: '2', textAlign: 'left' }}>
        <div><span style={{ color: '#ffff00' }}>Mouse:</span> Aim and Fire</div>
        <div><span style={{ color: '#ffff00' }}>1/2/3:</span> Switch Weapons</div>
        <div><span style={{ color: '#ffff00' }}>ESC:</span> Pause Game</div>
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#ff8800' }}>
        Destroy enemies before they reach the turret!
      </div>
      <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.6 }}>
        Click anywhere to dismiss
      </div>
    </div>
  )
}

// Inner App component that uses game state
function GameContent() {
  const { addScore, addKill, takeDamage, isPaused, isGameOver, pauseGame } = useGameState()
  const { playShoot, playHit, playExplosion, playDamage, playUIClick, startBeamSound, stopBeamSound, toggleMusic, isMusicPlaying } = useAudio()
  const { coins, jackpotLevel, isJackpotActive, coinEntities, spawnCoin, collectCoin } = useJackpotSystem()
  const [currentWeapon, setCurrentWeapon] = useState(1)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [explosions, setExplosions] = useState<Array<{ id: number; position: THREE.Vector3 }>>([])
  const [scorePopups, setScorePopups] = useState<Array<{ id: number; score: number; position: { x: number; y: number } }>>([])
  const [showTutorial, setShowTutorial] = useState(true)
  const [isBeamFiring, setIsBeamFiring] = useState(false)
  
  // Handle beam sound based on weapon and firing state
  useEffect(() => {
    if (currentWeapon === 2 && isBeamFiring) {
      startBeamSound()
    } else {
      stopBeamSound()
    }
    return () => stopBeamSound()
  }, [currentWeapon, isBeamFiring, startBeamSound, stopBeamSound])
  
  // Track mouse state for beam weapon
  useEffect(() => {
    const handleMouseDown = () => {
      if (currentWeapon === 2) {
        setIsBeamFiring(true)
      }
    }
    const handleMouseUp = () => {
      setIsBeamFiring(false)
    }
    
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [currentWeapon])
  
  const handleWeaponChange = useCallback((weapon: number) => {
    setCurrentWeapon(weapon)
    playUIClick()
  }, [playUIClick])
  
  const handleScreenShake = useCallback(() => {
    setShakeIntensity(1)
    setTimeout(() => setShakeIntensity(0), 100)
    playShoot(currentWeapon)
  }, [playShoot, currentWeapon])
  
  const handleEnemyKilled = useCallback((position: THREE.Vector3) => {
    addKill()
    // Jackpot bonus: 2x score when active
    const baseScore = isJackpotActive ? 200 : 100
    addScore(baseScore, currentWeapon)
    setExplosions(prev => [...prev, { id: Date.now(), position }])
    setShakeIntensity(2)
    setTimeout(() => setShakeIntensity(0), 150)
    setScorePopups(prev => [...prev, {
      id: Date.now(),
      score: baseScore,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 }
    }])
    playExplosion()
    // Spawn coin at enemy death position
    spawnCoin(position)
  }, [addKill, addScore, currentWeapon, playExplosion, isJackpotActive, spawnCoin])
  
  const handleEnemyDamaged = useCallback((_damage: number, _position: THREE.Vector3) => {
    playHit()
  }, [playHit])
  
  const handleEnemyReachTurret = useCallback(() => {
    takeDamage(10)
    setShakeIntensity(3)
    setTimeout(() => setShakeIntensity(0), 200)
    playDamage()
  }, [takeDamage, playDamage])
  
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
          position: [0, 3.5, 7], // Closer to turret for more immersive feel (was [0, 5, 10])
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
                  coinEntities={coinEntities}
                  onCoinCollect={collectCoin}
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
      
            {/* Jackpot Display */}
            <JackpotDisplay 
              coins={coins}
              jackpotLevel={jackpotLevel}
              isJackpotActive={isJackpotActive}
            />
      
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
                      playUIClick()
                      window.dispatchEvent(new KeyboardEvent('keydown', { key: String(num) }))
                    }}
                    style={{
                      padding: '10px 20px',
                      background: isActive ? w.color : 'rgba(0,0,0,0.7)',
                      border: `2px solid ${w.color}`,
                      borderRadius: '5px',
                      color: isActive ? '#000' : w.color,
                      textAlign: 'center',
                      boxShadow: isActive ? `0 0 20px ${w.color}` : `0 0 5px ${w.color}44`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.boxShadow = `0 0 15px ${w.color}88`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      if (!isActive) {
                        e.currentTarget.style.boxShadow = `0 0 5px ${w.color}44`
                      }
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
      
      {/* Music Toggle Button */}
      <button
        onClick={toggleMusic}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.7)',
          border: '2px solid #00ffff',
          borderRadius: '5px',
          color: '#00ffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          cursor: 'pointer',
          textShadow: '0 0 5px #00ffff'
        }}
      >
        {isMusicPlaying ? 'MUSIC: ON' : 'MUSIC: OFF'}
      </button>
      
      {/* Pause Button */}
      <PauseButton onClick={() => { pauseGame(); playUIClick(); }} />
      
      {/* Pause Menu */}
      <PauseMenu 
        onResume={() => {}}
        onRestart={() => {}}
      />
      
      {/* Game Over Screen */}
      <GameOverScreen />
      
      {/* Game Tutorial - shows on first load */}
      {showTutorial && !isGameOver && !isPaused && (
        <GameTutorial onDismiss={() => setShowTutorial(false)} />
      )}
    </div>
  )
}

function App() {
  return (
    <AudioProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </AudioProvider>
  )
}

export default App
