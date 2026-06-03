interface Props {
  className?: string
  flip?: boolean
  opacity?: number
}

// Deterministic drip positions — no randomness so SSR/hydration is stable
const DRIPS = [
  { cx: 55,   h: 38 }, { cx: 140,  h: 52 }, { cx: 220,  h: 29 },
  { cx: 310,  h: 61 }, { cx: 400,  h: 41 }, { cx: 490,  h: 55 },
  { cx: 580,  h: 33 }, { cx: 660,  h: 48 }, { cx: 745,  h: 62 },
  { cx: 835,  h: 36 }, { cx: 920,  h: 50 }, { cx: 1010, h: 44 },
  { cx: 1100, h: 58 }, { cx: 1190, h: 31 }, { cx: 1280, h: 53 },
  { cx: 1370, h: 42 }, { cx: 1430, h: 35 },
]

export default function ChocolateDrip({ className = '', flip = false, opacity = 1 }: Props) {
  return (
    <div
      className={`w-full overflow-hidden pointer-events-none select-none ${flip ? 'scale-y-[-1]' : ''} ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 72"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full"
        style={{ display: 'block', height: '64px' }}
      >
        <defs>
          <linearGradient id="dripGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#5a3a24" />
            <stop offset="60%"  stopColor="#3a2418" />
            <stop offset="100%" stopColor="#2a1810" />
          </linearGradient>
        </defs>

        {/* Base bar */}
        <rect x="0" y="0" width="1440" height="16" fill="url(#dripGrad)" />

        {/* Drip drops */}
        {DRIPS.map((d, i) => {
          const w = 12 + (i % 3) * 5
          return (
            <ellipse
              key={i}
              cx={d.cx}
              cy={16 + d.h / 2}
              rx={w / 2}
              ry={d.h / 2}
              fill="url(#dripGrad)"
            />
          )
        })}
      </svg>
    </div>
  )
}
