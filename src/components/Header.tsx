import type { ReactNode } from 'react'

interface HeaderProps {
  /** Optional controls on the right (e.g. the development theme switch). */
  children?: ReactNode
}

/** Slim top bar. It sits above the globe area, so the globe never runs under the title. */
export default function Header({ children }: HeaderProps) {
  return (
    <header className="relative z-20 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-gold/15 bg-ink/60 px-5 py-2.5 backdrop-blur-md sm:min-h-16 sm:px-8">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="font-display text-xl font-normal tracking-wide text-ivory sm:text-2xl">
          Atlas of Art
        </h1>
        <span className="hidden h-5 w-px bg-gold/50 sm:block" aria-hidden="true" />
        <p className="text-[0.65rem] tracking-[0.25em] text-ivory-muted uppercase sm:text-xs">
          Explore art through geography.
        </p>
      </div>
      {children}
    </header>
  )
}
