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
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [health, setHealth] = useState(100)
  const [isHit, setIsHit] = useState(false)
  const [isDying, setIsDying] = useState(false)
  const deathTimeRef = useRef(0)
  const healthRef = useRef(100)
  const isDyingRef = useRef(false)
  
    useFrame((state, delta) => {
      if (!groupRef.current || !meshRef.current) return
    
      // Death animation
      if (isDying) {
        deathTimeRef.current += delta
        const scale = Math.max(0, 1 - deathTimeRef.current * 3)
        meshRef.current.scale.setScalar(scale)
        // Spin faster when dying
        meshRef.current.rotation.y += delta * 15
        meshRef.current.rotation.x += delta * 10
        if (deathTimeRef.current > 0.3) {
          onDestroy(true, groupRef.current.position.clone())
        }
        return
      }
    
      if (health > 0) {
        // Move the group (which holds the position)
        // Reduced speed by 30% (was 0.5)
        groupRef.current.position.z += delta * 0.35
      
        // Rotation animation - enemies spin as they approach
        meshRef.current.rotation.y += delta * 2
        meshRef.current.rotation.x += delta * 0.5
      
        // Pulsing scale effect
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05
        meshRef.current.scale.setScalar(pulse)
      
        // Enemy reached turret - deal damage
        if (groupRef.current.position.z > 1.5) {
          onReachTurret?.()
          onDestroy(false, groupRef.current.position.clone())
        }
      }
    })
  
  const takeDamage = useCallback((damage: number) => {
    if (isDyingRef.current) return
    
    // Flash effect
    setIsHit(true)
    setTimeout(() => setIsHit(false), 100)
    
    // Report damage for UI
    if (groupRef.current) {
      onDamage?.(damage, groupRef.current.position.clone())
    }
    
    // Update health using ref for immediate access
    healthRef.current -= damage
    setHealth(healthRef.current)
    
    if (healthRef.current <= 0 && !isDyingRef.current) {
      isDyingRef.current = true
      setIsDying(true)
    }
  }, [onDamage])
  
  // Update userData on the GROUP (not mesh) so scene.traverse can find it
  // Also update when isDying changes to prevent multiple hits on dying enemies
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { takeDamage, type: 'enemy', isDying }
    }
  }, [takeDamage, isDying])
  
  if (health <= 0 && !isDying) return null
  
  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial 
          color={isHit ? '#ffffff' : '#ff0000'}
          emissive={isHit ? '#ffffff' : '#ff0000'}
          emissiveIntensity={isHit ? 3 : 0.5}
        />
      </mesh>
      
      {/* Hit flash light */}
      {isHit && (
        <pointLight
          position={[0, 0, 0]}
          color="#ffffff"
          intensity={5}
          distance={3}
        />
      )}
    </group>
  )
}
