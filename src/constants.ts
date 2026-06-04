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
// Token supply: 2022 $🍫🌮 total. Holder vault = 1011 (exactly half), over 3 years (156 weeks).
// Annual halvings reward early participation.
//
//   Year 1 (weeks   1-52): 11.11/week  ·  577.72 total  ·  57.1% of vault
//   Year 2 (weeks  53-104): 5.55/week  ·  288.86 total  ·  28.6% of vault
//   Year 3 (weeks 105-156): 2.78/week  ·  144.43 total  ·  14.3% of vault
//
// Derivation: 52E + 26E + 13E = 91E = 1011  →  E = 11.1099 ≈ 11.11

// Precise emission math: total = 52E + 26E + 13E = 91E = 1011 → E = 1011/91
// Using exact fractions guarantees cumulative distribution = 1011 with zero drift.
const E = 1011 / 91   // 11.1098901098...

export const PAYDAY = {
  totalSupplyCAT:    2022,
  vaultTotalCAT:     1011,   // 50% of total supply, weekly holder distribution
  totalWeeks:        156,
  year1WeeklyCAT:    E,           // 11.1099 (display as 11.11)
  year2WeeklyCAT:    E / 2,       //  5.5549 (display as  5.55)
  year3WeeklyCAT:    E / 4,       //  2.7775 (display as  2.78)
  year1TotalCAT:     E * 52,      // 577.7143
  year2TotalCAT:     E / 2 * 52,  // 288.8571
  year3TotalCAT:     E / 4 * 52,  // 144.4286
  // Sum: 577.71 + 288.86 + 144.43 = 1011.00 exact
  snapshotDayUTC:    3,    // Wednesday (0 = Sun)
  snapshotHourUTC:   17,
  gracePeriodDays:   3,
  postGraceDecayPct: 10,
  // Set this once the mint actually opens - must be a Wednesday 17:00 UTC
  // formatted as ISO week 'YYYY-Www'. Worker reads it; client uses it for
  // countdowns and the distribution chart.
  launchWeekIso:     '2026-W01',
  // Flip to true once the mint closes and weekly snapshots begin.
  // While false, the site shows pre-launch state (no countdowns, 0 distributed,
  // all 3 years marked upcoming, "claims open after mint" messaging).
  distributionLaunched: false as boolean,
} as const

/**
 * Weekly emission for a given week index (0 = launch week).
 * Returns 0 after week 156 (distribution ended).
 *
 * Math guarantees:
 *   Σ(week 0..51)   = E × 52  = 577.7143  (57.14% of vault)
 *   Σ(week 52..103) = E/2 × 52 = 288.8571  (28.57% of vault)
 *   Σ(week 104..155)= E/4 × 52 = 144.4286  (14.29% of vault)
 *   Total = 1011.0 exact
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
