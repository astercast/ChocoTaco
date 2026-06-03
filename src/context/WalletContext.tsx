/**
 * WalletContext — full lifecycle: connect → verify → mint → claim
 *
 * Holds the WalletConnect session in memory and exposes mint + claim methods
 * that proxy through to api/mint.ts and api/claims.ts (which use the session
 * to ask the wallet to sign offers).
 */
import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react'
import {
  TIERS, type TierId,
  computeCocoaPoints, resolveTier, computeLpMultiplier,
} from '../constants'
import {
  connectWallet, resolveAddress, disconnectWallet,
  type ChiaSession,
} from '../api/walletconnect'
import { fetchHoldings, type Holdings } from '../api/spacescan'
import { submitClaim } from '../api/claims'
import { mintOg, type MintResult, type MintTraits } from '../api/mint'

export interface WalletState {
  connected:         boolean
  session:           ChiaSession | null
  address:           string | null
  standardOgs:       number
  goldenOgs:         number
  limitedPoints:     number
  lpBalance:         number
  lpMultiplier:      number
  cocoaPoints:       number
  tier:              TierId
  weeklyEstimateCAT: number
  claimableCAT:      number
  weeklyBonus:       number
  verifying:         boolean
  error:             string | null
  pairingUri:        string | null
}

interface WalletCtx extends WalletState {
  connect:           () => Promise<void>
  disconnect:        () => void
  claimRewards:      () => Promise<{ success: boolean; amount?: number; error?: string }>
  mint:              (traits?: MintTraits) => Promise<MintResult>
  dismissPairingUri: () => void
}

const DEFAULT: WalletState = {
  connected:         false,
  session:           null,
  address:           null,
  standardOgs:       0,
  goldenOgs:         0,
  limitedPoints:     0,
  lpBalance:         0,
  lpMultiplier:      1,
  cocoaPoints:       0,
  tier:              'visitor',
  weeklyEstimateCAT: 0,
  claimableCAT:      0,
  weeklyBonus:       0,
  verifying:         false,
  error:             null,
  pairingUri:        null,
}

const WalletContext = createContext<WalletCtx | null>(null)

// Rough estimate — replace with /api/network-stats once Worker is live
const NETWORK_POINTS_ESTIMATE = 12_000

function buildHoldingsState(h: Holdings): Partial<WalletState> {
  const inp = {
    standardOgs:   h.standardOgs,
    goldenOgs:     h.goldenOgs,
    limitedPoints: h.limitedPoints,
    lpBalance:     h.lpBalance,
    weeklyBonus:   0,
  }
  const cocoaPoints  = computeCocoaPoints(inp)
  const lpMultiplier = computeLpMultiplier(h.lpBalance)
  const tier         = resolveTier(cocoaPoints).id
  const share        = cocoaPoints / Math.max(1, NETWORK_POINTS_ESTIMATE + cocoaPoints)
  const weeklyPool   = 15  // Worker will provide real value via /api/snapshot

  return {
    standardOgs:       h.standardOgs,
    goldenOgs:         h.goldenOgs,
    limitedPoints:     h.limitedPoints,
    lpBalance:         h.lpBalance,
    lpMultiplier,
    cocoaPoints,
    tier,
    weeklyEstimateCAT: parseFloat((share * weeklyPool).toFixed(3)),
    claimableCAT:      h.claimableCAT ?? 0,
    weeklyBonus:       0,
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(DEFAULT)

  const connect = useCallback(async () => {
    setState(s => ({ ...s, verifying: true, error: null, pairingUri: null }))
    try {
      const session = await connectWallet(uri => {
        setState(s => ({ ...s, pairingUri: uri }))
      })
      // QR served its purpose, dismiss it
      setState(s => ({ ...s, pairingUri: null }))

      // Resolve bech32 address (placeholder if mock)
      const address  = session.address || await resolveAddress(session)
      const holdings = await fetchHoldings(address)

      setState(s => ({
        ...s,
        ...buildHoldingsState(holdings),
        connected:  true,
        session:    { ...session, address },
        address,
        verifying:  false,
        error:      null,
      }))
    } catch (err) {
      setState(s => ({
        ...s,
        connected:  false,
        verifying:  false,
        pairingUri: null,
        error:      err instanceof Error ? err.message : 'Connection failed',
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (state.session) disconnectWallet(state.session).catch(() => {})
    setState(DEFAULT)
  }, [state.session])

  const claimRewards = useCallback(async () => {
    if (!state.session || state.claimableCAT <= 0) {
      return { success: false, error: 'Nothing to claim' }
    }
    const result = await submitClaim(state.session)
    if (result.success) {
      setState(s => ({ ...s, claimableCAT: 0 }))
    }
    return result
  }, [state.session, state.claimableCAT])

  const mint = useCallback(async (traits: MintTraits = {}) => {
    return mintOg(state.session, traits)
  }, [state.session])

  const dismissPairingUri = useCallback(() => {
    setState(s => ({ ...s, pairingUri: null }))
  }, [])

  return (
    <WalletContext.Provider value={{
      ...state, connect, disconnect, claimRewards, mint, dismissPairingUri,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside WalletProvider')
  return ctx
}

export { TIERS }
