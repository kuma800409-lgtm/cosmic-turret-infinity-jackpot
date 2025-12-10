import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectileProps {
  position: [number, number, number]
  direction: THREE.Vector3
  speed: number
  color: string
  onDestroy: () => void
}

export function Projectile({ position, direction, speed, color, onDestroy }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lifetime = useRef(0)
  const { scene } = useThree()
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.add(
        direction.clone().multiplyScalar(speed * delta)
      )
      
      const raycaster = new THREE.Raycaster(
        meshRef.current.position,
        direction,
        0,
        0.3
      )
      
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      for (const intersect of intersects) {
        const target = intersect.object
        if (target.userData?.type === 'enemy' && target.userData?.takeDamage) {
          target.userData.takeDamage(25)
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
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={2}
        toneMapped={false}
      />
      <pointLight color={color} intensity={1} distance={1} />
    </mesh>
  )
}
