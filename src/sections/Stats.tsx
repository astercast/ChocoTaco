import { motion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import Mascot from '../components/Mascot'
import { PAYDAY } from '../constants'

function StatNum({ children }: { children: ReactNode }) {
  return (
    <span className="modern-display text-gold text-[1.65rem] sm:text-3xl md:text-5xl">
      {children}
    </span>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="section-pad relative grain overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="hidden md:block absolute -right-4 lg:right-0 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none">
          <Mascot size={140} />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="space-y-3 sm:space-y-4 max-w-4xl"
        >
          <p className="modern-light text-lg sm:text-2xl md:text-4xl leading-snug text-cream-100 text-pretty">
            <StatNum>500</StatNum> factory tacos, <StatNum>50</StatNum> golden tickets.
          </p>
          <p className="modern-light text-lg sm:text-2xl md:text-4xl leading-snug text-cream-100 text-pretty">
            <StatNum>{PAYDAY.totalSupplyCAT}</StatNum>{' '}
            <span className="mono">$🍫🌮</span> total,{' '}
            <StatNum>{PAYDAY.vaultTotalCAT}</StatNum> from the distribution vault over{' '}
            <StatNum>3</StatNum> years.
          </p>
          <p className="hand text-cream-400 text-xl sm:text-2xl md:text-3xl keep-together pt-1">
            show up early.
          </p>
        </motion.div>

        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-cream-500/10 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-3 sm:gap-x-4">
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
              className="flex flex-col min-w-0"
            >
              <span className="modern-display text-2xl sm:text-3xl md:text-4xl text-cream-50">{s.num}</span>
              <span className="mono text-2xs sm:text-xs text-cream-500 uppercase tracking-widest mt-1 leading-tight">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
