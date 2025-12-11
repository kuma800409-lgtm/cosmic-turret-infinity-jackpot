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
  const trailRef = useRef<THREE.Points>(null)
  const lifetime = useRef(0)
  const { scene } = useThree()
  const trailPositions = useRef<Float32Array>(new Float32Array(15 * 3)) // 15 trail points
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      // Move projectile
      const moveVector = direction.clone().multiplyScalar(speed * delta)
      meshRef.current.position.add(moveVector)
      
      // Update trail positions (shift old positions back)
      if (trailRef.current) {
        const positions = trailPositions.current
        for (let i = positions.length - 3; i >= 3; i -= 3) {
          positions[i] = positions[i - 3]
          positions[i + 1] = positions[i - 2]
          positions[i + 2] = positions[i - 1]
        }
        positions[0] = meshRef.current.position.x
        positions[1] = meshRef.current.position.y
        positions[2] = meshRef.current.position.z
        trailRef.current.geometry.attributes.position.needsUpdate = true
      }
      
      // Collision detection - check bullet position against enemies
      const bulletPos = new THREE.Vector3()
      meshRef.current.getWorldPosition(bulletPos)
      
      const enemyPos = new THREE.Vector3()
      let foundEnemy = false
      const hitRadius = 1.5 // Enemy radius + bullet radius (increased for easier hits)
      
      let enemyCount = 0
      scene.traverse((obj) => {
        if (foundEnemy) return
        if (obj.userData?.type === 'enemy' && obj.userData?.takeDamage) {
          enemyCount++
          obj.getWorldPosition(enemyPos)
          
          // Simple distance-based collision detection
          // Check if enemy is within hit radius of bullet
          const dist = bulletPos.distanceTo(enemyPos)
          
          if (dist < hitRadius) {
            obj.userData.takeDamage(50) // Increased damage for easier kills
            foundEnemy = true
          }
        }
      })
      
      if (foundEnemy) {
        const hitPos: [number, number, number] = [
          bulletPos.x,
          bulletPos.y,
          bulletPos.z
        ]
        onHit?.(hitPos)
        onDestroy()
        return
      }
      
      lifetime.current += delta
      if (lifetime.current > 3) {
        onDestroy()
      }
    }
  })
  
    return (
      <group>
        {/* Main projectile core - bright center */}
        <mesh ref={meshRef} position={position}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive={color}
            emissiveIntensity={5}
            toneMapped={false}
          />
        </mesh>
      
        {/* Inner glow layer */}
        <mesh position={position}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={4}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
      
        {/* Outer glow - larger and softer */}
        <mesh position={position}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>
      
        {/* Trail particles - more particles, gradient effect */}
        <points ref={trailRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={15}
              array={trailPositions.current}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={color}
            size={0.12}
            transparent
            opacity={0.7}
            sizeAttenuation
          />
        </points>
      
        {/* Point light for glow effect - stronger */}
        <pointLight color={color} intensity={5} distance={4} />
      </group>
    )
}
