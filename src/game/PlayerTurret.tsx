import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Projectile } from '../weapons/Projectile'

interface PlayerTurretProps {
  position: [number, number, number]
}

let projectileId = 0

export function PlayerTurret({ position }: PlayerTurretProps) {
  const turretRef = useRef<THREE.Group>(null)
  const rotationRef = useRef(0)
  const { gl } = useThree()
  
  const [projectiles, setProjectiles] = useState<Array<{
    id: number
    position: [number, number, number]
    direction: THREE.Vector3
  }>>([])
  
  const removeProjectile = useCallback((id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id))
  }, [])
  
  const shoot = useCallback(() => {
    const rotation = rotationRef.current
    const direction = new THREE.Vector3(
      Math.sin(rotation),
      0,
      Math.cos(rotation)
    ).normalize()
    
    const muzzleOffset = direction.clone().multiplyScalar(1.2)
    const spawnPosition: [number, number, number] = [
      position[0] + muzzleOffset.x,
      position[1] + 0.3,
      position[2] + muzzleOffset.z
    ]
    
    setProjectiles(prev => [...prev, {
      id: projectileId++,
      position: spawnPosition,
      direction: direction
    }])
  }, [position])
  
  useEffect(() => {
    const handleClick = () => shoot()
    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [gl, shoot])
  
  useFrame(({ mouse }) => {
    if (turretRef.current) {
      const rotation = Math.atan2(mouse.x, mouse.y)
      turretRef.current.rotation.y = rotation
      rotationRef.current = rotation
    }
  })
  
  return (
    <>
      <group ref={turretRef} position={position}>
        {/* Turret base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 0.3, 16]} />
          <meshStandardMaterial color="#2a9d8f" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Barrel */}
        <mesh position={[0, 0.3, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
          <meshStandardMaterial 
            color="#e76f51" 
            emissive="#e76f51" 
            emissiveIntensity={0.5}
            metalness={0.9} 
            roughness={0.1} 
          />
        </mesh>
        
        {/* Muzzle glow point */}
        <pointLight 
          position={[0, 0.3, 1]} 
          color="#e76f51" 
          intensity={2} 
          distance={3} 
        />
      </group>
      
      {/* Projectiles */}
      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          position={proj.position}
          direction={proj.direction}
          speed={20}
          color="#00ffff"
          onDestroy={() => removeProjectile(proj.id)}
        />
      ))}
    </>
  )
}
