import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Film } from 'lucide-react'

interface BlogVideoPlaceholderProps {
  videoSrc: string
  headline: string
  caption?: string
  posterSrc?: string
  aspectRatio?: '16/9' | '9/16'
  className?: string
  badgeLabel?: string
  enablePlay?: boolean
}

/**
 * Reusable video component for blog stories.
 * Seamlessly plays the attached video with muted autoplay and controls,
 * falling back to an intentional, premium placeholder only if the video is missing or errors.
 */
export function BlogVideoPlaceholder({
  videoSrc,
  headline,
  caption,
  posterSrc,
  aspectRatio = '16/9',
  className = '',
  badgeLabel = 'Story film coming soon',
  enablePlay = false,
}: BlogVideoPlaceholderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
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
          setIsPlaying(false)
        })
      }
    } catch {
      setIsPlaying(false)
    }
  }, [reducedMotion, videoSrc])

  const aspectClass = aspectRatio === '9/16' ? 'aspect-[9/16]' : 'aspect-video'

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      try {
        const p = video.play()
        if (p !== undefined && typeof p.then === 'function') {
          p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
          setIsPlaying(true)
        }
      } catch {
        setIsPlaying(false)
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const isVideoLive = Boolean(videoSrc) && !hasError
  const displayBadge = isVideoLive ? 'Editorial Film' : badgeLabel

  return (
    <div
      className={`relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#0B1424] border border-slate-800/80 shadow-xl shadow-slate-950/20 group select-none ${aspectClass} ${className}`}
      role="region"
      aria-label={`Story preview for ${headline}`}
      onClick={enablePlay ? togglePlay : undefined}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-slate-950/40 to-slate-950 pointer-events-none" />

      {/* Decorative subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Top Header Badge */}
      <div className="absolute top-3.5 left-3.5 z-20">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-medium text-slate-200 shadow-sm">
          <Film className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          {displayBadge}
        </span>
      </div>

      {/* Actual Video Surface */}
      {videoSrc && !hasError && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          title={headline}
          aria-label={headline}
          autoPlay={!reducedMotion}
          muted
          playsInline
          loop={!reducedMotion}
          preload="metadata"
          onLoadedData={() => {
            setIsLoaded(true)
            setHasError(false)
          }}
          onCanPlay={() => {
            setIsLoaded(true)
          }}
          onError={() => {
            setHasError(true)
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100 z-10' : 'opacity-90 z-0'
          }`}
        />
      )}

      {/* Subtle Loading indicator when waiting for first frame */}
      {!isLoaded && !hasError && Boolean(videoSrc) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-5 pointer-events-none">
          <div className="w-7 h-7 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      )}

      {/* Fallback Placeholder UI only when video is missing or errored */}
      {(!videoSrc || hasError) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-105 group-hover:border-emerald-400/50 transition-all duration-300">
              <Play className="w-6 h-6 fill-emerald-400/30 text-emerald-400 ml-0.5" aria-hidden="true" />
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-emerald-400/80 font-semibold mb-1">
            Prota Cinema
          </p>
          <p className="text-sm sm:text-base font-semibold text-slate-200 max-w-sm line-clamp-1">
            {headline}
          </p>
        </div>
      )}

      {/* Play/Pause control overlay when interactive play is enabled */}
      {enablePlay && isVideoLive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          aria-label={isPlaying ? 'Pause film' : 'Play film'}
          className="absolute bottom-3.5 right-3.5 z-20 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700/70 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      )}

      {/* Lower Caption Bar */}
      {caption && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-4 py-2.5 bg-slate-950/85 backdrop-blur-xs border-t border-slate-800/80 text-left pointer-events-none">
          <p className="text-[11px] text-slate-300 font-medium truncate">{caption}</p>
        </div>
      )}
    </div>
  )
}
