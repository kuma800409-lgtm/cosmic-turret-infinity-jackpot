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
    
    // Calculate beam dimensions based on charge level - ENHANCED for better visibility
    const baseWidth = 0.08 + chargeLevel * 0.08 // 0.08 to 0.16 (was 0.03 to 0.07)
    const glowWidth = 0.15 + chargeLevel * 0.15 // 0.15 to 0.30 (was 0.08 to 0.16)
    const pulseScale = 1 + Math.sin(pulseRef.current) * 0.15 * chargeLevel
    
    // Update beam position and rotation - start from muzzle
    const beamLength = 20 // Extended range
    // Calculate muzzle position (barrel tip)
    const muzzleOffset = turretDirection.clone().normalize().multiplyScalar(1.0)
    const beamStart = turretPosition.clone()
      .add(new THREE.Vector3(0, 0.3, 0))
      .add(muzzleOffset)
    const beamEnd = beamStart.clone().add(turretDirection.clone().multiplyScalar(beamLength))
    const beamCenter = beamStart.clone().add(beamEnd).multiplyScalar(0.5)
    
    beamRef.current.position.copy(beamCenter)
    beamRef.current.lookAt(beamEnd)
    beamRef.current.scale.set(baseWidth * pulseScale * 25, 1, baseWidth * pulseScale * 25)
    
    glowRef.current.position.copy(beamCenter)
    glowRef.current.lookAt(beamEnd)
    glowRef.current.scale.set(glowWidth * pulseScale * 15, 1, glowWidth * pulseScale * 15)
    
    // Distance-based collision detection for beam
    // Check all enemies and see if they're close to the beam line
    const enemyPos = new THREE.Vector3()
    
    scene.traverse((obj) => {
      if (obj.userData?.type === 'enemy' && obj.userData?.takeDamage && !obj.userData?.isDying) {
        obj.getWorldPosition(enemyPos)
        
        // Calculate distance from enemy to beam line
        const beamDir = turretDirection.clone().normalize()
        const toEnemy = enemyPos.clone().sub(beamStart)
        const projLength = toEnemy.dot(beamDir)
        
        // Only check enemies in front of the turret and within beam length
        if (projLength > 0 && projLength < beamLength) {
          const closestPoint = beamStart.clone().add(beamDir.multiplyScalar(projLength))
          const distToBeam = enemyPos.distanceTo(closestPoint)
          
          if (distToBeam < 1.0) { // Hit radius increased for better hit detection
            obj.userData.takeDamage(80 * delta * chargeLevel) // Increased damage (was 50)
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
      {/* Main beam - thicker and more visible */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.06, 0.10, 20, 12]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={emissiveIntensity * 1.5}
          transparent
          opacity={beamOpacity}
          toneMapped={false}
        />
      </mesh>
      
      {/* Beam glow - pulsing effect, more visible */}
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.12, 0.18, 20, 12]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={2 + chargeLevel * 2}
          transparent
          opacity={0.3 + chargeLevel * 0.3}
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
