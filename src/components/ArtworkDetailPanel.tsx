import { useState, type ReactNode } from 'react'
import { getSelectableCountry } from '../data/selectableCountries'
import {
  PRECISION_LABEL,
  PRECISION_NOTE,
  relationshipLabel,
  UNPLACED_LABEL,
  UNPLACED_NOTE,
} from '../lib/discovery'
import type { Artwork } from '../types/artwork'
import type { ArtLocation, ArtworkPlacement } from '../types/discovery'
import ArtworkPlaceholder from './ArtworkPlaceholder'
import PanelNav from './PanelNav'
import PrecisionIcon from './PrecisionIcon'

const CC0_DEED_URL = 'https://creativecommons.org/publicdomain/zero/1.0/'

const EVIDENCE_FIELD_LABEL: Record<ArtworkPlacement['evidence']['field'], string> = {
  culture: 'culture field',
  description: 'description',
  citations: 'citations',
}

interface ArtworkDetailPanelProps {
  artwork: Artwork
  /** Researched placement and its location; null when the artwork isn't on the globe. */
  placement: ArtworkPlacement | null
  location: ArtLocation | null
  headingId: string
  backLabel: string
  onBack: () => void
  onClose: () => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.65rem] tracking-[0.15em] text-ivory-muted/70 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-ivory">{children}</dd>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ivory underline decoration-gold/50 underline-offset-2 hover:decoration-gold focus-visible:outline-2 focus-visible:outline-gold"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/**
 * The single artwork detail view, opened from the gallery, a globe marker or a
 * location list. Shown in the side panel (desktop) or bottom sheet (mobile).
 */
export default function ArtworkDetailPanel({
  artwork,
  placement,
  location,
  headingId,
  backLabel,
  onBack,
  onClose,
}: ArtworkDetailPanelProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { source } = artwork

  return (
    <article aria-labelledby={headingId}>
      <PanelNav backLabel={backLabel} onBack={onBack} onClose={onClose} closeLabel="Close artwork details" />

      <div className="mt-3 flex justify-center rounded bg-ink-soft p-4">
        {imageFailed ? (
          <ArtworkPlaceholder size="lg" />
        ) : (
          <img
            src={artwork.image.url}
            width={artwork.image.width}
            height={artwork.image.height}
            alt={`${artwork.title}, ${artwork.medium}`}
            onError={() => setImageFailed(true)}
            className="max-h-[22rem] w-auto object-contain"
          />
        )}
      </div>

      <p className="mt-4 text-[0.65rem] tracking-[0.3em] text-gold uppercase">{source.museum}</p>
      <h3 id={headingId} tabIndex={-1} className="mt-1.5 font-display text-2xl leading-tight text-ivory outline-none">
        {artwork.title}
      </h3>
      <p className="mt-1 text-sm text-ivory-muted">{artwork.date.display}</p>

      <dl className="mt-5 space-y-3 border-t border-ivory/10 pt-5">
        {artwork.creator && <Row label="Artist">{artwork.creator}</Row>}
        <Row label="Culture">{artwork.culture}</Row>

        <Row label="Location">
          {placement && location ? (
            <>
              <span className="flex items-center gap-1.5">
                <PrecisionIcon precision={location.precision} />
                {relationshipLabel(placement, location)}
              </span>
              <span className="mt-1 block text-xs text-ivory-muted">
                {PRECISION_LABEL[location.precision]}. {PRECISION_NOTE[location.precision]}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-ivory-muted">{placement.note}</span>
              <span className="mt-2 block text-xs leading-relaxed text-ivory-muted">
                Evidence: “{placement.evidence.text}” —{' '}
                <ExternalLink href={placement.evidence.sourceUrl}>
                  museum record ({EVIDENCE_FIELD_LABEL[placement.evidence.field]})
                </ExternalLink>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ivory-muted/80">
                {location.coordinateNote}{' '}
                <ExternalLink href={location.coordinateSource}>Coordinate source</ExternalLink>
              </span>
            </>
          ) : (
            <>
              {UNPLACED_LABEL}
              <span className="mt-0.5 block text-xs text-ivory-muted">{UNPLACED_NOTE}</span>
            </>
          )}
        </Row>

        {artwork.origin.historicalRegion && (
          <Row label="Historical region">{artwork.origin.historicalRegion}</Row>
        )}
        <Row label="Shown under">
          {getSelectableCountry(artwork.origin.country).name}
          <span className="mt-0.5 block text-xs text-ivory-muted">Modern country, used for navigation only.</span>
        </Row>
        <Row label="Type">{artwork.type}</Row>
        <Row label="Medium">{artwork.medium}</Row>
        <Row label="Accession no.">{source.accessionNumber}</Row>
        <Row label="Credit">
          {source.museum}, {source.creditLine}
        </Row>
      </dl>

      {artwork.description.length > 0 && (
        <section className="mt-5 border-t border-ivory/10 pt-5" aria-label="Description">
          <h4 className="text-[0.65rem] tracking-[0.15em] text-ivory-muted/70 uppercase">
            From the museum’s record
          </h4>
          <div className="mt-2 space-y-3 text-sm leading-relaxed text-ivory/90">
            {artwork.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      <p className="mt-5 border-t border-ivory/10 pt-5 text-xs leading-relaxed text-ivory-muted">
        Image and data: <ExternalLink href={CC0_DEED_URL}>CC0 1.0 Universal</ExternalLink>,
        dedicated to the public domain by {source.museum} for this record.
      </p>

      <a
        href={source.recordUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-xs tracking-[0.15em] text-gold uppercase transition-colors hover:bg-gold hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        View official museum record <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </article>
  )
}
