import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface GameState {
  score: number
  kills: number
  combo: number
  comboMultiplier: number
  health: number
  maxHealth: number
  isGameOver: boolean
  isPaused: boolean
  gameVersion: number // Increments on reset to trigger component resets
}

interface GameContextType extends GameState {
  addScore: (baseScore: number, weaponType: number) => void
  addKill: () => void
  takeDamage: (damage: number) => void
  resetGame: () => void
  pauseGame: () => void
  resumeGame: () => void
}

const initialState: GameState = {
  score: 0,
  kills: 0,
  combo: 0,
  comboMultiplier: 1,
  health: 150,    // Increased from 100 for better survivability
  maxHealth: 150, // Increased from 100 for better survivability
  isGameOver: false,
  isPaused: false,
  gameVersion: 0
}

const GameContext = createContext<GameContextType | null>(null)

export function useGameState() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider')
  }
  return context
}

interface GameProviderProps {
  children: React.ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, setState] = useState<GameState>(initialState)
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const addScore = useCallback((baseScore: number, weaponType: number) => {
    setState(prev => {
      // Weapon multipliers
      const weaponMultipliers: Record<number, number> = {
        1: 1,    // Photon Repeater - standard
        2: 1.5,  // Lancer Beam - bonus for continuous damage
        3: 2     // Gravity Nova - bonus for AOE
      }
      
      const weaponMult = weaponMultipliers[weaponType] || 1
      const finalScore = Math.round(baseScore * prev.comboMultiplier * weaponMult)
      
      return {
        ...prev,
        score: prev.score + finalScore
      }
    })
  }, [])
  
  const addKill = useCallback(() => {
    // Clear existing combo timeout
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current)
    }
    
    setState(prev => {
      const newCombo = prev.combo + 1
      // Combo multiplier increases every 5 kills
      const newMultiplier = 1 + Math.floor(newCombo / 5) * 0.5
      
      return {
        ...prev,
        kills: prev.kills + 1,
        combo: newCombo,
        comboMultiplier: Math.min(newMultiplier, 5) // Cap at 5x
      }
    })
    
    // Reset combo after 3 seconds of no kills
    comboTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        combo: 0,
        comboMultiplier: 1
      }))
    }, 3000)
  }, [])
  
  const takeDamage = useCallback((damage: number) => {
    setState(prev => {
      const newHealth = Math.max(0, prev.health - damage)
      return {
        ...prev,
        health: newHealth,
        isGameOver: newHealth <= 0
      }
    })
  }, [])
  
    const resetGame = useCallback(() => {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current)
      }
      setState(prev => ({
        ...initialState,
        gameVersion: prev.gameVersion + 1 // Increment to trigger component resets
      }))
    }, [])
  
  const pauseGame = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }))
  }, [])
  
  const resumeGame = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }))
  }, [])
  
  const value: GameContextType = {
    ...state,
    addScore,
    addKill,
    takeDamage,
    resetGame,
    pauseGame,
    resumeGame
  }
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}
