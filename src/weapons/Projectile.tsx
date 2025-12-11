import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectileProps {
  position: [number, number, number]
  direction: THREE.Vector3
  speed: number
  color: string
  onDestroy: () => void
  onHit?: (position: [number, number, number], enemyType?: string) => void
}

export function Projectile({ 
  position, 
  direction, 
  speed, 
  color, 
  onDestroy, 
  onHit 
}: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const startTime = useRef(Date.now())
  const normalizedDirection = useRef(direction.clone().normalize())
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Move bullet
    const velocity = normalizedDirection.current.clone().multiplyScalar(speed * 0.016)
    meshRef.current.position.add(velocity)
    
    // Collision detection - use scene.traverse to find all enemy groups
    const bulletPos = new THREE.Vector3()
    meshRef.current.getWorldPosition(bulletPos)
    
    const enemyPos = new THREE.Vector3()
    let foundEnemy = false
    
    scene.traverse((obj) => {
      if (foundEnemy) return
      if (obj.userData?.type === 'enemy' && !obj.userData.isDying) {
        // Get world position of enemy (important since position is updated in useFrame)
        obj.getWorldPosition(enemyPos)
        const distance = bulletPos.distanceTo(enemyPos)
        
        // Collision radius: 1.0 to match enemy size
        if (distance < 1.0) {
          // Trigger damage - using 100 for one-hit kills
          if (typeof obj.userData.takeDamage === 'function') {
            obj.userData.takeDamage(100)
          }
          
          // Trigger hit callback
          if (onHit) {
            onHit(
              [bulletPos.x, bulletPos.y, bulletPos.z], 
              obj.userData.enemyType || 'basic'
            )
          }
          
          foundEnemy = true
        }
      }
    })
    
    if (foundEnemy) {
      onDestroy()
      return
    }
    
    // Lifetime: destroy after 5 seconds
    if (Date.now() - startTime.current > 5000) {
      onDestroy()
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      {/* Bullet geometry: visible sphere */}
      <sphereGeometry args={[0.5, 16, 16]} />
      {/* Glowing material for visibility */}
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={5}
        roughness={0.2}
        metalness={0.8}
        toneMapped={false}
      />
    </mesh>
  )
}
