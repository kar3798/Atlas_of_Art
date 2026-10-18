import type { SelectableCountry } from '../types/country'

interface CountryPanelProps {
  country: SelectableCountry
  onClear: () => void
}

export default function CountryPanel({ country, onClear }: CountryPanelProps) {
  return (
    <section
      aria-labelledby="country-panel-title"
      className="pointer-events-auto relative w-full max-w-sm rounded-lg border border-gold/25 bg-ink/75 px-6 py-5 text-center backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        title="Clear selection (Esc)"
        className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <p className="text-[0.65rem] tracking-[0.3em] text-gold uppercase">
        Selected region
      </p>
      <h2 id="country-panel-title" className="mt-2 font-display text-2xl text-ivory">
        {country.name}
      </h2>
      <p className="mt-2 text-sm text-ivory-muted">Artwork collection coming soon.</p>
      <p className="mt-4 text-[0.7rem] leading-relaxed text-ivory-muted/60">
        Modern borders are shown for navigation only. Historical cultures and
        artistic traditions do not always align with them.
      </p>
    </section>
  )
}
