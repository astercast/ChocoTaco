import { CHOCO_TACO_ASSET_ID, CHOCO_LP_ASSET_ID } from '../constants'
import ChocolateDrip from '../components/ChocolateDrip'

const LINKS = [
  { label: 'twitter',     href: 'https://x.com' },
  { label: 'telegram',    href: 'https://t.me' },
  { label: 'discord',     href: '#' },
  { label: 'mintgarden',  href: 'https://mintgarden.io' },
  { label: 'dexie',       href: 'https://dexie.space' },
  { label: 'spacescan',   href: 'https://spacescan.io' },
]

export default function Footer() {
  return (
    <footer className="relative bg-cocoa-950">
      <ChocolateDrip opacity={0.9} />

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 grain">

        {/* Big farewell */}
        <div className="mb-12">
          <h2 className="display text-6xl md:text-9xl text-cream-50 leading-[0.85]">
            That's <span className="display-italic text-gold">all,</span>
            <br />
            folks.
          </h2>
          <p className="hand text-cream-300 text-3xl mt-4 ml-1 rotate-n2 inline-block">
            ~ thanks for stopping by ~
          </p>
        </div>

        {/* Receipt section */}
        <div className="grid md:grid-cols-12 gap-10 pt-8 border-t border-cream-500/10">

          {/* Brand col */}
          <div className="md:col-span-5">
            <p className="display text-2xl text-cream-50 mb-1">ChocoTaco Co.</p>
            <p className="mono text-xs text-cream-500">est. 2025 · chia network</p>
            <p className="font-serif italic text-cream-400 mt-4 max-w-sm">
              The sweetest memecoin on Chia. Hand-melted, never automated.
              {' '}<span className="hand text-cream-300 text-lg">no roadmap, no problem.</span>
            </p>
          </div>

          {/* Token info */}
          <div className="md:col-span-4">
            <p className="hand text-gold text-xl mb-3">— the receipts —</p>
            <div className="space-y-3 mono text-xs text-cream-500">
              <div>
                <p className="text-cream-600 uppercase tracking-widest mb-1">CHOCO</p>
                <p className="break-all">{CHOCO_TACO_ASSET_ID}</p>
              </div>
              <div>
                <p className="text-cream-600 uppercase tracking-widest mb-1">LP pair</p>
                <p className="break-all">{CHOCO_LP_ASSET_ID}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3">
            <p className="hand text-gold text-xl mb-3">— say hi —</p>
            <ul className="space-y-1.5">
              {LINKS.map(l => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer"
                     className="font-serif italic text-cream-300 hover:text-gold transition-colors">
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tiny print */}
        <div className="mt-12 pt-6 border-t border-cream-500/10 flex flex-wrap items-center justify-between gap-3 mono text-xs text-cream-600">
          <span>© 2025 — not financial advice, just snacks</span>
          <span>made by humans · powered by chia 🌱</span>
        </div>
      </div>
    </footer>
  )
}
