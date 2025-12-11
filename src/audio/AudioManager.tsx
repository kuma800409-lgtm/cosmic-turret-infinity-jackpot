import { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react'

interface AudioContextType {
  playShoot: (weaponType: number) => void
  playHit: () => void
  playExplosion: () => void
  playDamage: () => void
  playUIClick: () => void
  startBeamSound: () => void
  stopBeamSound: () => void
  setMusicVolume: (volume: number) => void
  setSFXVolume: (volume: number) => void
  toggleMusic: () => void
  isMusicPlaying: boolean
}

const AudioContext = createContext<AudioContextType | null>(null)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

interface AudioProviderProps {
  children: React.ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const sfxGainRef = useRef<GainNode | null>(null)
  const musicOscillatorRef = useRef<OscillatorNode | null>(null)
  const beamOscillatorRef = useRef<OscillatorNode | null>(null)
  const beamGainRef = useRef<GainNode | null>(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext()
      
      // Create gain nodes for volume control
      musicGainRef.current = audioContextRef.current.createGain()
      musicGainRef.current.gain.value = 0.3
      musicGainRef.current.connect(audioContextRef.current.destination)
      
      sfxGainRef.current = audioContextRef.current.createGain()
      sfxGainRef.current.gain.value = 0.5
      sfxGainRef.current.connect(audioContextRef.current.destination)
    }
    return audioContextRef.current
  }, [])
  
  const playShoot = useCallback((weaponType: number) => {
    const ctx = getAudioContext()
    if (!sfxGainRef.current) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(sfxGainRef.current)
    
    const now = ctx.currentTime
    
    switch (weaponType) {
      case 1: // Photon Repeater - "piu piu"
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, now)
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1)
        gainNode.gain.setValueAtTime(0.3, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        oscillator.start(now)
        oscillator.stop(now + 0.1)
        break
        
      case 2: // Lancer Beam - "bzzzz"
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(150, now)
        oscillator.frequency.setValueAtTime(200, now + 0.05)
        oscillator.frequency.setValueAtTime(150, now + 0.1)
        gainNode.gain.setValueAtTime(0.15, now)
        gainNode.gain.setValueAtTime(0.15, now + 0.1)
        oscillator.start(now)
        oscillator.stop(now + 0.15)
        break
        
      case 3: // Gravity Nova - "boom"
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(100, now)
        oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.3)
        gainNode.gain.setValueAtTime(0.5, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        oscillator.start(now)
        oscillator.stop(now + 0.3)
        break
    }
  }, [getAudioContext])
  
  const playHit = useCallback(() => {
    const ctx = getAudioContext()
    if (!sfxGainRef.current) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(sfxGainRef.current)
    
    const now = ctx.currentTime
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(300, now)
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05)
    gainNode.gain.setValueAtTime(0.2, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
    
    oscillator.start(now)
    oscillator.stop(now + 0.05)
  }, [getAudioContext])
  
  const playExplosion = useCallback(() => {
    const ctx = getAudioContext()
    if (!sfxGainRef.current) return
    
    // Create noise for explosion
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1))
    }
    
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
    
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(sfxGainRef.current)
    
    noise.start()
  }, [getAudioContext])
  
  const playDamage = useCallback(() => {
    const ctx = getAudioContext()
    if (!sfxGainRef.current) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(sfxGainRef.current)
    
    const now = ctx.currentTime
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, now)
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2)
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    
    oscillator.start(now)
    oscillator.stop(now + 0.2)
  }, [getAudioContext])
  
    const playUIClick = useCallback(() => {
      const ctx = getAudioContext()
      if (!sfxGainRef.current) return
    
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
    
      oscillator.connect(gainNode)
      gainNode.connect(sfxGainRef.current)
    
      const now = ctx.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(600, now)
      oscillator.frequency.setValueAtTime(800, now + 0.02)
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
    
      oscillator.start(now)
      oscillator.stop(now + 0.05)
    }, [getAudioContext])
  
    const startBeamSound = useCallback(() => {
      const ctx = getAudioContext()
      if (!sfxGainRef.current || beamOscillatorRef.current) return
    
      // Create continuous "bzzzz" sound for beam
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
    
      osc1.type = 'sawtooth'
      osc1.frequency.value = 150
    
      osc2.type = 'square'
      osc2.frequency.value = 155 // Slight detuning for richer sound
    
      // LFO for wobble effect
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 8
      lfoGain.gain.value = 20
      lfo.connect(lfoGain)
      lfoGain.connect(osc1.frequency)
    
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.gain.value = 0.12
      gainNode.connect(sfxGainRef.current)
    
      lfo.start()
      osc1.start()
      osc2.start()
    
      beamOscillatorRef.current = osc1
      beamGainRef.current = gainNode
    }, [getAudioContext])
  
    const stopBeamSound = useCallback(() => {
      if (beamOscillatorRef.current) {
        beamOscillatorRef.current.stop()
        beamOscillatorRef.current = null
        beamGainRef.current = null
      }
    }, [])
  
    const startMusic = useCallback(() => {
    const ctx = getAudioContext()
    if (!musicGainRef.current || musicOscillatorRef.current) return
    
    // Create a simple ambient sci-fi drone
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()
    
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    
    lfo.frequency.value = 0.1
    lfoGain.gain.value = 10
    lfo.connect(lfoGain)
    
    osc1.type = 'sine'
    osc1.frequency.value = 55 // Low A
    lfoGain.connect(osc1.frequency)
    
    osc2.type = 'sine'
    osc2.frequency.value = 82.5 // E
    
    osc3.type = 'triangle'
    osc3.frequency.value = 110 // A
    
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.15
    
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    osc3.connect(gainNode)
    gainNode.connect(musicGainRef.current)
    
    lfo.start()
    osc1.start()
    osc2.start()
    osc3.start()
    
    musicOscillatorRef.current = osc1
    setIsMusicPlaying(true)
  }, [getAudioContext])
  
  const stopMusic = useCallback(() => {
    if (musicOscillatorRef.current) {
      musicOscillatorRef.current.stop()
      musicOscillatorRef.current = null
      setIsMusicPlaying(false)
    }
  }, [])
  
  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      stopMusic()
    } else {
      startMusic()
    }
  }, [isMusicPlaying, startMusic, stopMusic])
  
  const setMusicVolume = useCallback((volume: number) => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = volume
    }
  }, [])
  
  const setSFXVolume = useCallback((volume: number) => {
    if (sfxGainRef.current) {
      sfxGainRef.current.gain.value = volume
    }
  }, [])
  
  // Auto-start music on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isMusicPlaying) {
        startMusic()
      }
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
    
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [isMusicPlaying, startMusic])
  
    const value: AudioContextType = {
      playShoot,
      playHit,
      playExplosion,
      playDamage,
      playUIClick,
      startBeamSound,
      stopBeamSound,
      setMusicVolume,
      setSFXVolume,
      toggleMusic,
      isMusicPlaying
    }
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}
