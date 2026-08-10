const MARK = '/brand/app-icon-solid-512-transparent.png'

interface LogoProps {
  size?: number
  color?: 'themed' | 'white'
}

export function Logo({ size = 36, color = 'themed' }: LogoProps) {
  const wordmarkColor = color === 'white' ? '#ffffff' : 'var(--th-text)'

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
