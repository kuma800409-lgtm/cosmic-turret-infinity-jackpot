import { useEffect } from 'react'
import { useGameState } from '../game/GameState'
import { useAudio } from '../audio/AudioManager'

interface PauseMenuProps {
  onResume: () => void
  onRestart: () => void
}

export function PauseMenu({ onResume, onRestart }: PauseMenuProps) {
  const { isPaused, pauseGame, resumeGame, resetGame } = useGameState()
  const { playUIClick, setMusicVolume, setSFXVolume } = useAudio()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPaused) {
          resumeGame()
          onResume()
        } else {
          pauseGame()
        }
        playUIClick()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, pauseGame, resumeGame, playUIClick, onResume])
  
  const handleResume = () => {
    resumeGame()
    onResume()
    playUIClick()
  }
  
  const handleRestart = () => {
    resetGame()
    onRestart()
    playUIClick()
  }
  
  if (!isPaused) return null
  
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
      zIndex: 900
    }}>
      <div style={{
        fontSize: '48px',
        color: '#00ffff',
        textShadow: '0 0 20px #00ffff',
        marginBottom: '40px'
      }}>
        PAUSED
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '200px'
      }}>
        <MenuButton onClick={handleResume} color="#00ffff">
          CONTINUE
        </MenuButton>
        
        <MenuButton onClick={handleRestart} color="#ffff00">
          RESTART
        </MenuButton>
        
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid #444',
          borderRadius: '5px'
        }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
            VOLUME
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ color: '#00ffff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Music
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="30"
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          
          <div>
            <label style={{ color: '#00ffff', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              SFX
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              onChange={(e) => setSFXVolume(Number(e.target.value) / 100)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '30px',
        color: '#666',
        fontSize: '12px'
      }}>
        Press ESC to resume
      </div>
    </div>
  )
}

interface MenuButtonProps {
  onClick: () => void
  color: string
  children: React.ReactNode
}

function MenuButton({ onClick, color, children }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        fontSize: '16px',
        fontFamily: 'monospace',
        background: 'transparent',
        border: `2px solid ${color}`,
        color: color,
        cursor: 'pointer',
        borderRadius: '5px',
        textShadow: `0 0 10px ${color}`,
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = color
        e.currentTarget.style.color = '#000'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = color
      }}
    >
      {children}
    </button>
  )
}

export function PauseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '60px',
        right: '20px',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.7)',
        border: '2px solid #888',
        borderRadius: '5px',
        color: '#888',
        fontFamily: 'monospace',
        fontSize: '12px',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#00ffff'
        e.currentTarget.style.color = '#00ffff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#888'
        e.currentTarget.style.color = '#888'
      }}
    >
      PAUSE (ESC)
    </button>
  )
}
