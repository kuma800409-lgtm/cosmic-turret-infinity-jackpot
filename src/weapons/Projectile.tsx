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
      meshRef.current.position.add(
        direction.clone().multiplyScalar(speed * delta)
      )
      
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
      
      // Swept collision detection - check along bullet's path
      const bulletPos = new THREE.Vector3()
      meshRef.current.getWorldPosition(bulletPos)
      
      // Calculate previous position (where bullet was before this frame's movement)
      const moveDistance = speed * delta
      const prevPos = bulletPos.clone().sub(direction.clone().multiplyScalar(moveDistance))
      
      const enemyPos = new THREE.Vector3()
      let foundEnemy = false
      const hitRadius = 0.6 // Enemy radius + bullet radius
      
      scene.traverse((obj) => {
        if (foundEnemy) return
        if (obj.userData?.type === 'enemy' && obj.userData?.takeDamage) {
          obj.getWorldPosition(enemyPos)
          
          // Check if enemy is close to the line segment from prevPos to bulletPos
          // Using point-to-line-segment distance
          const lineDir = bulletPos.clone().sub(prevPos)
          const lineLength = lineDir.length()
          if (lineLength > 0) {
            lineDir.normalize()
            const toEnemy = enemyPos.clone().sub(prevPos)
            const projLength = toEnemy.dot(lineDir)
            
            // Clamp to line segment
            const clampedProj = Math.max(0, Math.min(lineLength, projLength))
            const closestPoint = prevPos.clone().add(lineDir.multiplyScalar(clampedProj))
            const dist = enemyPos.distanceTo(closestPoint)
            
            if (dist < hitRadius) {
              obj.userData.takeDamage(25)
              foundEnemy = true
            }
          } else {
            // No movement, just check distance
            const dist = bulletPos.distanceTo(enemyPos)
            if (dist < hitRadius) {
              obj.userData.takeDamage(25)
              foundEnemy = true
            }
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
      {/* Main projectile - larger and brighter */}
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh position={position}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.4}
          toneMapped={false}
        />
      </mesh>
      
      {/* Trail particles */}
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
          size={0.08}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      
      {/* Point light for glow effect */}
      <pointLight color={color} intensity={3} distance={3} />
    </group>
  )
}
