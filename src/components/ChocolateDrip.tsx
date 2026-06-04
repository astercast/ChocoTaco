interface Props {
  className?: string
  flip?: boolean
  opacity?: number
  height?: number  // px
}

// Drip drops - deterministic for SSR stability, varied for organic feel
const DRIPS = [
  { cx: 35,   h: 32,  w: 14 },
  { cx: 95,   h: 58,  w: 18 },
  { cx: 145,  h: 22,  w: 12 },
  { cx: 205,  h: 68,  w: 20 },
  { cx: 268,  h: 38,  w: 16 },
  { cx: 332,  h: 54,  w: 17 },
  { cx: 395,  h: 28,  w: 13 },
  { cx: 458,  h: 72,  w: 22 },
  { cx: 528,  h: 35,  w: 15 },
  { cx: 592,  h: 60,  w: 19 },
  { cx: 655,  h: 25,  w: 12 },
  { cx: 718,  h: 50,  w: 18 },
  { cx: 782,  h: 42,  w: 16 },
  { cx: 848,  h: 65,  w: 20 },
  { cx: 912,  h: 30,  w: 14 },
  { cx: 975,  h: 56,  w: 18 },
  { cx: 1040, h: 38,  w: 16 },
  { cx: 1105, h: 70,  w: 21 },
  { cx: 1168, h: 26,  w: 13 },
  { cx: 1230, h: 48,  w: 17 },
  { cx: 1295, h: 62,  w: 19 },
  { cx: 1360, h: 34,  w: 15 },
  { cx: 1410, h: 52,  w: 17 },
]

export default function ChocolateDrip({
  className = '', flip = false, opacity = 1, height = 76,
}: Props) {
  return (
    <div
      className={`w-full overflow-hidden pointer-events-none select-none ${flip ? 'scale-y-[-1]' : ''} ${className}`}
      style={{ opacity, lineHeight: 0 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full"
        style={{ display: 'block', height: `${height}px` }}
      >
        <defs>
          {/* Main chocolate gradient */}
          <linearGradient id="dripChoco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6b4528" />
            <stop offset="35%"  stopColor="#4a2a18" />
            <stop offset="70%"  stopColor="#3a2418" />
            <stop offset="100%" stopColor="#2a1810" />
          </linearGradient>
          {/* Highlight gradient for sheen */}
          <linearGradient id="dripShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(232,156,59,0.35)" />
            <stop offset="60%"  stopColor="rgba(232,156,59,0)" />
          </linearGradient>
        </defs>

        {/* Base chocolate bar */}
        <rect x="0" y="0" width="1440" height="18" fill="url(#dripChoco)" />
        {/* Top sheen */}
        <rect x="0" y="0" width="1440" height="6" fill="url(#dripShine)" />

        {/* Drip drops */}
        {DRIPS.map((d, i) => (
          <g key={i}>
            {/* Connecting neck */}
            <rect
              x={d.cx - d.w * 0.28}
              y={16}
              width={d.w * 0.56}
              height={d.h * 0.55}
              fill="url(#dripChoco)"
            />
            {/* Bottom drop */}
            <ellipse
              cx={d.cx}
              cy={18 + d.h - d.w / 2}
              rx={d.w / 2}
              ry={d.w / 2 + 2}
              fill="url(#dripChoco)"
            />
            {/* Highlight pip */}
            <ellipse
              cx={d.cx - d.w * 0.15}
              cy={18 + d.h - d.w / 2 - 1}
              rx={d.w * 0.12}
              ry={d.w * 0.16}
              fill="rgba(232,156,59,0.5)"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
