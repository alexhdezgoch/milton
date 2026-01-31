import { useState, useRef, useCallback, useEffect } from 'react'
import YouTube from 'react-youtube'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react'
import { formatDuration } from '../../services/youtube'

export default function YouTubePlayer({
  videoId,
  onTimeUpdate,
  onReady,
  onStateChange,
  initialTime = 0,
  className = ''
}) {
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const intervalRef = useRef(null)

  // Update time periodically when playing
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        const time = playerRef.current.getCurrentTime()
        setCurrentTime(time)
        onTimeUpdate?.(time)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, onTimeUpdate])

  const handleReady = useCallback((event) => {
    playerRef.current = event.target
    setDuration(event.target.getDuration())
    setIsReady(true)

    if (initialTime > 0) {
      event.target.seekTo(initialTime, true)
    }

    onReady?.(event.target)
  }, [initialTime, onReady])

  const handleStateChange = useCallback((event) => {
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    const playing = event.data === 1
    setIsPlaying(playing)
    onStateChange?.(event.data)
  }, [onStateChange])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
    } else {
      playerRef.current.mute()
    }
    setIsMuted(!isMuted)
  }, [isMuted])

  const seekTo = useCallback((seconds) => {
    if (!playerRef.current) return
    playerRef.current.seekTo(seconds, true)
    setCurrentTime(seconds)
    onTimeUpdate?.(seconds)
  }, [onTimeUpdate])

  const skip = useCallback((delta) => {
    if (!playerRef.current) return
    const newTime = Math.max(0, Math.min(duration, currentTime + delta))
    seekTo(newTime)
  }, [currentTime, duration, seekTo])

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    seekTo(newTime)
  }, [duration, seekTo])

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      disablekb: 1
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`relative bg-video-dark rounded-xl overflow-hidden ${className}`}>
      {/* YouTube Player */}
      <div className="aspect-video">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={handleStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3 group"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-accent-rose rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="text-white/80 hover:text-white transition-colors"
              title="Back 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="text-white/80 hover:text-white transition-colors"
              title="Forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Time */}
            <span className="text-white/80 text-sm font-mono">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={() => {
              const iframe = document.querySelector('iframe')
              if (iframe?.requestFullscreen) {
                iframe.requestFullscreen()
              }
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Export a hook for external control
export function useYouTubePlayer() {
  const playerRef = useRef(null)

  const setPlayer = useCallback((player) => {
    playerRef.current = player
  }, [])

  const seekTo = useCallback((seconds) => {
    playerRef.current?.seekTo(seconds, true)
  }, [])

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() || 0
  }, [])

  const play = useCallback(() => {
    playerRef.current?.playVideo()
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo()
  }, [])

  return {
    setPlayer,
    seekTo,
    getCurrentTime,
    play,
    pause
  }
}
