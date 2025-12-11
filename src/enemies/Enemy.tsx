import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EnemyProps {
  position: [number, number, number]
  onDestroy: (wasKilled: boolean, position: THREE.Vector3) => void
  onDamage?: (damage: number, position: THREE.Vector3) => void
  onReachTurret?: () => void
}

export function Enemy({ position, onDestroy, onDamage, onReachTurret }: EnemyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [health, setHealth] = useState(100)
  const [isHit, setIsHit] = useState(false)
  const [isDying, setIsDying] = useState(false)
  const deathTimeRef = useRef(0)
  const healthRef = useRef(100)
  const isDyingRef = useRef(false)
  
    useFrame((state, delta) => {
      if (!meshRef.current) return
    
      // Death animation
      if (isDying) {
        deathTimeRef.current += delta
        const scale = Math.max(0, 1 - deathTimeRef.current * 3)
        meshRef.current.scale.setScalar(scale)
        // Spin faster when dying
        meshRef.current.rotation.y += delta * 15
        meshRef.current.rotation.x += delta * 10
        if (deathTimeRef.current > 0.3) {
          onDestroy(true, meshRef.current.position.clone())
        }
        return
      }
    
      if (health > 0) {
        meshRef.current.position.z += delta * 0.5
      
        // Rotation animation - enemies spin as they approach
        meshRef.current.rotation.y += delta * 2
        meshRef.current.rotation.x += delta * 0.5
      
        // Pulsing scale effect
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05
        meshRef.current.scale.setScalar(pulse)
      
        // Enemy reached turret - deal damage
        if (meshRef.current.position.z > 1.5) {
          onReachTurret?.()
          onDestroy(false, meshRef.current.position.clone())
        }
      }
    })
  
  const takeDamage = useCallback((damage: number) => {
    if (isDyingRef.current) return
    
    // Flash effect
    setIsHit(true)
    setTimeout(() => setIsHit(false), 100)
    
    // Report damage for UI
    if (meshRef.current) {
      onDamage?.(damage, meshRef.current.position.clone())
    }
    
    // Update health using ref for immediate access
    healthRef.current -= damage
    setHealth(healthRef.current)
    
    if (healthRef.current <= 0 && !isDyingRef.current) {
      isDyingRef.current = true
      setIsDying(true)
    }
  }, [onDamage])
  
  // Update userData when takeDamage changes
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = { takeDamage, type: 'enemy' }
    }
  }, [takeDamage])
  
  if (health <= 0 && !isDying) return null
  
  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial 
          color={isHit ? '#ffffff' : '#ff0000'}
          emissive={isHit ? '#ffffff' : '#ff0000'}
          emissiveIntensity={isHit ? 3 : 0.5}
        />
      </mesh>
      
      {/* Hit flash light */}
      {isHit && meshRef.current && (
        <pointLight
          position={meshRef.current.position.toArray()}
          color="#ffffff"
          intensity={5}
          distance={3}
        />
      )}
    </group>
  )
}
