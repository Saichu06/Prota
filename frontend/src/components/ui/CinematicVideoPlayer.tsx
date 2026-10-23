import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Play, Pause, Film } from 'lucide-react'

interface CinematicVideoPlayerProps {
  src: string
  title: string
  aspectRatio?: '16/9' | '9/16' | 'auto'
  caption?: string
  badge?: string
  fallback?: ReactNode
  className?: string
  containerClassName?: string
}

export function CinematicVideoPlayer({
  src,
  title,
  aspectRatio = '16/9',
  caption,
  badge,
  fallback,
  className = '',
  containerClassName = '',
}: CinematicVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
      if (e.matches && videoRef.current) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reducedMotion) return

    try {
      const playPromise = video.play()
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Browser autoplay policy prevented playback
          setIsPlaying(false)
        })
      }
    } catch {
      setIsPlaying(false)
    }
  }, [reducedMotion])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      try {
        const playPromise = video.play()
        if (playPromise !== undefined && typeof playPromise.then === 'function') {
          playPromise.then(() => setIsPlaying(true)).catch(() => {})
        } else {
          setIsPlaying(true)
        }
      } catch {
        // ignore
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  if (hasError && fallback) {
    return <>{fallback}</>
  }

  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video'
      : aspectRatio === '9/16'
        ? 'aspect-[9/16]'
        : ''

  return (
    <div
      className={`relative w-full rounded-3xl bg-[#0B1424] border border-slate-700/60 shadow-2xl shadow-slate-900/30 overflow-hidden group select-none ${containerClassName}`}
    >
      {/* Ambient decorative backdrop glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Badge */}
      {badge && (
        <div className="absolute top-3.5 left-3.5 z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-700/70 text-[11px] font-medium text-slate-200 shadow-sm">
            <Film className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            {badge}
          </span>
        </div>
      )}

      {/* Video Surface */}
      <div className={`relative w-full overflow-hidden ${aspectClass} flex items-center justify-center bg-slate-950`}>
        <video
          ref={videoRef}
          src={src}
          title={title}
          aria-label={title}
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />

        {/* Subtle Loading Placeholder */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-950">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <span className="text-xs font-medium">Loading preview...</span>
          </div>
        )}

        {/* Play / Pause Toggle Button Overlay */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
          className="absolute bottom-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/70 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer shadow-md"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Optional Caption */}
      {caption && (
        <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 text-center">
          <p className="text-[10.5px] leading-tight text-slate-400 font-medium">{caption}</p>
        </div>
      )}
    </div>
  )
}
