import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface GravityNovaProps {
  position: [number, number, number]
  onComplete: () => void
}

export function GravityNova({ position, onComplete }: GravityNovaProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const [scale, setScale] = useState(0.1)
  const [opacity, setOpacity] = useState(1)
  const { scene } = useThree()
  const damageApplied = useRef(false)
  
  useFrame((_, delta) => {
    if (!sphereRef.current) return
    
    // Expand the nova
    const newScale = scale + delta * 8
    setScale(newScale)
    
    // Fade out
    const newOpacity = Math.max(0, opacity - delta * 2)
    setOpacity(newOpacity)
    
    // Apply AOE damage once at peak
    if (newScale > 2 && !damageApplied.current) {
      damageApplied.current = true
      const novaPosition = new THREE.Vector3(...position)
      const radius = 5
      
      scene.traverse((object) => {
        if (object.userData?.type === 'enemy' && object.userData?.takeDamage) {
          const enemyPosition = new THREE.Vector3()
          object.getWorldPosition(enemyPosition)
          const distance = novaPosition.distanceTo(enemyPosition)
          
          if (distance < radius) {
            // Damage falls off with distance
            const damage = 100 * (1 - distance / radius)
            object.userData.takeDamage(damage)
          }
        }
      })
    }
    
    // Complete animation
    if (newOpacity <= 0) {
      onComplete()
    }
    
    // Rotate for visual effect
    sphereRef.current.rotation.x += delta * 2
    sphereRef.current.rotation.y += delta * 3
  })
  
  return (
    <group position={position}>
      {/* Main nova sphere */}
      <mesh ref={sphereRef} scale={[scale, scale, scale]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#8800ff"
          emissive="#aa00ff"
          emissiveIntensity={3}
          transparent
          opacity={opacity * 0.6}
          wireframe
          toneMapped={false}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh scale={[scale * 0.8, scale * 0.8, scale * 0.8]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#cc00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
        />
      </mesh>
      
      {/* Outer distortion ring */}
      <mesh scale={[scale * 1.2, scale * 0.3, scale * 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.2, 8, 32]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
          transparent
          opacity={opacity * 0.5}
          toneMapped={false}
        />
      </mesh>
      
      {/* Nova light */}
      <pointLight
        color="#aa00ff"
        intensity={opacity * 10}
        distance={10}
      />
    </group>
  )
}

interface GravityNovaSpawnerProps {
  novas: Array<{ id: number; position: [number, number, number] }>
  onNovaComplete: (id: number) => void
}

export function GravityNovaSpawner({ novas, onNovaComplete }: GravityNovaSpawnerProps) {
  return (
    <>
      {novas.map((nova) => (
        <GravityNova
          key={nova.id}
          position={nova.position}
          onComplete={() => onNovaComplete(nova.id)}
        />
      ))}
    </>
  )
}
