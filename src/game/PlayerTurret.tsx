import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Projectile } from '../weapons/Projectile'
import { LancerBeam } from '../weapons/LancerBeam'
import { GravityNovaSpawner } from '../weapons/GravityNova'
import { ImpactParticlesSpawner } from '../effects/ImpactParticles'
import { useGameState } from './GameState'

interface PlayerTurretProps {
  position: [number, number, number]
  onWeaponChange?: (weapon: number) => void
  onScreenShake?: () => void
}

let projectileId = 0
let novaId = 0

export type WeaponType = 1 | 2 | 3

export function PlayerTurret({ position, onWeaponChange, onScreenShake }: PlayerTurretProps) {
  const turretRef = useRef<THREE.Group>(null)
  const rotationRef = useRef(0)
  const directionRef = useRef(new THREE.Vector3(0, 0, -1))
  const { gl, camera } = useThree()
  const { gameVersion } = useGameState()
  
  // Raycaster for mouse-to-world conversion (reuse to avoid allocation every frame)
  const raycasterRef = useRef(new THREE.Raycaster())
  const intersectionRef = useRef(new THREE.Vector3())
  // Target Z depth for aiming (where enemies typically are)
  const aimZDepth = -8
  
  // Helper function to calculate aim direction from NDC coordinates
  const calculateAimDirection = useCallback((ndc: THREE.Vector2): THREE.Vector3 => {
    const raycaster = raycasterRef.current
    raycaster.setFromCamera(ndc, camera)
    
    const target = new THREE.Vector3()
    const o = raycaster.ray.origin
    const d = raycaster.ray.direction
    
    // Intersect with fixed Z plane at aimZDepth
    if (Math.abs(d.z) > 1e-4) {
      const t = (aimZDepth - o.z) / d.z
      if (t > 0) {
        target.copy(o).addScaledVector(d, t)
      }
    }
    
    // Get turret world position
    const turretWorld = new THREE.Vector3()
    if (turretRef.current) {
      turretRef.current.getWorldPosition(turretWorld)
    }
    
    // Calculate direction from turret to target
    const dx = target.x - turretWorld.x
    const dz = target.z - turretWorld.z
    
    return new THREE.Vector3(dx, 0, dz).normalize()
  }, [camera])
  
    // Weapon state
    const [currentWeapon, setCurrentWeapon] = useState<WeaponType>(1)
  
  // Reset weapon to default when game restarts
  useEffect(() => {
    setCurrentWeapon(1)
    onWeaponChange?.(1)
  }, [gameVersion, onWeaponChange])
    const [isBeamActive, setIsBeamActive] = useState(false)
    const [muzzleFlash, setMuzzleFlash] = useState(false)
    const [recoil, setRecoil] = useState(0)
    const [weaponTransition, setWeaponTransition] = useState(0)
  
  // Cooldowns
  const [photonCooldown, setPhotonCooldown] = useState(0)
  const [novaCooldown, setNovaCooldown] = useState(0)
  
  const [projectiles, setProjectiles] = useState<Array<{
    id: number
    position: [number, number, number]
    direction: THREE.Vector3
  }>>([])
  
  const [novas, setNovas] = useState<Array<{
    id: number
    position: [number, number, number]
  }>>([])
  
  const [impacts, setImpacts] = useState<Array<{
    id: number
    position: [number, number, number]
    color: string
  }>>([])
  
  const removeProjectile = useCallback((id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id))
  }, [])
  
  const removeNova = useCallback((id: number) => {
    setNovas(prev => prev.filter(n => n.id !== id))
  }, [])
  
  const removeImpact = useCallback((id: number) => {
    setImpacts(prev => prev.filter(i => i.id !== id))
  }, [])
  
  const addImpact = useCallback((position: [number, number, number], color: string) => {
    setImpacts(prev => [...prev, {
      id: Date.now() + Math.random(),
      position,
      color
    }])
  }, [])
  
  // Photon Repeater shoot - accepts optional explicit direction
  const shootPhoton = useCallback((explicitDir?: THREE.Vector3) => {
    if (photonCooldown > 0) return
    
    // Use explicit direction if provided, otherwise fall back to directionRef
    const baseDir = explicitDir ?? directionRef.current
    const direction = baseDir.clone().normalize()
    
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
    
        // Muzzle flash
        setMuzzleFlash(true)
        setTimeout(() => setMuzzleFlash(false), 50)
    
        // Recoil animation
        setRecoil(0.15)
    
        // Screen shake
        onScreenShake?.()
    
    // Cooldown
    setPhotonCooldown(0.1)
  }, [position, photonCooldown, onScreenShake])
  
  // Gravity Nova shoot - accepts optional explicit direction
  const shootNova = useCallback((explicitDir?: THREE.Vector3) => {
    if (novaCooldown > 0) return
    
    // Use explicit direction if provided, otherwise fall back to directionRef
    const baseDir = explicitDir ?? directionRef.current
    const direction = baseDir.clone().normalize()
    
    // Increased spawn distance for longer range (was 5)
    const spawnDistance = 8
    const spawnPosition: [number, number, number] = [
      position[0] + direction.x * spawnDistance,
      position[1] + 0.5,
      position[2] + direction.z * spawnDistance
    ]
    
    setNovas(prev => [...prev, {
      id: novaId++,
      position: spawnPosition
    }])
    
      // Recoil animation (stronger for Nova)
      setRecoil(0.3)
    
      // Screen shake
      onScreenShake?.()
    
      // Reduced cooldown for faster fire rate (was 3 seconds)
      setNovaCooldown(2)
    }, [position, novaCooldown, onScreenShake])
  
  // Handle mouse events
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      // Calculate NDC coordinates from click event
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      // Calculate direction from click position
      const direction = calculateAimDirection(ndc)
      
      // Update directionRef and turret rotation for visual consistency
      directionRef.current.copy(direction)
      if (turretRef.current) {
        const angle = Math.atan2(direction.x, -direction.z)
        turretRef.current.rotation.y = angle
        rotationRef.current = angle
      }
      
      // Fire weapon with calculated direction
      if (currentWeapon === 1) {
        shootPhoton(direction)
      } else if (currentWeapon === 2) {
        setIsBeamActive(true)
      } else if (currentWeapon === 3) {
        shootNova(direction)
      }
    }
    
    const handleMouseUp = () => {
      if (currentWeapon === 2) {
        setIsBeamActive(false)
      }
    }
    
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gl, currentWeapon, shootPhoton, shootNova, calculateAimDirection])
  
  // Handle keyboard for weapon switching
  useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === '1') {
            setCurrentWeapon(1)
            setWeaponTransition(1) // Trigger transition animation
            onWeaponChange?.(1)
          } else if (e.key === '2') {
            setCurrentWeapon(2)
            setWeaponTransition(1)
            onWeaponChange?.(2)
          } else if (e.key === '3') {
            setCurrentWeapon(3)
            setWeaponTransition(1)
            onWeaponChange?.(3)
          }
        }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onWeaponChange])
  
    useFrame(({ mouse }, delta) => {
      if (turretRef.current) {
        // Use raycaster to convert mouse position to world coordinates
        const raycaster = raycasterRef.current
        raycaster.setFromCamera(mouse, camera)
        
        const target = intersectionRef.current
        const o = raycaster.ray.origin
        const d = raycaster.ray.direction
        
        // Intersect with a fixed Z plane at aimZDepth (where enemies typically are)
        // This gives us a point in the enemy zone regardless of camera angle
        if (Math.abs(d.z) > 1e-4) {
          const t = (aimZDepth - o.z) / d.z
          if (t > 0) {
            // Valid intersection in front of camera
            target.copy(o).addScaledVector(d, t)
            
            // Get turret world position
            const turretWorld = new THREE.Vector3()
            turretRef.current.getWorldPosition(turretWorld)
            
            // Calculate direction from turret to mouse intersection point
            const dx = target.x - turretWorld.x
            const dz = target.z - turretWorld.z
            
            // Calculate rotation angle (angle=0 means facing negative Z)
            const angle = Math.atan2(dx, -dz)
            
            turretRef.current.rotation.y = angle
            rotationRef.current = angle
            
            // Update direction vector for bullets and beam
            // Direction from turret to target point
            directionRef.current.set(dx, 0, dz).normalize()
          }
        }
      }
    
      // Update cooldowns
      if (photonCooldown > 0) {
        setPhotonCooldown(prev => Math.max(0, prev - delta))
      }
      if (novaCooldown > 0) {
        setNovaCooldown(prev => Math.max(0, prev - delta))
      }
    
      // Animate recoil recovery
      if (recoil > 0) {
        setRecoil(prev => Math.max(0, prev - delta * 3))
      }
    
      // Animate weapon transition
      if (weaponTransition > 0) {
        setWeaponTransition(prev => Math.max(0, prev - delta * 4))
      }
    })
  
  // Get barrel color based on weapon
  const getBarrelColor = () => {
    switch (currentWeapon) {
      case 1: return '#00ffff' // Cyan for Photon
      case 2: return '#ff0000' // Red for Lancer
      case 3: return '#aa00ff' // Purple for Nova
      default: return '#e76f51'
    }
  }
  
  return (
    <>
      <group ref={turretRef} position={position}>
        {/* Turret base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 0.3, 16]} />
          <meshStandardMaterial color="#2a9d8f" metalness={0.8} roughness={0.2} />
        </mesh>
        
                {/* Barrel with recoil animation - pointing toward -Z (toward enemies) */}
                <mesh 
                  position={[0, 0.3, -0.5 + recoil]} 
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={[1 + weaponTransition * 0.2, 1, 1 + weaponTransition * 0.2]}
                >
                  <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
                  <meshStandardMaterial 
                    color={getBarrelColor()} 
                    emissive={getBarrelColor()} 
                    emissiveIntensity={muzzleFlash ? 3 : (0.5 + weaponTransition * 2)}
                    metalness={0.9} 
                    roughness={0.1} 
                  />
                </mesh>
        
        {/* Muzzle glow point - at barrel tip toward -Z */}
        <pointLight 
          position={[0, 0.3, -1]} 
          color={getBarrelColor()} 
          intensity={muzzleFlash ? 5 : 1} 
          distance={muzzleFlash ? 4 : 2} 
        />
      </group>
      
      {/* Photon Repeater Projectiles */}
      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          position={proj.position}
          direction={proj.direction}
          speed={20}
          color="#00ffff"
          onDestroy={() => removeProjectile(proj.id)}
          onHit={(hitPos) => addImpact(hitPos, '#00ffff')}
        />
      ))}
      
      {/* Lancer Beam */}
      <LancerBeam
        isActive={isBeamActive && currentWeapon === 2}
        turretPosition={new THREE.Vector3(...position)}
        turretDirection={directionRef.current}
      />
      
      {/* Gravity Nova */}
      <GravityNovaSpawner
        novas={novas}
        onNovaComplete={removeNova}
      />
      
      {/* Impact Particles */}
      <ImpactParticlesSpawner
        impacts={impacts}
        onImpactComplete={removeImpact}
      />
    </>
  )
}
