/**
 * WalletContext — connect / verify / claim (V2: Cocoa Units + CHOCO CAT payday)
 *
 * Verification reads (no custody):
 *   1. OG NFT count        — by collection (filter golden flag via metadata)
 *   2. Limited Edition NFTs — sum of per-NFT point values
 *   3. CHOCO/XCH LP CAT     — boolean: above dust threshold = 3× multiplier
 *
 * Claim (weekly): backend Worker snapshots Sunday 17:00 UTC, computes
 *   (your points / total network points) × weekly emission, then issues a
 *   CHOCO CAT offer the user accepts.
 */
import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react'
import {
  TIERS, type TierId,
  computeCocoaPoints, resolveTier,
} from '../constants'
import { connectWallet } from '../api/walletconnect'
import { fetchHoldings, type Holdings } from '../api/spacescan'
import { submitClaim } from '../api/claims'

export interface WalletState {
  connected:        boolean
  address:          string | null
  // Raw on-chain holdings
  standardOgs:      number
  goldenOgs:        number
  limitedPoints:    number
  hasLP:            boolean
  // Derived
  cocoaPoints:      number
  tier:             TierId
  weeklyEstimateCAT: number  // estimated weekly CHOCO payout
  claimableCAT:     number   // currently claimable from last snapshot
  // Bonuses
  weeklyBonus:      number   // 0 or COCOA.weeklySocial
  // Flow
  verifying:        boolean
  error:            string | null
}

interface WalletCtx extends WalletState {
  connect:      () => Promise<void>
  disconnect:   () => void
  claimRewards: () => Promise<boolean>
}

const DEFAULT: WalletState = {
  connected:         false,
  address:           null,
  standardOgs:       0,
  goldenOgs:         0,
  limitedPoints:     0,
  hasLP:             false,
  cocoaPoints:       0,
  tier:              'visitor',
  weeklyEstimateCAT: 0,
  claimableCAT:      0,
  weeklyBonus:       0,
  verifying:         false,
  error:             null,
}

const WalletContext = createContext<WalletCtx | null>(null)

// Network-wide points estimate — replace with real sum from backend
const NETWORK_POINTS_ESTIMATE = 12_000

function buildState(address: string, h: Holdings): Partial<WalletState> {
  const inp = {
    standardOgs:   h.standardOgs,
    goldenOgs:     h.goldenOgs,
    limitedPoints: h.limitedPoints,
    hasLP:         h.hasLP,
    weeklyBonus:   0, // backend reports if user has claimed weekly bonus
  }
  const cocoaPoints = computeCocoaPoints(inp)
  const tier        = resolveTier(cocoaPoints).id
  const share       = cocoaPoints / Math.max(1, NETWORK_POINTS_ESTIMATE + cocoaPoints)
  const weeklyPool  = 15 // CHOCO CATs (week 1 emission; backend supplies real value)

  return {
    connected:         true,
    address,
    standardOgs:       h.standardOgs,
    goldenOgs:         h.goldenOgs,
    limitedPoints:     h.limitedPoints,
    hasLP:             h.hasLP,
    cocoaPoints,
    tier,
    weeklyEstimateCAT: parseFloat((share * weeklyPool).toFixed(3)),
    claimableCAT:      h.claimableCAT ?? 0,
    weeklyBonus:       0,
    verifying:         false,
    error:             null,
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(DEFAULT)

  const connect = useCallback(async () => {
    setState(s => ({ ...s, verifying: true, error: null }))
    try {
      const { address } = await connectWallet()
      const holdings    = await fetchHoldings(address)
      setState(s => ({ ...s, ...buildState(address, holdings) }))
    } catch (err) {
      setState(s => ({
        ...s,
        verifying: false,
        connected: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      }))
    }
  }, [])

  const disconnect = useCallback(() => setState(DEFAULT), [])

  const claimRewards = useCallback(async (): Promise<boolean> => {
    if (!state.connected || !state.address || state.claimableCAT <= 0) return false
    const ok = await submitClaim(state.address, state.claimableCAT)
    if (!ok) return false
    setState(s => ({ ...s, claimableCAT: 0 }))
    return true
  }, [state.connected, state.address, state.claimableCAT])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, claimRewards }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside WalletProvider')
  return ctx
}

// Re-export tier list shape for sections
export { TIERS }
