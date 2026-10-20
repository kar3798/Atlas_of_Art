import { useState } from 'react'
import type { Artwork } from '../types/artwork'
import ArtworkPlaceholder from './ArtworkPlaceholder'

/** Small square artwork image; falls back to the CSS placeholder if the image fails to load. */
export default function ArtworkThumb({ artwork }: { artwork: Artwork }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <ArtworkPlaceholder size="sm" />

  return (
    <img
      src={artwork.image.url}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-12 shrink-0 rounded border border-gold/20 bg-ink-soft object-contain p-0.5"
    />
  )
}
