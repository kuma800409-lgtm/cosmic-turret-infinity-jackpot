import { useState, useCallback } from 'react'
import { Projectile } from './Projectile'
import * as THREE from 'three'

interface PhotonRepeaterProps {
  turretPosition: THREE.Vector3
  turretRotation: number
}

export function PhotonRepeater({ turretPosition: _turretPosition, turretRotation: _turretRotation }: PhotonRepeaterProps) {
  const [projectiles, setProjectiles] = useState<Array<{
    id: number
    position: [number, number, number]
    direction: THREE.Vector3
  }>>([])
  
  const removeProjectile = useCallback((id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id))
  }, [])
  
  return (
    <>
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
