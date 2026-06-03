# ChocoTaco

The sweetest memecoin on Chia. A premium 500-edition NFT mint, weekly CHOCO CAT rewards, and a permanent on-chain treasury fed by 25% royalties.

---

## What's built

A complete React + Vite + TypeScript dApp with the full ChocoTaco V2 mechanics wired in. Every UI surface exists; the only things missing are the values you fill in after deploying art, the WalletConnect project, and the backend Worker.

### Site sections (in order)

| Section | File | Purpose |
|---|---|---|
| Hero | `src/sections/Hero.tsx` | Asymmetric headline with sticker callouts, wallet connect CTA, asset ID copy |
| Marquee | `src/components/Marquee.tsx` | Scrolling ticker bar with key stats |
| Stats | `src/sections/Stats.tsx` | Editorial sentence with the four headline numbers |
| FAQ | `src/sections/HowItWorks.tsx` | Seven plain-language answers to real holder questions |
| Factory Floor | `src/sections/EarnDashboard.tsx` | Live Cocoa Units breakdown + claim button |
| OG Mint | `src/sections/WeeklyMint.tsx` | 500-supply launch with quantity selector, Golden Ticket info, progress bar |
| Limited Editions | `src/sections/Generator.tsx` | Future artist drop preview / trait selector |
| Gallery | `src/sections/Gallery.tsx` | Polaroid wall of every OG NFT |
| Footer | `src/sections/Footer.tsx` | Asset IDs, social links, receipts |

Each section is separated by an SVG chocolate drip (`ChocolateDrip.tsx`) and most use mixed typography (Fraunces variable serif + Caveat handwritten + JetBrains Mono utility) so it reads as hand-crafted rather than templated.

---

## V2 reward mechanics

### Cocoa Units (points system)

| Source | Points | Stacks? |
|---|---|---|
| Standard OG NFT | 10 each | yes |
| Golden Ticket OG NFT | 30 each | yes |
| Limited Edition NFT | 15–40 by rarity | yes |
| LP Tier (holding TibetSwap CHOCO/XCH LP CAT) | **3× multiplier on all OG points** | yes (wallet-wide) |
| Weekly social bonus (verified #ChocotacoFactory tweet) | +15 for that week | yes |

The math lives as a pure function in `src/constants.ts`:

```ts
computeCocoaPoints({ standardOgs, goldenOgs, limitedPoints, weeklyBonus, hasLP })
```

### Weekly payday

- Vault: **1011 CHOCO CATs** total
- Week 1 emission: **15 CHOCO** distributed across all holders
- Decay: **1% per week** (compounds — vault lasts 2.5+ years)
- Snapshot: **Sunday 17:00 UTC**
- Your payout: `(your points / total network points) × weekly emission`
- Claim: one-click via Chia Offer signed in your own wallet

### OG launch parameters

```ts
OG_MINT = {
  supply:           500,
  priceXCH:         1.0,
  royaltyPercent:   25,   // enforced on-chain by NFT1
  goldenTickets:    50,   // randomly assigned, provably fair
  liquiditySeedXCH: 500,  // 100% of mint proceeds → TibetSwap LP
}
```

### Golden Ticket randomness

50 of the 500 OG NFTs become Golden Tickets. After mint closes, the seed is computed as:

```
seed = SHA256(first_mint_tx_hash || block_height)
```

The seed is published on-chain as a transaction memo, and the indices it generates determine which NFTs receive the `golden: true` metadata flag. Anyone can reproduce the calculation and verify.

---

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **TailwindCSS 3** with a custom chocolate palette (`cocoa-*`, `cream-*`, `gold`, `chili`, `mint`)
- **Framer Motion** for scroll-triggered animations
- **lucide-react** for icons
- **@walletconnect/sign-client v2** for Chia wallet connection (Sage + reference wallet supported)
- **SpaceScan API** for on-chain holdings verification
- **MintGarden API** for NFT metadata (Golden Ticket flag detection)
- **Cloudflare Workers + D1** for the backend snapshot + claim API (to be deployed)

---

## Project structure

```
src/
├── api/
│   ├── walletconnect.ts    # Chia WalletConnect v2 + CAIP-10 address resolution
│   ├── spacescan.ts        # NFT + CAT balance verification (with golden flag detection)
│   └── claims.ts           # POSTs to backend Worker for snapshot claims
├── components/
│   ├── Navbar.tsx          # Fixed header with wallet button
│   ├── ChocolateDrip.tsx   # SVG drip separator
│   └── Marquee.tsx         # Scrolling ticker
├── context/
│   └── WalletContext.tsx   # Connect/verify/claim state + Cocoa Unit derivation
├── sections/
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── HowItWorks.tsx      # FAQ accordion
│   ├── EarnDashboard.tsx   # Factory Floor — points + claim
│   ├── WeeklyMint.tsx      # OG Mint section (named OgMint in code)
│   ├── Generator.tsx       # Limited Editions preview
│   ├── Gallery.tsx
│   └── Footer.tsx
├── constants.ts            # All token IDs, mint params, COCOA math, TIERS
├── App.tsx                 # Layout — sections + drip separators + marquees
├── main.tsx
├── index.css               # Tailwind + custom component classes
└── vite-env.d.ts
```

---

## Local development

```bash
npm install
npm run dev          # starts on localhost:5173
npm run build        # production build (must pass before deploy)
npm run preview      # serve the built bundle
```

In dev mode, `connectWallet()` and `fetchHoldings()` return mock data so you can iterate on the UI without hitting any network. Mock values:

- Standard OGs: 2
- Golden OGs: 1
- Limited points: 50
- Has LP: true
- Claimable: 4.2 CHOCO

---

## What you still need to wire up

### 1. Environment variables (`.env.local`)

```
VITE_WALLETCONNECT_PROJECT_ID=<get free at cloud.walletconnect.com>
VITE_CHAIN_ID=chia:mainnet
VITE_WORKER_URL=https://chocotaco-api.<your-subdomain>.workers.dev
```

### 2. Collection IDs (after MintGarden deploy)

`src/api/spacescan.ts`:

```ts
export const OG_COLLECTION_ID      = ''  // ← paste collection ID
export const LIMITED_COLLECTION_ID = ''  // ← later, when first Limited drop
```

### 3. Mint state toggle

`src/sections/WeeklyMint.tsx`:

```ts
const MINT_STATE: 'pre' | 'live' | 'sold-out' = 'pre'  // flip when ready
const MINTED_COUNT = 0  // replace with /api/network-stats fetch
```

### 4. Real WalletConnect (production)

`src/api/walletconnect.ts` has the full production code commented out. Uncomment it, install the deps:

```bash
npm install @walletconnect/sign-client @walletconnect/utils qrcode
```

### 5. Cloudflare Worker (the backend)

Not yet written. Needs to expose:

- `POST /api/claim` — re-verifies holdings, builds CHOCO offer from treasury, returns offer string
- `GET /api/snapshot/:address` — current week's claimable + estimated next week
- `GET /api/network-stats` — mint progress, vault remaining, total holders, total points
- `POST /api/social/verify` — checks tweet, grants weekly +15 Cocoa Units
- Cron `0 17 * * 0` (Sun 17:00 UTC) — runs the snapshot

Required D1 tables:

```sql
CREATE TABLE snapshots (
  week_iso       TEXT,
  address        TEXT,
  points         INTEGER,
  claimable_cat  REAL,
  claimed_at     INTEGER,
  PRIMARY KEY (week_iso, address)
);

CREATE TABLE social_bonuses (
  week_iso  TEXT,
  address   TEXT,
  tweet_url TEXT,
  PRIMARY KEY (week_iso, address)
);

CREATE TABLE network_stats (
  week_iso         TEXT PRIMARY KEY,
  total_points     INTEGER,
  weekly_emission  REAL,
  vault_remaining  REAL
);
```

### 6. Off-chain operational setup

- **MintGarden collection** with 25% royalty + treasury puzzle hash
- **500 OG art files** + metadata JSON (template in this README below)
- **Treasury wallet** holding the 1011 CHOCO vault + a small XCH balance for offer fees
- **TibetSwap pool seeded** post-mint with all 500 XCH + your chosen CHOCO amount

### NFT metadata template

```json
{
  "name": "ChocoTaco OG #001",
  "description": "Factory Employee Badge — ChocoTaco Co.",
  "collection": {
    "name":   "ChocoTaco OGs",
    "family": "ChocoTaco"
  },
  "attributes": [
    { "trait_type": "Edition", "value": "OG" },
    { "trait_type": "Golden",  "value": false }
  ]
}
```

The `Golden` attribute is flipped to `true` by the post-mint reveal Worker for the 50 lottery winners.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Framework preset: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add env vars in the Vercel dashboard
7. Deploy

The build runs `tsc -b && vite build` — both steps must pass. If TypeScript errors block the build, run `npm run build` locally first to see the full output (Vercel sometimes truncates the log).

---

## Design notes

The palette and typography are deliberate, not generic dark-mode:

- **`cocoa-900` (#1a0d05)** as the base — actual chocolate brown, not flat black
- **`cream-50` (#fef9ef)** for primary text and polaroid frames — warm paper tone
- **`gold` (#e89c3b)** as the single primary accent (caramel)
- **`chili` (#c05626)** as secondary (burnt sugar / heat)
- **`mint` (#7fb069)** only for the "FRESH" sticker — the green pops on chocolate
- **Fraunces variable serif** with WONK/SOFT axes for the display headlines — gives the type its hand-cut feel
- **Caveat** for handwritten margin notes — adds the "Sharpie on a chocolate-bar wrapper" vibe
- **JetBrains Mono** for data (asset IDs, addresses, numbers) — readable + utilitarian

Sections deliberately do not repeat the same layout template. The FAQ is plain accordion text. The Factory Floor is a tilted paper receipt. The OG Mint is a polaroid with a tape strip. The Gallery is a scattered pinned wall. The Stats are an editorial sentence. This is what keeps it from feeling auto-generated.

---

## License

MIT — do whatever, just don't pretend you made it.
