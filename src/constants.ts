// ─── Token / pool identifiers ────────────────────────────────────────────────

export const CHOCO_TACO_ASSET_ID =
  '46ec3dc25b32221e88fad0ee20f84f7dfff13dbee844497232cb08c8df532b15'

// TibetSwap CHOCO/XCH LP CAT
export const CHOCO_LP_ASSET_ID =
  '3a622700d70111506823d5aa0bfd5c2d7937ed5552ef204f8a55105cf48f95ab'

// External APIs
export const SPACESCAN_API  = 'https://api2.spacescan.io'
export const TIBETSWAP_API  = 'https://api.v2.tibetswap.io'
export const MINTGARDEN_API = 'https://api.mintgarden.io'

// ─── OG mint parameters ──────────────────────────────────────────────────────

export const OG_MINT = {
  supply:           500,
  priceXCH:         0.5,
  royaltyPercent:   25,
  goldenTickets:    50,   // pre-minted with Golden flag, randomly shuffled into mint order
  liquiditySeedXCH: 250,  // 100% of mint proceeds → TibetSwap (500 * 0.5)
} as const

// ─── Reward economy (Cocoa Units) ────────────────────────────────────────────

export const COCOA = {
  perOg:               10,    // standard OG NFT
  perGolden:           30,    // golden ticket OG NFT (3× baked in)
  perLimitedMin:       15,    // future limited edition NFTs
  perLimitedMax:       40,
  lpMultiplierFactor:  2,     // multiplier = 1 + (lpBalance * factor), no cap
  lpDustThreshold:     0.001, // minimum LP CAT to qualify for any boost
  weeklySocial:        15,    // verified social bonus (1 week)
} as const

/** Scaling LP multiplier. No cap, the more LP you hold the bigger your boost. */
export function computeLpMultiplier(lpBalance: number): number {
  if (lpBalance < COCOA.lpDustThreshold) return 1
  return 1 + lpBalance * COCOA.lpMultiplierFactor
}

// ─── Weekly payday ───────────────────────────────────────────────────────────

export const PAYDAY = {
  emissionWeek1CAT:   15,
  weeklyDecayPercent: 1,
  snapshotDayUTC:     3,   // Wednesday (0 = Sun, 1 = Mon, ...)
  snapshotHourUTC:    17,  // 17:00 UTC
  gracePeriodDays:    3,   // full payout within first 3 days
  postGraceDecayPct:  10,  // each day after grace: -10% on that week's claim only
} as const

// ─── Visual tier rendering (derived from points) ─────────────────────────────

export const TIERS = [
  { id: 'visitor',     label: 'Visitor',     minPoints: 0,    color: 'text-cream-500' },
  { id: 'employee',    label: 'Employee',    minPoints: 10,   color: 'text-cream-300' },
  { id: 'foreman',     label: 'Foreman',     minPoints: 50,   color: 'text-gold' },
  { id: 'partner',     label: 'Partner',     minPoints: 100,  color: 'text-gold' },
  { id: 'chocolatier', label: 'Chocolatier', minPoints: 250,  color: 'text-chili' },
] as const

export type TierId = (typeof TIERS)[number]['id']

// ─── Cocoa Units calculator ──────────────────────────────────────────────────

export interface CocoaInputs {
  standardOgs:    number
  goldenOgs:      number
  limitedPoints:  number
  weeklyBonus:    number
  lpBalance:      number
}

export function computeCocoaPoints(inp: CocoaInputs): number {
  const ogPoints   = inp.standardOgs * COCOA.perOg + inp.goldenOgs * COCOA.perGolden
  const multiplier = computeLpMultiplier(inp.lpBalance)
  return ogPoints * multiplier + inp.limitedPoints + inp.weeklyBonus
}

export function resolveTier(points: number) {
  return [...TIERS].sort((a, b) => b.minPoints - a.minPoints)
    .find(t => points >= t.minPoints) ?? TIERS[0]
}
