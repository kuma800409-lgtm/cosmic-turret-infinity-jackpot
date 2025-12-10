import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EnemyProps {
  position: [number, number, number]
  onDestroy: () => void
}

export function Enemy({ position, onDestroy }: EnemyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [health, setHealth] = useState(100)
  
  useFrame((_, delta) => {
    if (meshRef.current && health > 0) {
      meshRef.current.position.z += delta * 0.5
      
      if (meshRef.current.position.z > 2) {
        onDestroy()
      }
    }
  })
  
  const takeDamage = (damage: number) => {
    setHealth(prev => {
      const newHealth = prev - damage
      if (newHealth <= 0) {
        onDestroy()
      }
      return newHealth
    })
  }
  
  if (health <= 0) return null
  
  return (
    <mesh ref={meshRef} position={position} userData={{ takeDamage, type: 'enemy' }}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial 
        color="#ff0000" 
        emissive="#ff0000"
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}
