import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import type { Mesh } from 'three'

function RotatingCube() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.7
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#004444"
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <RotatingCube />
      <OrbitControls />
      <EffectComposer>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.9} 
          luminanceSmoothing={0.9}
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
