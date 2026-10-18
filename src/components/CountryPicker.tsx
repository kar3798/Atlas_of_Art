import { SELECTABLE_COUNTRIES } from '../data/selectableCountries'
import { countryOptionId } from '../lib/elementIds'
import type { SelectableCountryId } from '../types/country'

interface CountryPickerProps {
  selectedId: SelectableCountryId | null
  onSelect: (id: SelectableCountryId) => void
}

export default function CountryPicker({ selectedId, onSelect }: CountryPickerProps) {
  return (
    <div
      role="group"
      aria-label="Select a country"
      className="pointer-events-auto flex gap-1 rounded-full border border-gold/25 bg-ink/60 p-1 backdrop-blur-md"
    >
      {SELECTABLE_COUNTRIES.map((country) => {
        const isSelected = country.id === selectedId
        return (
          <button
            key={country.id}
            id={countryOptionId(country.id)}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(country.id)}
            className={`min-h-11 rounded-full px-6 text-xs tracking-[0.25em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              isSelected
                ? 'bg-gold/90 text-ink'
                : 'text-ivory-muted hover:bg-ivory/10 hover:text-ivory'
            }`}
          >
            {country.name}
          </button>
        )
      })}
    </div>
  )
}
