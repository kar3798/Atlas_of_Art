import { originLabel } from '../lib/origin'
import type { Artwork } from '../types/artwork'

interface ArtworkCardProps {
  artwork: Artwork
  onOpen: (artwork: Artwork) => void
}

export default function ArtworkCard({ artwork, onOpen }: ArtworkCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(artwork)}
        aria-haspopup="dialog"
        className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-ivory/10 bg-ink/40 text-left transition-colors hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <div className="flex aspect-[4/5] w-full items-center justify-center bg-ink-soft/70 p-3">
          {/* Decorative here: the title below names the work; the detail view has full alt text. */}
          <img
            src={artwork.image.url}
            width={artwork.image.width}
            height={artwork.image.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 font-display text-[0.95rem] leading-snug text-ivory">
            {artwork.title}
          </h3>
          <p className="text-xs text-ivory-muted">{artwork.date.display}</p>
          <p className="line-clamp-2 text-xs text-ivory-muted/80">
            {artwork.creator ?? artwork.culture}
          </p>
          <p className="mt-auto pt-2 text-[0.7rem] leading-snug text-gold">
            {originLabel(artwork.origin)}
          </p>
          <p className="text-[0.65rem] tracking-wide text-ivory-muted/60">
            {artwork.source.museum}
          </p>
        </div>
      </button>
    </li>
  )
}
