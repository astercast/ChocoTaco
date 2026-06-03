import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="py-20 px-6 relative grain">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl md:text-5xl leading-tight text-cream-100 max-w-4xl"
        >
          <span className="display text-gold inline-block">500</span>{' '}
          <span className="text-cream-300">OG badges,</span>{' '}
          <span className="display text-gold inline-block">50</span>{' '}
          <span className="text-cream-300">golden tickets,</span>{' '}
          weekly CHOCO paydays{' '}
          <span className="display-italic text-gold">forever</span>.{' '}
          <span className="hand text-cream-400 text-3xl md:text-4xl">the math is simple.</span>
        </motion.p>

        <div className="mt-16 pt-8 border-t border-cream-500/10 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          {[
            { num: '500',     label: 'OG NFTs' },
            { num: '0.5 XCH', label: 'mint price' },
            { num: '50',      label: 'golden tickets' },
            { num: '∞',       label: 'LP multiplier ceiling' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              className="flex flex-col"
            >
              <span className="display text-3xl md:text-4xl text-cream-50">{s.num}</span>
              <span className="mono text-xs text-cream-500 uppercase tracking-widest mt-1">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
