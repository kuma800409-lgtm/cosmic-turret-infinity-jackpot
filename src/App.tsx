import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { PlayerTurret } from './game/PlayerTurret'
import { EnemySpawner } from './game/EnemySpawner'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <PlayerTurret position={[0, 0, 0]} />
      <EnemySpawner />
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

function App() {
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
        <Scene />
      </Canvas>
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
    </div>
  )
}

export default App
