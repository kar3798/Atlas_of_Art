interface PanelNavProps {
  backLabel: string
  onBack: () => void
  onClose?: () => void
  closeLabel?: string
}

/** Back (and optional close) controls at the top of a panel view. */
export default function PanelNav({ backLabel, onBack, onClose, closeLabel }: PanelNavProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-xs tracking-wide text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
      >
        <span aria-hidden="true">←</span> {backLabel}
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={`${closeLabel} (Esc)`}
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </div>
  )
}
