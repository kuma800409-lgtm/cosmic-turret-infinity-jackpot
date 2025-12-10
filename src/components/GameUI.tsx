import { useGameState } from '../game/GameState'

export function ScoreDisplay() {
  const { score, kills, combo, comboMultiplier } = useGameState()
  
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      color: '#00ffff',
      fontFamily: 'monospace',
      fontSize: '16px',
      textAlign: 'right',
      textShadow: '0 0 10px #00ffff'
    }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
        {score.toLocaleString()}
      </div>
      <div style={{ fontSize: '14px', opacity: 0.8 }}>
        Kills: {kills}
      </div>
      {combo > 0 && (
        <div style={{ 
          fontSize: '18px', 
          color: comboMultiplier >= 3 ? '#ffff00' : '#ff8800',
          textShadow: `0 0 15px ${comboMultiplier >= 3 ? '#ffff00' : '#ff8800'}`,
          animation: 'pulse 0.5s ease-in-out infinite'
        }}>
          COMBO x{combo} ({comboMultiplier.toFixed(1)}x)
        </div>
      )}
    </div>
  )
}

export function HealthBar() {
  const { health, maxHealth } = useGameState()
  const healthPercent = (health / maxHealth) * 100
  const healthColor = healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffff00' : '#ff0000'
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '150px',
      left: '20px',
      width: '200px',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        color: healthColor, 
        fontSize: '14px', 
        marginBottom: '5px',
        textShadow: `0 0 10px ${healthColor}`
      }}>
        TURRET HP: {health}/{maxHealth}
      </div>
      <div style={{
        width: '100%',
        height: '20px',
        background: 'rgba(0,0,0,0.7)',
        border: `2px solid ${healthColor}`,
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${healthPercent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${healthColor}, ${healthColor}88)`,
          boxShadow: `0 0 10px ${healthColor}`,
          transition: 'width 0.3s ease, background 0.3s ease'
        }} />
      </div>
    </div>
  )
}

export function GameOverScreen() {
  const { isGameOver, score, kills, resetGame } = useGameState()
  
  if (!isGameOver) return null
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <div style={{
        fontSize: '64px',
        color: '#ff0000',
        textShadow: '0 0 30px #ff0000',
        marginBottom: '20px',
        animation: 'flicker 0.5s ease-in-out infinite'
      }}>
        GAME OVER
      </div>
      
      <div style={{
        fontSize: '24px',
        color: '#00ffff',
        marginBottom: '10px'
      }}>
        Final Score: <span style={{ color: '#ffff00' }}>{score.toLocaleString()}</span>
      </div>
      
      <div style={{
        fontSize: '18px',
        color: '#888',
        marginBottom: '40px'
      }}>
        Enemies Destroyed: {kills}
      </div>
      
      <button
        onClick={resetGame}
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          fontFamily: 'monospace',
          background: 'transparent',
          border: '3px solid #00ffff',
          color: '#00ffff',
          cursor: 'pointer',
          borderRadius: '5px',
          textShadow: '0 0 10px #00ffff',
          boxShadow: '0 0 20px #00ffff44',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#00ffff'
          e.currentTarget.style.color = '#000'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#00ffff'
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  )
}

interface DamageNumberProps {
  damage: number
  position: { x: number; y: number }
  onComplete: () => void
}

export function DamageNumber({ damage, position, onComplete }: DamageNumberProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        color: damage >= 50 ? '#ff0000' : '#ffff00',
        fontSize: damage >= 50 ? '24px' : '18px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${damage >= 50 ? '#ff0000' : '#ffff00'}`,
        pointerEvents: 'none',
        animation: 'floatUp 1s ease-out forwards',
        zIndex: 100
      }}
      onAnimationEnd={onComplete}
    >
      -{damage}
    </div>
  )
}

interface ScorePopupProps {
  score: number
  position: { x: number; y: number }
  onComplete: () => void
}

export function ScorePopup({ score, position, onComplete }: ScorePopupProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        color: '#00ff00',
        fontSize: '20px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textShadow: '0 0 10px #00ff00',
        pointerEvents: 'none',
        animation: 'floatUp 1s ease-out forwards',
        zIndex: 100
      }}
      onAnimationEnd={onComplete}
    >
      +{score}
    </div>
  )
}

// CSS animations to be added to index.css
export const gameAnimations = `
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(1.2);
  }
}
`
