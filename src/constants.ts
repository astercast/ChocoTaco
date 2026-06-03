// ─── Token / pool identifiers ────────────────────────────────────────────────

export const CHOCO_TACO_ASSET_ID =
  '8df67763ad273f4a08f8f19f8a172d80b38ad940f32fe20b0b2ed3d665edf575'

// TibetSwap CHOCO/XCH LP CAT — what holders receive when they LP on TibetSwap
export const CHOCO_LP_ASSET_ID =
  '3a622700d70111506823d5aa0bfd5c2d7937ed5552ef204f8a55105cf48f95ab'

// External APIs
export const SPACESCAN_API = 'https://api2.spacescan.io'
export const TIBETSWAP_API = 'https://api.v2.tibetswap.io'
export const MINTGARDEN_API = 'https://api.mintgarden.io'

// ─── OG mint parameters ──────────────────────────────────────────────────────

export const OG_MINT = {
  supply:           500,
  priceXCH:         1.0,
  royaltyPercent:   25,
  goldenTickets:    50,
  // 100% of mint proceeds → seeded into TibetSwap CHOCO/XCH pool
  liquiditySeedXCH: 500,
} as const

// ─── Reward economy (Cocoa Units) ────────────────────────────────────────────

export const COCOA = {
  perOg:           10,    // standard OG NFT
  perGolden:       30,    // golden ticket OG NFT (3× baked in)
  perLimitedMin:   15,    // future limited edition NFTs
  perLimitedMax:   40,
  lpMultiplier:    3.0,   // applied to wallet-wide OG points
  lpDustThreshold: 0.001, // minimum LP CAT to qualify for 3×
  weeklySocial:    15,    // verified #ChocotacoFactory tweet (1-week)
} as const

// ─── Weekly payday (1011 CAT vault) ──────────────────────────────────────────

export const PAYDAY = {
  vaultTotalCAT:        1011,
  emissionWeek1CAT:     15,
  weeklyDecayPercent:   1,
  snapshotDayUTC:       0,  // Sunday
  snapshotHourUTC:      17, // 5pm UTC
} as const

// ─── Visual tier rendering (derived from points, not held tokens) ────────────

export const TIERS = [
  { id: 'visitor',     label: 'Visitor',      minPoints: 0,    color: 'text-cream-500' },
  { id: 'employee',    label: 'Employee',     minPoints: 10,   color: 'text-cream-300' },
  { id: 'foreman',     label: 'Foreman',      minPoints: 50,   color: 'text-gold' },
  { id: 'partner',     label: 'Partner',      minPoints: 100,  color: 'text-gold' },
  { id: 'chocolatier', label: 'Chocolatier',  minPoints: 250,  color: 'text-chili' },
] as const

export type TierId = (typeof TIERS)[number]['id']

// ─── Helpers ─────────────────────────────────────────────────────────────────

export interface CocoaInputs {
  standardOgs:    number  // # of standard OG NFTs held
  goldenOgs:      number  // # of Golden Ticket OG NFTs held
  limitedPoints:  number  // sum of points from limited edition NFTs
  weeklyBonus:    number  // weekly social bonus this week (0 or COCOA.weeklySocial)
  hasLP:          boolean // holds CHOCO/XCH LP CAT above dust threshold
}

/** Pure point calculator — matches the V2 spec exactly */
export function computeCocoaPoints(inp: CocoaInputs): number {
  const ogPoints   = inp.standardOgs * COCOA.perOg + inp.goldenOgs * COCOA.perGolden
  const multiplied = inp.hasLP ? ogPoints * COCOA.lpMultiplier : ogPoints
  return multiplied + inp.limitedPoints + inp.weeklyBonus
}

export function resolveTier(points: number) {
  return [...TIERS].sort((a, b) => b.minPoints - a.minPoints)
    .find(t => points >= t.minPoints) ?? TIERS[0]
}
