import { useState, useEffect } from 'react'
import { Enemy } from '../enemies/Enemy'

export function EnemySpawner() {
  const [enemies, setEnemies] = useState<Array<{
    id: number
    position: [number, number, number]
  }>>([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      const x = (Math.random() - 0.5) * 5
      const z = -10
      setEnemies(prev => [...prev, {
        id: Date.now(),
        position: [x, 0.5, z]
      }])
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  const removeEnemy = (id: number) => {
    setEnemies(prev => prev.filter(e => e.id !== id))
  }
  
  return (
    <>
      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          position={enemy.position}
          onDestroy={() => removeEnemy(enemy.id)}
        />
      ))}
    </>
  )
}
