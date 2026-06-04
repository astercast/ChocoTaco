import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { PAYDAY } from '../constants'

const FAQS = [
  {
    q: 'Okay but what IS this?',
    a: `ChocoTaco is a Chia memecoin with a real reward loop. 500 factory tacos (0.5 XCH each, cooked on demand at the factory) act as Factory Employee badges. Every Wednesday for 3 years the Factory takes a snapshot, and you come claim $🍫🌮 tokens based on your Cocoa Unit points. ${PAYDAY.vaultTotalCAT} tokens are distributed across 156 weeks with annual halvings so early participation pays the most. 50 of the factory tacos come out as Golden Tickets that earn 3x for life. Holding LP multiplies your factory taco total with no cap. That's the engine.`,
  },
  {
    q: 'How are rewards actually paid out?',
    a: `Each Wednesday at 17:00 UTC we snapshot every wallet's Cocoa Units (factory tacos, Limited Editions, LP). That week's emission is split between holders proportionally: 10% of network points = 10% of the share. All shares add up to the emission exactly, never more. The Factory doesn't auto-send anything; you come to the site and claim it. 3 days for full payout, then 10% decay per day. Unclaimed weeks stack but keep shrinking. After 156 weeks the ${PAYDAY.vaultTotalCAT} vault is empty and snapshots end.`,
  },
  {
    q: 'What happens to my 0.5 XCH when I mint?',
    a: "Every XCH from the factory taco mint goes directly into the TibetSwap $🍫🌮/XCH liquidity pool. 100% of it. No team allocation, no marketing slush. Straight into making the token deep and tradeable.",
  },
  {
    q: 'How do Golden Tickets work?',
    a: "50 random mint slots between #001 and #500 are flagged as Golden ahead of launch. Every mint is generated fresh on demand, but if you happen to land on one of the Golden slot numbers, the metadata gets stamped with Golden: true before the NFT is even minted. Golden Tickets are worth 30 Cocoa Units instead of 10. The flag is permanent and on-chain, and the 50 reserved slot numbers are published publicly so anyone can verify.",
  },
  {
    q: 'Why halvings? Why 3 years?',
    a: `${PAYDAY.vaultTotalCAT} $🍫🌮 total, distributed over exactly 156 weeks. Year 1 emits 11.11/week, year 2 halves to 5.55/week, year 3 halves again to 2.78/week. Early holders earn up to 4× more per Cocoa Unit than year-3 holders. By week 156 the entire vault is gone and weekly snapshots stop. The whole distribution chart is on the /distribution page so anyone can see exactly where every token went.`,
  },
  {
    q: 'How does the LP multiplier work?',
    a: "Your factory-taco Cocoa Units get multiplied by 1 + √(LP balance). So 1 LP = 2x, 4 LP = 3x, 9 LP = 4x, 25 LP = 6x, 100 LP = 11x, 1000 LP = ~32x. There's no hard cap, but the diminishing returns mean a single whale can't eat the whole pool. Adding more LP always helps, it just stops scaling linearly past a certain point. This is the main lever for power users.",
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
          <h2 className="modern-display text-6xl md:text-8xl text-cream-50 uppercase leading-[0.9]">
            You've got
            <br />
            <span className="text-gold">questions.</span>
          </h2>
          <p className="hand text-cream-400 text-2xl mt-4 rotate-n2 inline-block">
            (good ones, probably)
          </p>
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
