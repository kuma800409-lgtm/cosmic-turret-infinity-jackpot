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
  
  // Time-based state for persistent nova
  const elapsedRef = useRef(0)
  const nextDamageTickRef = useRef(0.3) // First damage tick at 0.3s
  const lifeTime = 3 // Nova persists for 3 seconds
  
  useFrame((_, delta) => {
    if (!sphereRef.current) return
    
    elapsedRef.current += delta
    
    // Scale grows over lifetime then shrinks at the end
    const growPhase = Math.min(1, elapsedRef.current / 0.5) // Grow for first 0.5s
    const shrinkPhase = Math.max(0, (elapsedRef.current - (lifeTime - 0.5)) / 0.5) // Shrink in last 0.5s
    const newScale = 0.1 + growPhase * 4 - shrinkPhase * 2
    setScale(Math.max(0.1, newScale))
    
    // Opacity fades at the end
    const newOpacity = elapsedRef.current > lifeTime - 0.5 
      ? Math.max(0, 1 - (elapsedRef.current - (lifeTime - 0.5)) * 2)
      : 1
    setOpacity(newOpacity)
    
    // Apply continuous AOE damage every 0.5 seconds
    if (elapsedRef.current >= nextDamageTickRef.current && elapsedRef.current < lifeTime) {
      nextDamageTickRef.current += 0.5 // Next tick in 0.5s
      
      const novaPosition = new THREE.Vector3(...position)
      const radius = 7 // Increased radius (was 5)
      const baseDamage = 200 // Increased damage (was 100)
      
      scene.traverse((object) => {
        if (object.userData?.type === 'enemy' && object.userData?.takeDamage && !object.userData?.isDying) {
          const enemyPosition = new THREE.Vector3()
          object.getWorldPosition(enemyPosition)
          const distance = novaPosition.distanceTo(enemyPosition)
          
          if (distance < radius) {
            // Damage falls off with distance
            const falloff = 1 - distance / radius
            object.userData.takeDamage(baseDamage * falloff)
          }
        }
      })
    }
    
    // Complete animation after lifetime
    if (elapsedRef.current >= lifeTime) {
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
