import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'Okay but what IS this?',
    a: "ChocoTaco is a Chia memecoin with a real reward loop. 500 OG NFTs (1 XCH each) act as Factory Employee badges — every Sunday the Factory sends CHOCO CATs to holders based on Cocoa Unit points. 50 of the OGs are random Golden Tickets that earn 3× forever. Hold LP and your whole OG stack also gets a 3× multiplier. That's the engine.",
  },
  {
    q: 'How are rewards actually paid out?',
    a: "Every Sunday 17:00 UTC the backend snapshots all OG + Limited Edition NFTs + LP holders, computes Cocoa Units per wallet, and divides ~15 CHOCO from the 1011-CAT vault that week. You see your claimable amount in the Factory Floor section and one-click claim it via Chia offer. Emissions decay 1%/week so the vault lasts 2.5+ years.",
  },
  {
    q: 'What happens to my 1 XCH when I mint?',
    a: "Every XCH from the OG mint goes directly into the TibetSwap CHOCO/XCH liquidity pool. 100% of it. No team allocation, no marketing slush — straight into making the token deep and tradeable. 500 XCH from a single mint will be the deepest memecoin pool Chia has ever seen.",
  },
  {
    q: 'How do Golden Tickets work?',
    a: "50 of the 500 OG mints are Golden Tickets — but the assignment is provably random, generated from the first mint transaction hash + block height. After the mint closes, the seed is published on-chain and everyone can verify. Golden Tickets get 30 Cocoa Units (vs 10 for standard) and a shiny metadata flag.",
  },
  {
    q: 'Wait, do I need to send you my coins?',
    a: "No. Never. We read your wallet through WalletConnect + SpaceScan — your keys stay where they are, we just check what you own. Snapshots happen server-side from public chain data. Claims come through Chia Offers that you sign in your own wallet.",
  },
  {
    q: 'What about the 25% royalties?',
    a: "Every secondary sale (forever, enforced on-chain by NFT1) sends 25% to the Factory Treasury. That fund tops up LP, pays for future Limited Edition artist drops, and eventually goes to a DAO vote of OG + LP holders.",
  },
  {
    q: 'I made it this far. What now?',
    a: "Mint window isn't open yet — follow @ChocoTacoChia on X and you'll know the minute it goes live. Right now you can connect your wallet to see how the dashboard will look once you're holding.",
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
