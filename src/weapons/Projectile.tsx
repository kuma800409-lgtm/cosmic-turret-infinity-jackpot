import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectileProps {
  position: [number, number, number]
  direction: THREE.Vector3
  speed: number
  color: string
  onDestroy: () => void
  onHit?: (position: [number, number, number]) => void
}

export function Projectile({ position, direction, speed, color, onDestroy, onHit }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lifetime = useRef(0)
  const { scene } = useThree()
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    
    // Move projectile
    const moveVector = direction.clone().multiplyScalar(speed * delta)
    meshRef.current.position.add(moveVector)
    
    // Collision detection - use scene.traverse to find nested enemy meshes
    const bulletPos = new THREE.Vector3()
    meshRef.current.getWorldPosition(bulletPos)
    
    const enemyPos = new THREE.Vector3()
    let foundEnemy = false
    const hitRadius = 1.0 // Collision radius matching user spec
    
    scene.traverse((obj) => {
      if (foundEnemy) return
      if (obj.userData?.type === 'enemy' && obj.userData?.takeDamage) {
        obj.getWorldPosition(enemyPos)
        const dist = bulletPos.distanceTo(enemyPos)
        
        if (dist < hitRadius) {
          obj.userData.takeDamage(25) // 25 damage per hit (4 hits to kill)
          foundEnemy = true
        }
      }
    })
    
    if (foundEnemy) {
      const hitPos: [number, number, number] = [bulletPos.x, bulletPos.y, bulletPos.z]
      onHit?.(hitPos)
      onDestroy()
      return
    }
    
    // Lifetime check (5 seconds)
    lifetime.current += delta
    if (lifetime.current > 5) {
      onDestroy()
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={6}
        toneMapped={false}
      />
    </mesh>
  )
}
