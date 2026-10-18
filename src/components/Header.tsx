export default function Header() {
  return (
    <header className="pointer-events-none px-6 pt-8 text-center sm:px-10 sm:pt-12">
      <h1 className="font-display text-4xl font-normal tracking-wide text-ivory sm:text-5xl">
        Atlas of Art
      </h1>
      <div className="mx-auto mt-4 h-px w-12 bg-gold/60" aria-hidden="true" />
      <p className="mt-4 text-xs tracking-[0.3em] text-ivory-muted uppercase sm:text-sm">
        Explore art through geography.
      </p>
    </header>
  )
}
