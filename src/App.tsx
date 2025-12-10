import { useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { PlayerTurret } from './game/PlayerTurret'
import { EnemySpawner } from './game/EnemySpawner'

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

interface SceneProps {
  onWeaponChange: (weapon: number) => void
  onScreenShake: () => void
  shakeIntensity: number
}

function Scene({ onWeaponChange, onScreenShake, shakeIntensity }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <PlayerTurret 
        position={[0, 0, 0]} 
        onWeaponChange={onWeaponChange}
        onScreenShake={onScreenShake}
      />
      <EnemySpawner />
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

function App() {
  const [currentWeapon, setCurrentWeapon] = useState(1)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  
  const handleWeaponChange = useCallback((weapon: number) => {
    setCurrentWeapon(weapon)
  }, [])
  
  const handleScreenShake = useCallback(() => {
    setShakeIntensity(1)
    setTimeout(() => setShakeIntensity(0), 100)
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
              style={{
                padding: '10px 20px',
                background: isActive ? w.color : 'rgba(0,0,0,0.7)',
                border: `2px solid ${w.color}`,
                borderRadius: '5px',
                color: isActive ? '#000' : w.color,
                textAlign: 'center',
                boxShadow: isActive ? `0 0 20px ${w.color}` : 'none',
                transition: 'all 0.2s ease'
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
      
      {/* Controls Help */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: '#888',
        fontFamily: 'monospace',
        fontSize: '12px',
        textAlign: 'right'
      }}>
        <div>Mouse: Aim</div>
        <div>Click: Fire</div>
        <div>1/2/3: Switch Weapon</div>
      </div>
    </div>
  )
}

export default App
