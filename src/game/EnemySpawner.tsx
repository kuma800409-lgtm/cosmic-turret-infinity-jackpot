import { useState, useEffect } from 'react'
import * as THREE from 'three'
import { Enemy } from '../enemies/Enemy'

interface EnemySpawnerProps {
  onEnemyKilled?: (position: THREE.Vector3) => void
  onEnemyDamaged?: (damage: number, position: THREE.Vector3) => void
  onEnemyReachTurret?: () => void
  isPaused?: boolean
  isGameOver?: boolean
}

export function EnemySpawner({ 
  onEnemyKilled, 
  onEnemyDamaged, 
  onEnemyReachTurret,
  isPaused,
  isGameOver 
}: EnemySpawnerProps) {
  const [enemies, setEnemies] = useState<Array<{
    id: number
    position: [number, number, number]
  }>>([])
  
  useEffect(() => {
    if (isPaused || isGameOver) return
    
    const interval = setInterval(() => {
      const x = (Math.random() - 0.5) * 5
      const z = -10
      setEnemies(prev => [...prev, {
        id: Date.now(),
        position: [x, 0.5, z]
      }])
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isPaused, isGameOver])
  
  // Reset enemies when game restarts
  useEffect(() => {
    if (isGameOver === false) {
      setEnemies([])
    }
  }, [isGameOver])
  
  const removeEnemy = (id: number, wasKilled: boolean, position: THREE.Vector3) => {
    setEnemies(prev => prev.filter(e => e.id !== id))
    if (wasKilled) {
      onEnemyKilled?.(position)
    }
  }
  
  return (
    <>
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          position={enemy.position}
          onDestroy={(wasKilled, pos) => removeEnemy(enemy.id, wasKilled, pos)}
          onDamage={onEnemyDamaged}
          onReachTurret={onEnemyReachTurret}
        />
      ))}
    </>
  )
}
