import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Mascot from '../components/Mascot'
import { PAYDAY } from '../constants'

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="py-20 px-6 relative grain overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="hidden md:block absolute -right-4 lg:right-0 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none">
          <Mascot size={140} />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="modern-light text-2xl md:text-4xl leading-tight text-cream-100 max-w-4xl"
        >
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">500</span>{' '}
          <span className="text-cream-300">factory tacos,</span>{' '}
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">50</span>{' '}
          <span className="text-cream-300">golden tickets,</span>{' '}
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">{PAYDAY.totalSupplyCAT}</span>{' '}
          <span className="text-cream-300"><span className="mono">$🍫🌮</span> total,</span>{' '}
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">{PAYDAY.communityDistributedCAT}</span>{' '}
          <span className="text-cream-300">already distributed,</span>{' '}
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">{PAYDAY.vaultTotalCAT}</span>{' '}
          <span className="text-cream-300">from the distribution vault over</span>{' '}
          <span className="modern-display text-gold inline-block text-3xl md:text-5xl">3 years</span>.{' '}
          <span className="hand text-cream-400 text-2xl md:text-3xl">show up early.</span>
        </motion.p>

        <div className="mt-16 pt-8 border-t border-cream-500/10 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          {[
            { num: '500',     label: 'factory tacos' },
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
              <span className="modern-display text-3xl md:text-4xl text-cream-50">{s.num}</span>
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
