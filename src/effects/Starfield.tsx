import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarfieldProps {
  count?: number
  depth?: number
  speed?: number
}

export function Starfield({ count = 500, depth = 50, speed = 0.5 }: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  
  // Generate random star positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100 // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100 // y
      pos[i * 3 + 2] = -Math.random() * depth - 10 // z (behind the scene)
    }
    return pos
  }, [count, depth])
  
    // Generate random star colors (white to blue-ish)
  const colors = useMemo(() => {
    const c = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const brightness = Math.random() * 0.5 + 0.5
      c[i * 3] = brightness * (0.8 + Math.random() * 0.2) // r
      c[i * 3 + 1] = brightness * (0.8 + Math.random() * 0.2) // g
      c[i * 3 + 2] = brightness // b (slightly more blue)
    }
    return c
  }, [count])
  
  useFrame((_, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      // Move stars toward camera
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 2] += speed * delta
        
        // Reset star position when it passes the camera
        if (positions[i * 3 + 2] > 5) {
          positions[i * 3 + 2] = -depth - 10
          positions[i * 3] = (Math.random() - 0.5) * 100
          positions[i * 3 + 1] = (Math.random() - 0.5) * 100
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// Nebula background effect
export function NebulaBackground() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation for ambient effect
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.02
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -30]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="#0a0a20"
        transparent
        opacity={0.5}
      />
    </mesh>
  )
}
