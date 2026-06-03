interface Props {
  items: string[]
  variant?: 'gold' | 'cream' | 'chili'
}

export default function Marquee({ items, variant = 'gold' }: Props) {
  const bg = {
    gold:  'bg-gold text-cocoa-950',
    cream: 'bg-cream-100 text-cocoa-950',
    chili: 'bg-chili text-cream-50',
  }[variant]

  // Duplicate items for seamless loop
  const looped = [...items, ...items, ...items, ...items]

  return (
    <div className={`${bg} overflow-hidden py-3 border-y border-cocoa-950/20`}>
      <div className="flex animate-marquee whitespace-nowrap">
        {looped.map((item, i) => (
          <span key={i} className="inline-flex items-center mx-6 font-serif font-bold text-lg tracking-tight">
            {item}
            <span className="ml-12 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
