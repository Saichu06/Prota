
interface CircularWatermarkProps {
  className?: string
}

/**
 * Reusable pale green circular Prota watermark motif (concentric progress arcs).
 * Styled with pointer-events-none and subtle brand opacity for light and dark themes.
 */
export function CircularWatermark({ className = '' }: CircularWatermarkProps) {
  const rings = [180, 140, 100] as const

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className={`pointer-events-none select-none text-emerald-600/15 dark:text-emerald-400/10 transition-colors ${className}`}
    >
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * r * (0.82 - i * 0.15)} ${2 * Math.PI * r}`}
          transform="rotate(-90 200 200)"
        />
      ))}
    </svg>
  )
}
