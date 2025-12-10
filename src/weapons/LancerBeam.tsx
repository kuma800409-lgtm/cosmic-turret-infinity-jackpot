import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface LancerBeamProps {
  isActive: boolean
  turretPosition: THREE.Vector3
  turretDirection: THREE.Vector3
}

export function LancerBeam({ isActive, turretPosition, turretDirection }: LancerBeamProps) {
  const beamRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points>(null)
  const { scene } = useThree()
  
  useFrame((_, delta) => {
    if (!isActive || !beamRef.current) return
    
    // Update beam position and rotation
    const beamLength = 15
    const beamStart = turretPosition.clone().add(new THREE.Vector3(0, 0.3, 0))
    const beamEnd = beamStart.clone().add(turretDirection.clone().multiplyScalar(beamLength))
    const beamCenter = beamStart.clone().add(beamEnd).multiplyScalar(0.5)
    
    beamRef.current.position.copy(beamCenter)
    beamRef.current.lookAt(beamEnd)
    
        // Damage enemies in beam path
        const raycaster = new THREE.Raycaster(beamStart, turretDirection.clone().normalize(), 0, beamLength)
        const intersects = raycaster.intersectObjects(scene.children, true)
    
        for (const intersect of intersects) {
          // Walk up the parent chain to find the enemy mesh with userData
          let target: THREE.Object3D | null = intersect.object
          while (target && !(target.userData?.type === 'enemy' && target.userData?.takeDamage)) {
            target = target.parent
          }
      
          if (target && target.userData?.type === 'enemy' && target.userData?.takeDamage) {
            target.userData.takeDamage(50 * delta) // Continuous damage
          }
        }
    
    // Update trail effect
    if (trailRef.current) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3]
        positions[i + 1] = positions[i - 2]
        positions[i + 2] = positions[i - 1]
      }
      positions[0] = beamEnd.x
      positions[1] = beamEnd.y
      positions[2] = beamEnd.z
      trailRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  if (!isActive) return null
  
  // Create trail positions
  const trailPoints = new Float32Array(30 * 3) // 30 trail points
  
  return (
    <group>
      {/* Main beam */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.03, 0.05, 15, 8]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={3}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      
      {/* Beam glow */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.08, 0.12, 15, 8]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={1}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
      
      {/* Trail particles */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={trailPoints}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff0000"
          size={0.1}
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
      
      {/* Beam light */}
      <pointLight
        position={turretPosition.toArray()}
        color="#ff0000"
        intensity={isActive ? 5 : 0}
        distance={5}
      />
    </group>
  )
}
