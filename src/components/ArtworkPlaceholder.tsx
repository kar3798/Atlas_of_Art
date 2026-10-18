interface ArtworkPlaceholderProps {
  size: 'sm' | 'lg'
}

/** CSS placeholder used instead of artwork imagery for demo records. */
export default function ArtworkPlaceholder({ size }: ArtworkPlaceholderProps) {
  const isLarge = size === 'lg'
  return (
    <div
      role="img"
      aria-label="Image placeholder"
      className={`flex shrink-0 flex-col items-center justify-center gap-2 rounded border border-gold/20 bg-[linear-gradient(145deg,#3a3125,#231d16)] text-brass/60 ${
        isLarge ? 'aspect-[4/3] w-full' : 'size-12'
      }`}
    >
      <svg viewBox="0 0 24 24" className={isLarge ? 'size-10' : 'size-5'} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 17l4-5 3 3.5 2-2.5 3 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      </svg>
      {isLarge && (
        <span className="text-[0.65rem] tracking-[0.2em] uppercase">Image placeholder</span>
      )}
    </div>
  )
}
