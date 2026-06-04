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
  goldenTickets:    50,   // 50 random slot numbers (1-500) get Golden:true stamped at mint time
  liquiditySeedXCH: 250,  // 100% of mint proceeds → TibetSwap (500 * 0.5)
} as const

// ─── Reward economy (Cocoa Units) ────────────────────────────────────────────

export const COCOA = {
  perOg:           10,    // standard OG NFT
  perGolden:       30,    // golden ticket OG NFT (3× baked in)
  perLimitedMin:   15,    // future limited edition NFTs
  perLimitedMax:   40,
  lpDustThreshold: 0.001, // minimum LP CAT to qualify for any boost
  weeklySocial:    15,    // verified social bonus (1 week)
} as const

/**
 * LP multiplier: square-root curve. Unbounded but fair.
 *   multiplier = 1 + sqrt(lpBalance)
 *
 *   0 LP    → 1×       1 LP    → 2×       9 LP    → 4×
 *   0.25 LP → 1.5×     4 LP    → 3×       25 LP   → 6×
 *                                          100 LP  → 11×
 *                                          1000 LP → ~32×
 *
 * Diminishing returns prevent a single whale from dominating the pool, while
 * still meaningfully rewarding deep liquidity. No hard cap.
 */
export function computeLpMultiplier(lpBalance: number): number {
  if (lpBalance < COCOA.lpDustThreshold) return 1
  return 1 + Math.sqrt(lpBalance)
}

// ─── Weekly payday + distribution schedule ───────────────────────────────────
//
// Total vault: 1011 $🍫🌮, distributed over exactly 3 years (156 weeks).
// Annual halvings reward early participation.
//
//   Year 1 (weeks   1-52): 11.11/week  ·  577.72 total  ·  57.1% of vault
//   Year 2 (weeks  53-104): 5.55/week  ·  288.86 total  ·  28.6% of vault
//   Year 3 (weeks 105-156): 2.78/week  ·  144.43 total  ·  14.3% of vault
//
// Derivation: 52E + 26E + 13E = 91E = 1011  →  E = 11.1099 ≈ 11.11

export const PAYDAY = {
  vaultTotalCAT:     1011,
  totalWeeks:        156,
  year1WeeklyCAT:    11.11,
  year2WeeklyCAT:    5.55,
  year3WeeklyCAT:    2.78,
  year1TotalCAT:     577.72,
  year2TotalCAT:     288.86,
  year3TotalCAT:     144.43,
  snapshotDayUTC:    3,    // Wednesday (0 = Sun)
  snapshotHourUTC:   17,
  gracePeriodDays:   3,
  postGraceDecayPct: 10,
  // Set this once the mint actually opens - must be a Wednesday 17:00 UTC
  // formatted as ISO week 'YYYY-Www'. Worker reads it; client uses it for
  // countdowns and the distribution chart.
  launchWeekIso:     '2026-W01',
} as const

/**
 * Weekly emission for a given week index (0 = launch week).
 * Returns 0 after week 156 (distribution ended).
 */
export function weeklyEmission(weekIndex: number): number {
  if (weekIndex < 0)   return 0
  if (weekIndex < 52)  return PAYDAY.year1WeeklyCAT
  if (weekIndex < 104) return PAYDAY.year2WeeklyCAT
  if (weekIndex < 156) return PAYDAY.year3WeeklyCAT
  return 0
}

/** Compute how many weeks since launchWeekIso */
export function weekIndexFromIso(weekIso: string, launchIso: string = PAYDAY.launchWeekIso): number {
  const parse = (s: string) => {
    const [y, w] = s.split('-W').map(Number)
    return y * 52 + w
  }
  return parse(weekIso) - parse(launchIso)
}

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
