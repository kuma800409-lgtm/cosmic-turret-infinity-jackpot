import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CoinProps {
  position: THREE.Vector3
  onCollect: () => void
}

function Coin({ position, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lifetime = useRef(0)
  const collected = useRef(false)
  
  useFrame((_, delta) => {
    if (!meshRef.current || collected.current) return
    
    // Rotate coin
    meshRef.current.rotation.y += delta * 3
    
    // Float up and down
    meshRef.current.position.y = position.y + Math.sin(lifetime.current * 3) * 0.1
    
    // Move toward player
    meshRef.current.position.z += delta * 0.5
    
    lifetime.current += delta
    
    // Auto-collect when close to player
    if (meshRef.current.position.z > 1) {
      collected.current = true
      onCollect()
    }
    
    // Expire after 5 seconds
    if (lifetime.current > 5) {
      collected.current = true
      onCollect()
    }
  })
  
  if (collected.current) return null
  
  return (
    <mesh ref={meshRef} position={position.toArray()}>
      <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
      <meshStandardMaterial
        color="#ffd700"
        emissive="#ffd700"
        emissiveIntensity={2}
        metalness={0.9}
        roughness={0.1}
      />
      <pointLight color="#ffd700" intensity={2} distance={2} />
    </mesh>
  )
}

interface JackpotDisplayProps {
  coins: number
  jackpotLevel: number
  isJackpotActive: boolean
}

export function JackpotDisplay({ coins, jackpotLevel, isJackpotActive }: JackpotDisplayProps) {
  const milestones = [10, 25, 50, 100, 250, 500, 1000]
  const nextMilestone = milestones.find(m => m > coins) || milestones[milestones.length - 1]
  const progress = (coins % nextMilestone) / nextMilestone * 100
  
  return (
    <div style={{
      position: 'absolute',
      top: '100px',
      right: '20px',
      fontFamily: 'monospace',
      textAlign: 'right'
    }}>
      {/* Coin Counter */}
      <div style={{
        color: '#ffd700',
        fontSize: '18px',
        textShadow: '0 0 10px #ffd700',
        marginBottom: '5px'
      }}>
        <span style={{ fontSize: '14px', opacity: 0.7 }}>COINS: </span>
        {coins}
      </div>
      
      {/* Jackpot Level */}
      <div style={{
        color: jackpotLevel > 0 ? '#ff00ff' : '#666',
        fontSize: '14px',
        textShadow: jackpotLevel > 0 ? '0 0 10px #ff00ff' : 'none'
      }}>
        JACKPOT LV.{jackpotLevel}
      </div>
      
      {/* Progress Bar */}
      <div style={{
        width: '120px',
        height: '8px',
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid #ffd700',
        borderRadius: '4px',
        marginTop: '5px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {/* Next Milestone */}
      <div style={{
        color: '#888',
        fontSize: '10px',
        marginTop: '3px'
      }}>
        Next: {nextMilestone} coins
      </div>
      
      {/* Jackpot Active Indicator */}
      {isJackpotActive && (
        <div style={{
          color: '#ff00ff',
          fontSize: '16px',
          marginTop: '10px',
          animation: 'pulse 0.5s ease-in-out infinite',
          textShadow: '0 0 15px #ff00ff'
        }}>
          JACKPOT ACTIVE!
        </div>
      )}
    </div>
  )
}

interface CoinSpawnerProps {
  coins: Array<{ id: number; position: THREE.Vector3 }>
  onCoinCollect: (id: number) => void
}

export function CoinSpawner({ coins, onCoinCollect }: CoinSpawnerProps) {
  return (
    <>
      {coins.map(coin => (
        <Coin
          key={coin.id}
          position={coin.position}
          onCollect={() => onCoinCollect(coin.id)}
        />
      ))}
    </>
  )
}

interface GoldenEnemyProps {
  position: [number, number, number]
  onDestroy: (wasKilled: boolean, position: THREE.Vector3) => void
  onDamage?: (damage: number, position: THREE.Vector3) => void
  onReachTurret?: () => void
}

export function GoldenEnemy({ position, onDestroy, onDamage, onReachTurret }: GoldenEnemyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [health, setHealth] = useState(200) // Double health
  const [isHit, setIsHit] = useState(false)
  const [isDying, setIsDying] = useState(false)
  const deathTimeRef = useRef(0)
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    
    // Death animation
    if (isDying) {
      deathTimeRef.current += delta
      const scale = Math.max(0, 1 - deathTimeRef.current * 3)
      meshRef.current.scale.setScalar(scale * 1.2) // Slightly larger
      if (deathTimeRef.current > 0.3) {
        onDestroy(true, meshRef.current.position.clone())
      }
      return
    }
    
    if (health > 0) {
      // Slower movement
      meshRef.current.position.z += delta * 0.3
      
      // Rotate for sparkle effect
      meshRef.current.rotation.y += delta * 2
      
      if (meshRef.current.position.z > 1.5) {
        onReachTurret?.()
        onDestroy(false, meshRef.current.position.clone())
      }
    }
  })
  
  const takeDamage = (damage: number) => {
    if (isDying) return
    
    setIsHit(true)
    setTimeout(() => setIsHit(false), 100)
    
    if (meshRef.current) {
      onDamage?.(damage, meshRef.current.position.clone())
    }
    
    setHealth(prev => {
      const newHealth = prev - damage
      if (newHealth <= 0 && !isDying) {
        setIsDying(true)
      }
      return newHealth
    })
  }
  
  if (health <= 0 && !isDying) return null
  
  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={position} 
        userData={{ takeDamage, type: 'enemy', isGolden: true }}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial 
          color={isHit ? '#ffffff' : '#ffd700'}
          emissive={isHit ? '#ffffff' : '#ffd700'}
          emissiveIntensity={isHit ? 3 : 1.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Golden glow */}
      {meshRef.current && (
        <pointLight
          position={meshRef.current.position.toArray()}
          color="#ffd700"
          intensity={3}
          distance={4}
        />
      )}
    </group>
  )
}

// Hook for managing jackpot state
export function useJackpotSystem() {
  const [coins, setCoins] = useState(0)
  const [jackpotLevel, setJackpotLevel] = useState(0)
  const [isJackpotActive, setIsJackpotActive] = useState(false)
  const [coinEntities, setCoinEntities] = useState<Array<{ id: number; position: THREE.Vector3 }>>([])
  
  const milestones = [10, 25, 50, 100, 250, 500, 1000]
  
  const spawnCoin = useCallback((position: THREE.Vector3) => {
    // Random chance to spawn coin (30%)
    if (Math.random() < 0.3) {
      setCoinEntities(prev => [...prev, {
        id: Date.now() + Math.random(),
        position: position.clone()
      }])
    }
  }, [])
  
  const collectCoin = useCallback((id: number) => {
    setCoinEntities(prev => prev.filter(c => c.id !== id))
    setCoins(prev => {
      const newCoins = prev + 1
      
      // Check for milestone
      const milestone = milestones.find(m => m === newCoins)
      if (milestone) {
        setJackpotLevel(l => l + 1)
        setIsJackpotActive(true)
        setTimeout(() => setIsJackpotActive(false), 5000) // 5 second jackpot bonus
      }
      
      return newCoins
    })
  }, [])
  
  const resetJackpot = useCallback(() => {
    setCoins(0)
    setJackpotLevel(0)
    setIsJackpotActive(false)
    setCoinEntities([])
  }, [])
  
  return {
    coins,
    jackpotLevel,
    isJackpotActive,
    coinEntities,
    spawnCoin,
    collectCoin,
    resetJackpot
  }
}
