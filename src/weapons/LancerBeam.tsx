import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface LancerBeamProps {
  isActive: boolean
  turretPosition: THREE.Vector3
  turretDirection: THREE.Vector3
  onHit?: () => void
}

export function LancerBeam({ isActive, turretPosition, turretDirection, onHit }: LancerBeamProps) {
  const beamRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points>(null)
  const { scene } = useThree()
  
  // Charge-up state for visual effect
  const [chargeLevel, setChargeLevel] = useState(0)
  const chargeTimeRef = useRef(0)
  const pulseRef = useRef(0)
  
  // Reset charge when beam deactivates
  useEffect(() => {
    if (!isActive) {
      setChargeLevel(0)
      chargeTimeRef.current = 0
    }
  }, [isActive])
  
  useFrame((_, delta) => {
    // Handle charge-up animation (0.2 seconds to full power)
    if (isActive) {
      chargeTimeRef.current += delta
      const newCharge = Math.min(1, chargeTimeRef.current / 0.2)
      setChargeLevel(newCharge)
      
      // Pulsing effect when fully charged
      pulseRef.current += delta * 10
    }
    
    if (!isActive || !beamRef.current || !glowRef.current) return
    
    // Calculate beam dimensions based on charge level
    const baseWidth = 0.03 + chargeLevel * 0.04 // 0.03 to 0.07
    const glowWidth = 0.08 + chargeLevel * 0.08 // 0.08 to 0.16
    const pulseScale = 1 + Math.sin(pulseRef.current) * 0.1 * chargeLevel
    
    // Update beam position and rotation
    const beamLength = 15
    const beamStart = turretPosition.clone().add(new THREE.Vector3(0, 0.3, 0))
    const beamEnd = beamStart.clone().add(turretDirection.clone().multiplyScalar(beamLength))
    const beamCenter = beamStart.clone().add(beamEnd).multiplyScalar(0.5)
    
    beamRef.current.position.copy(beamCenter)
    beamRef.current.lookAt(beamEnd)
    beamRef.current.scale.set(baseWidth * pulseScale * 20, 1, baseWidth * pulseScale * 20)
    
    glowRef.current.position.copy(beamCenter)
    glowRef.current.lookAt(beamEnd)
    glowRef.current.scale.set(glowWidth * pulseScale * 10, 1, glowWidth * pulseScale * 10)
    
    // Distance-based collision detection for beam
    // Check all enemies and see if they're close to the beam line
    const enemyPos = new THREE.Vector3()
    
    scene.traverse((obj) => {
      if (obj.userData?.type === 'enemy' && obj.userData?.takeDamage) {
        obj.getWorldPosition(enemyPos)
        
        // Calculate distance from enemy to beam line
        const beamDir = turretDirection.clone().normalize()
        const toEnemy = enemyPos.clone().sub(beamStart)
        const projLength = toEnemy.dot(beamDir)
        
        // Only check enemies in front of the turret and within beam length
        if (projLength > 0 && projLength < beamLength) {
          const closestPoint = beamStart.clone().add(beamDir.multiplyScalar(projLength))
          const distToBeam = enemyPos.distanceTo(closestPoint)
          
          if (distToBeam < 0.8) { // Hit radius
            obj.userData.takeDamage(50 * delta * chargeLevel) // Continuous damage scaled by charge
            onHit?.()
          }
        }
      }
    })
    
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
  
  // Calculate visual properties based on charge
  const beamOpacity = 0.4 + chargeLevel * 0.5
  const emissiveIntensity = 1 + chargeLevel * 3
  
  return (
    <group>
      {/* Main beam - starts thin, grows thicker */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.03, 0.05, 15, 8]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={beamOpacity}
          toneMapped={false}
        />
      </mesh>
      
      {/* Beam glow - pulsing effect */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.08, 0.12, 15, 8]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={1 + chargeLevel}
          transparent
          opacity={0.2 + chargeLevel * 0.2}
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
          size={0.1 + chargeLevel * 0.05}
          transparent
          opacity={0.3 + chargeLevel * 0.4}
          sizeAttenuation
        />
      </points>
      
      {/* Beam light - intensity increases with charge */}
      <pointLight
        position={turretPosition.toArray()}
        color="#ff0000"
        intensity={3 + chargeLevel * 4}
        distance={4 + chargeLevel * 2}
      />
    </group>
  )
}
