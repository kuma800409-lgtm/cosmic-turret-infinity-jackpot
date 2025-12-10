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
  const directionRef = useRef(new THREE.Vector3(0, 0, 1))
  const { gl } = useThree()
  const { gameVersion } = useGameState()
  
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
  
  // Photon Repeater shoot
  const shootPhoton = useCallback(() => {
    if (photonCooldown > 0) return
    
    const rotation = rotationRef.current
    // Direction should point towards negative Z (where enemies are)
    // When mouse is at top of screen, mouse.y is positive, rotation is ~0
    // We need to negate Z so bullets go towards enemies (negative Z)
    const direction = new THREE.Vector3(
      -Math.sin(rotation),
      0,
      -Math.cos(rotation)
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
  
  // Gravity Nova shoot
  const shootNova = useCallback(() => {
    if (novaCooldown > 0) return
    
    const rotation = rotationRef.current
    // Direction should point towards negative Z (where enemies are)
    const direction = new THREE.Vector3(
      -Math.sin(rotation),
      0,
      -Math.cos(rotation)
    ).normalize()
    
    const spawnDistance = 5
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
    
      // Cooldown (3 seconds)
      setNovaCooldown(3)
    }, [position, novaCooldown, onScreenShake])
  
  // Handle mouse events
  useEffect(() => {
    const handleMouseDown = () => {
      if (currentWeapon === 1) {
        shootPhoton()
      } else if (currentWeapon === 2) {
        setIsBeamActive(true)
      } else if (currentWeapon === 3) {
        shootNova()
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
  }, [gl, currentWeapon, shootPhoton, shootNova])
  
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
        const rotation = Math.atan2(mouse.x, mouse.y)
        turretRef.current.rotation.y = rotation
        rotationRef.current = rotation
      
        // Update direction for beam (towards negative Z where enemies are)
        directionRef.current.set(
          -Math.sin(rotation),
          0,
          -Math.cos(rotation)
        ).normalize()
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
        
                {/* Barrel with recoil animation */}
                <mesh 
                  position={[0, 0.3, 0.5 - recoil]} 
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
        
        {/* Muzzle glow point - intensity increases to 5 when firing */}
        <pointLight 
          position={[0, 0.3, 1]} 
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
