import type { ReactNode } from 'react'
import { getSelectableCountry } from '../data/selectableCountries'
import { PRECISION_LABEL, PRECISION_NOTE, relationshipLabel } from '../lib/discovery'
import type { LocationGroup, MappedArtwork } from '../types/discovery'
import ArtworkPlaceholder from './ArtworkPlaceholder'
import DemoBadge from './DemoBadge'
import PanelNav from './PanelNav'
import PrecisionIcon from './PrecisionIcon'

interface ArtworkDetailPanelProps {
  artwork: MappedArtwork
  group: LocationGroup
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

/** Persistent detail view for an artwork placed on the globe (side panel or bottom sheet). */
export default function ArtworkDetailPanel({
  artwork,
  group,
  headingId,
  backLabel,
  onBack,
  onClose,
}: ArtworkDetailPanelProps) {
  const { location } = group
  const notRecorded = artwork.isDemo ? 'Not specified (demo record)' : 'Not recorded'

  return (
    <article aria-labelledby={headingId}>
      <PanelNav backLabel={backLabel} onBack={onBack} onClose={onClose} closeLabel="Close artwork details" />

      <div className="mt-3">
        {artwork.image ? (
          <img
            src={artwork.image.url}
            alt={artwork.image.alt}
            className="aspect-[4/3] w-full rounded bg-ink-soft object-contain"
          />
        ) : (
          <ArtworkPlaceholder size="lg" />
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 id={headingId} tabIndex={-1} className="font-display text-2xl leading-tight text-ivory outline-none">
          {artwork.title}
        </h3>
        {artwork.isDemo && <DemoBadge />}
      </div>
      <p className="mt-1 text-sm text-ivory-muted">{artwork.date ?? 'Date not recorded'}</p>

      <dl className="mt-5 space-y-3 border-t border-ivory/10 pt-5">
        <Row label="Artist or culture">{artwork.creator ?? artwork.culture ?? notRecorded}</Row>
        <Row label="Medium or category">{artwork.category ?? notRecorded}</Row>
        <Row label="Location">
          <span className="flex items-center gap-1.5">
            <PrecisionIcon precision={location.precision} />
            {relationshipLabel(artwork.placement.relationship, location.name)}
          </span>
          <span className="mt-0.5 block text-xs text-ivory-muted">
            {PRECISION_LABEL[location.precision]}. {PRECISION_NOTE[location.precision]}
          </span>
        </Row>
        <Row label="Shown on globe">
          {getSelectableCountry(location.country).name}
          <span className="mt-0.5 block text-xs text-ivory-muted">Modern country, used for navigation only.</span>
        </Row>
      </dl>

      <section className="mt-5 border-t border-ivory/10 pt-5" aria-label="Description">
        <h4 className="text-[0.65rem] tracking-[0.15em] text-ivory-muted/70 uppercase">Description</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-ivory/90">
          {artwork.description ??
            'A short description will appear here once this is linked to a verified museum record.'}
        </p>
      </section>

      <section className="mt-5 border-t border-ivory/10 pt-5" aria-label="Source">
        <h4 className="text-[0.65rem] tracking-[0.15em] text-ivory-muted/70 uppercase">Source</h4>
        {artwork.source ? (
          <>
            <p className="mt-1.5 text-sm text-ivory">
              {artwork.source.museum}, {artwork.source.creditLine} ({artwork.source.accessionNumber})
            </p>
            <a
              href={artwork.source.recordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-xs tracking-[0.15em] text-gold uppercase transition-colors hover:bg-gold hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              View official museum record <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </>
        ) : (
          <p className="mt-1.5 text-sm leading-relaxed text-ivory-muted">
            Placeholder. This demonstration record is not linked to any museum, and its image and
            details are not real.
          </p>
        )}
      </section>
    </article>
  )
}
