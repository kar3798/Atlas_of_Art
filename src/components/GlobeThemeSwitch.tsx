import { GLOBE_THEMES, type GlobeThemeId } from '../styles/globeThemes'

interface GlobeThemeSwitchProps {
  themeId: GlobeThemeId
  onChange: (id: GlobeThemeId) => void
}

const THEME_IDS = Object.keys(GLOBE_THEMES) as GlobeThemeId[]

/** Development-only control for comparing globe styles. Not rendered in production builds. */
export default function GlobeThemeSwitch({ themeId, onChange }: GlobeThemeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Globe style (development only)"
      className="pointer-events-auto flex items-center gap-1 rounded-full border border-ivory/15 bg-ink/70 p-1 text-[0.65rem] tracking-[0.15em] uppercase backdrop-blur-md"
    >
      <span className="px-2 text-ivory-muted/60">Dev</span>
      {THEME_IDS.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === themeId}
          onClick={() => onChange(id)}
          className={`rounded-full px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
            id === themeId ? 'bg-ivory/15 text-ivory' : 'text-ivory-muted hover:text-ivory'
          }`}
        >
          {GLOBE_THEMES[id].label}
        </button>
      ))}
    </div>
  )
}
