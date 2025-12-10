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
      
      // Collision detection
      const raycaster = new THREE.Raycaster(
        meshRef.current.position,
        direction,
        0,
        0.5
      )
      
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      for (const intersect of intersects) {
        const target = intersect.object
        if (target.userData?.type === 'enemy' && target.userData?.takeDamage) {
          target.userData.takeDamage(25)
          const hitPos: [number, number, number] = [
            meshRef.current.position.x,
            meshRef.current.position.y,
            meshRef.current.position.z
          ]
          onHit?.(hitPos)
          onDestroy()
          return
        }
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
