import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ImpactParticleProps {
  position: [number, number, number]
  color: string
  onComplete: () => void
}

export function ImpactParticle({ position, color, onComplete }: ImpactParticleProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const [lifetime, setLifetime] = useState(0)
  const velocitiesRef = useRef<THREE.Vector3[]>([])
  
  // Initialize particle velocities
  if (velocitiesRef.current.length === 0) {
    for (let i = 0; i < 12; i++) {
      velocitiesRef.current.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        )
      )
    }
  }
  
  useFrame((_, delta) => {
    if (!particlesRef.current) return
    
    const newLifetime = lifetime + delta
    setLifetime(newLifetime)
    
    // Update particle positions
    const positions = particlesRef.current.geometry.attributes.position
    for (let i = 0; i < 12; i++) {
      const velocity = velocitiesRef.current[i]
      positions.setXYZ(
        i,
        positions.getX(i) + velocity.x * delta,
        positions.getY(i) + velocity.y * delta,
        positions.getZ(i) + velocity.z * delta
      )
      // Apply gravity
      velocity.y -= delta * 5
    }
    positions.needsUpdate = true
    
    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial
    material.opacity = Math.max(0, 1 - newLifetime * 3)
    
    // Remove after 0.5 seconds
    if (newLifetime > 0.5) {
      onComplete()
    }
  })
  
  // Create initial particle positions
  const particlePositions = new Float32Array(12 * 3)
  for (let i = 0; i < 12; i++) {
    particlePositions[i * 3] = position[0]
    particlePositions[i * 3 + 1] = position[1]
    particlePositions[i * 3 + 2] = position[2]
  }
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={12}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  )
}

interface ImpactParticlesSpawnerProps {
  impacts: Array<{
    id: number
    position: [number, number, number]
    color: string
  }>
  onImpactComplete: (id: number) => void
}

export function ImpactParticlesSpawner({ impacts, onImpactComplete }: ImpactParticlesSpawnerProps) {
  return (
    <>
      {impacts.map(impact => (
        <ImpactParticle
          key={impact.id}
          position={impact.position}
          color={impact.color}
          onComplete={() => onImpactComplete(impact.id)}
        />
      ))}
    </>
  )
}
