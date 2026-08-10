const MARK = '/brand/app-icon-solid-512-transparent.png'

interface LogoProps {
  size?: number
  color?: 'themed' | 'white'
  /** Shows only the mark, no wordmark — for icon-only / collapsed layouts. */
  hideWordmark?: boolean
}

export function Logo({ size = 36, color = 'themed', hideWordmark }: LogoProps) {
  const wordmarkColor = color === 'white' ? '#ffffff' : 'var(--th-text)'

  if (hideWordmark) {
    return <img src={MARK} alt="Vincel Studio" width={size} height={size} />
  }

  return (
    <div className="flex items-center gap-2">
      <img src={MARK} alt="" width={size} height={size} />
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          fontSize: size * 0.5,
          paddingTop: Math.round(size * 0.044),
        }}
      >
        <span style={{ color: wordmarkColor }}>Vincel</span>{' '}
        <span style={{ color: 'var(--th-accent)' }}>Studio</span>
      </span>
    </div>
  )
}
