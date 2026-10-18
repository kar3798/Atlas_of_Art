import { useEffect, useRef, type ReactNode } from 'react'
import { getSelectableCountry } from '../data/selectableCountries'
import { originLabel, originNote } from '../lib/origin'
import type { Artwork } from '../types/artwork'

const CC0_DEED_URL = 'https://creativecommons.org/publicdomain/zero/1.0/'

interface ArtworkDetailProps {
  artwork: Artwork
  onClose: () => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[0.7rem] tracking-[0.15em] text-ivory-muted/70 uppercase sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-ivory">{children}</dd>
    </div>
  )
}

/** Modal with full metadata for one artwork. Uses the native <dialog> for focus trapping and Esc. */
export default function ArtworkDetail({ artwork, onClose }: ArtworkDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { origin, source } = artwork

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="artwork-detail-title"
      onClose={onClose}
      // Keep Esc from also clearing the country selection (handled on window in App).
      onKeyDown={(event) => event.key === 'Escape' && event.stopPropagation()}
      // Clicking the backdrop (the dialog element itself, outside its content) closes it.
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
      className="m-auto max-h-[92dvh] w-[min(58rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gold/25 bg-ink p-0 text-ivory shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      {/* Header bar sits outside the scroll area so the close button never overlaps the scrollbar. */}
      <div className="flex h-14 items-center justify-between gap-4 border-b border-ivory/10 pr-2 pl-6 sm:pl-8">
        <p className="text-[0.65rem] tracking-[0.3em] text-gold uppercase">{source.museum}</p>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close artwork details"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div className="grid max-h-[calc(92dvh-3.5rem)] overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex items-center justify-center bg-ink-soft p-6 md:sticky md:top-0 md:max-h-[calc(92dvh-3.5rem)] md:p-8">
          <img
            src={artwork.image.url}
            width={artwork.image.width}
            height={artwork.image.height}
            alt={`${artwork.title}, ${artwork.medium}`}
            className="max-h-[50dvh] w-auto object-contain md:max-h-[calc(92dvh-7.5rem)]"
          />
        </div>

        <div className="px-6 py-7 sm:px-8">
          <h2 id="artwork-detail-title" className="font-display text-2xl leading-tight sm:text-3xl">
            {artwork.title}
          </h2>
          <p className="mt-2 text-sm text-ivory-muted">{artwork.date.display}</p>

          <dl className="mt-6 space-y-3 border-t border-ivory/10 pt-6">
            {artwork.creator && <Row label="Artist">{artwork.creator}</Row>}
            <Row label="Culture">{artwork.culture}</Row>
            <Row label="Origin">
              {originLabel(origin)}
              <span className="mt-0.5 block text-xs text-ivory-muted">{originNote(origin)}</span>
            </Row>
            {origin.historicalRegion && <Row label="Historical region">{origin.historicalRegion}</Row>}
            <Row label="Shown on globe">
              {getSelectableCountry(origin.country).name}
              <span className="mt-0.5 block text-xs text-ivory-muted">
                Modern country, used for navigation only.
              </span>
            </Row>
            <Row label="Type">{artwork.type}</Row>
            <Row label="Medium">{artwork.medium}</Row>
            <Row label="Accession no.">{source.accessionNumber}</Row>
            <Row label="Credit">
              {source.museum}, {source.creditLine}
            </Row>
          </dl>

          {artwork.description.length > 0 && (
            <section className="mt-6 border-t border-ivory/10 pt-6" aria-labelledby="artwork-description-title">
              <h3
                id="artwork-description-title"
                className="text-[0.7rem] tracking-[0.15em] text-ivory-muted/70 uppercase"
              >
                From the museum’s record
              </h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ivory/90">
                {artwork.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          <p className="mt-6 border-t border-ivory/10 pt-6 text-xs leading-relaxed text-ivory-muted">
            Image and data:{' '}
            <a
              href={CC0_DEED_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ivory underline decoration-gold/50 underline-offset-2 hover:decoration-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              CC0 1.0 Universal<span className="sr-only"> (opens in a new tab)</span>
            </a>
            , dedicated to the public domain by {source.museum} for this record.
          </p>

          <a
            href={source.recordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-xs tracking-[0.15em] text-gold uppercase transition-colors hover:bg-gold hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            View official museum record
            <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </dialog>
  )
}
