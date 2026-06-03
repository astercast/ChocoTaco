import { CHOCO_TACO_ASSET_ID, CHOCO_LP_ASSET_ID } from '../constants'
import ChocolateDrip from '../components/ChocolateDrip'

const LINKS = [
  { label: 'twitter / X',  href: 'https://x.com/ChiaChocoTaco' },
  { label: 'mintgarden',   href: 'https://mintgarden.io/profile/chia-choco-taco-573e85c112731831c7ddd21d7c0ef19f96ebf7d889937831299c822e14479f56' },
  { label: 'dexie',        href: 'https://dexie.space/offers/%F0%9F%8D%AB%F0%9F%8C%AE/XCH' },
  { label: '$🍫🌮 token',  href: 'https://www.spacescan.io/token/46ec3dc25b32221e88fad0ee20f84f7dfff13dbee844497232cb08c8df532b15' },
  { label: '$🍫🌮 LP',     href: 'https://www.spacescan.io/token/3a622700d70111506823d5aa0bfd5c2d7937ed5552ef204f8a55105cf48f95ab' },
  { label: 'caster101',    href: 'https://caster101.xyz' },
]

export default function Footer() {
  return (
    <footer className="relative bg-cocoa-950">
      <ChocolateDrip opacity={0.9} />

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 grain">

        {/* Receipt section */}
        <div className="grid md:grid-cols-12 gap-10 pt-8">

          {/* Brand col */}
          <div className="md:col-span-5">
            <p className="display text-2xl text-cream-50 mb-1">BearMarket Co.</p>
            <p className="mono text-xs text-cream-500">est. 2026 · chia network</p>
            <p className="font-serif italic text-cream-400 mt-4 max-w-sm">
              The sweetest memecoin on Chia.
            </p>
          </div>

          {/* Token info */}
          <div className="md:col-span-4">
            <p className="hand text-gold text-xl mb-3">the receipts</p>
            <div className="space-y-3 mono text-xs text-cream-500">
              <div>
                <p className="text-cream-600 uppercase tracking-widest mb-1">$🍫🌮</p>
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
            <p className="hand text-gold text-xl mb-3">links</p>
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
          <span>© 2026 BearMarket Co. · not financial advice, just snacks</span>
          <span>made by a wizard · powered by chia 🌱</span>
        </div>
      </div>
    </footer>
  )
}
