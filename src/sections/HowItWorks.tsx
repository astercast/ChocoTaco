import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'Okay but what IS this?',
    a: "ChocoTaco is a Chia memecoin with a real reward loop. 500 OG NFTs (0.5 XCH each) act as Factory Employee badges. Every Wednesday the Factory takes a snapshot, and you come claim $🍫🌮 tokens based on your Cocoa Unit points. 50 of the OGs are pre-minted Golden Tickets that earn 3x forever. Holding LP multiplies your OG total, with no cap. That's the engine.",
  },
  {
    q: 'How are rewards actually paid out?',
    a: "Every Wednesday at 17:00 UTC the backend takes a snapshot of every wallet's OG NFTs, Limited Editions, and LP balance. Your share of that week's $🍫🌮 emission is calculated and made available to claim. The factory does NOT send anything automatically. You have to come to the site and claim it yourself. You have 3 full days after the snapshot to claim 100%. Starting on day 4, that week's portion shrinks by 10% per day. Unclaimed weeks stack on top of each other in your balance, so you can let them pile up, but each one keeps decaying on its own clock. Bottom line: pull, not push. Show up at least once a week to get the full payout.",
  },
  {
    q: 'What happens to my 0.5 XCH when I mint?',
    a: "Every XCH from the OG mint goes directly into the TibetSwap $🍫🌮/XCH liquidity pool. 100% of it. No team allocation, no marketing slush. Straight into making the token deep and tradeable.",
  },
  {
    q: 'How do Golden Tickets work?',
    a: "50 of the 500 OG NFTs are pre-minted with the Golden Ticket flag baked into the metadata. They're shuffled randomly into the mint order so nobody knows which mint number will be golden until it happens. Golden Tickets are worth 30 Cocoa Units instead of 10. The shiny flag is permanent and on-chain.",
  },
  {
    q: 'How does the LP multiplier work?',
    a: "Your Cocoa Units from OG NFTs get multiplied by (1 + LP balance × 2). So holding 0.5 LP gives 2x, 1 LP gives 3x, 5 LP gives 11x, 100 LP gives 201x. There is no cap. The deeper you go into the pool the bigger your share of every weekly payday. This is the main lever for power users.",
  },
  {
    q: 'Wait, do I need to send you my coins?',
    a: "No. Never. We read your wallet through WalletConnect and SpaceScan. Your keys stay where they are, we just check what you own. Snapshots happen server-side from public chain data. Claims come through Chia Offers that you sign in your own wallet.",
  },
  {
    q: 'I made it this far. What now?',
    a: "Mint window isn't open yet. Follow @ChiaChocoTaco on X and you'll know the minute it goes live. Right now you can connect your wallet to see how the dashboard will look once you're holding.",
  },
]

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="border-b border-cream-500/10 py-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-6 text-left group"
      >
        <h3 className="font-serif text-2xl md:text-3xl text-cream-50 group-hover:text-gold transition-colors leading-tight">
          {q}
        </h3>
        <span className="shrink-0 mt-2 text-cream-400">
          {open ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="text-cream-300 text-lg leading-relaxed pt-4 max-w-2xl">
          {a}
        </p>
      </motion.div>
    </div>
  )
}

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="py-24 px-6 grain relative">
      <div className="max-w-5xl mx-auto">

        {/* Left-aligned, mixed type headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-3xl"
        >
          <div className="flex items-baseline gap-3 mb-4 flex-wrap">
            <span className="chip">FAQ</span>
            <span className="hand text-cream-400 text-2xl">↓ scroll if you're new</span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-cream-50 leading-none">
            Questions you probably <span className="display-italic text-gold">have.</span>
          </h2>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="border-t border-cream-500/10"
        >
          {FAQS.map((f, i) => (
            <FaqRow key={i} q={f.q} a={f.a} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
