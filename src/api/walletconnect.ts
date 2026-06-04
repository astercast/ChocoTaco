/**
 * Chia WalletConnect v2 - production implementation
 *
 * Singleton client lifecycle:
 *   1. initClient()           → boots SignClient once per page load
 *   2. connectWallet()        → opens QR pairing, returns session + address
 *   3. requestRpc()           → makes any Chia RPC call on an active session
 *   4. disconnectWallet()     → cleanly tears down the session
 *
 * Wallets supported: Sage, Chia Reference Wallet (both v2-compatible).
 */

import SignClient from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'

export interface ChiaSession {
  topic:       string
  fingerprint: number
  address:     string
  chainId:     string
}

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
export const CHAIN_ID = (import.meta.env.VITE_CHAIN_ID ?? 'chia:mainnet') as string

export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [
      'chia_getWalletAddresses',
      'chia_getCurrentAddress',
      'chia_getCATAssetInfo',
      'chia_getNFTs',
      'chia_sendTransaction',
      'chia_signCoinSpends',
      'chia_takeOffer',
      'chia_createOfferForIds',
    ],
    chains: [CHAIN_ID],
    events: ['chainChanged', 'accountsChanged'],
  },
}

// ─── Singleton client + session ──────────────────────────────────────────────

let client:        SignClient | null = null
let activeSession: SessionTypes.Struct | null = null

async function initClient(): Promise<SignClient> {
  if (client) return client
  if (!PROJECT_ID) throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID env var')

  client = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name:        'ChocoTaco',
      description: 'The sweetest memecoin on Chia',
      url:         typeof window !== 'undefined' ? window.location.origin : 'https://chocotaco.xyz',
      icons:       [typeof window !== 'undefined' ? `${window.location.origin}/taco.svg` : ''],
    },
  })

  // Auto-clear session if wallet disconnects
  client.on('session_delete', () => { activeSession = null })
  client.on('session_expire', () => { activeSession = null })

  // Reuse existing session if one exists from a previous page load
  const existing = client.session.getAll()
  if (existing.length > 0) {
    activeSession = existing[existing.length - 1]
  }

  return client
}

// ─── Connect ─────────────────────────────────────────────────────────────────

/**
 * Returns either an existing session or opens the QR pairing modal.
 * `onUri` is called with the pairing URI so the UI can render a QR code.
 */
export async function connectWallet(onUri?: (uri: string) => void): Promise<ChiaSession> {
  if (import.meta.env.DEV && !PROJECT_ID) {
    return mockSession()
  }

  const c = await initClient()

  // If a session already exists, reuse it
  if (activeSession) return sessionToChia(activeSession)

  const { uri, approval } = await c.connect({ requiredNamespaces: REQUIRED_NAMESPACES })
  if (uri && onUri) onUri(uri)

  const session = await approval()
  activeSession = session
  return sessionToChia(session)
}

function sessionToChia(session: SessionTypes.Struct): ChiaSession {
  const accounts    = Object.values(session.namespaces).flatMap(ns => ns.accounts)
  const fingerprint = Number(accounts[0]?.split(':')[2] ?? 0)
  // Address is resolved on first request - set placeholder until then
  return { topic: session.topic, fingerprint, address: '', chainId: CHAIN_ID }
}

/**
 * Get the wallet's xch1… bech32 address (uses chia_getCurrentAddress RPC).
 */
export async function resolveAddress(session: ChiaSession): Promise<string> {
  if (import.meta.env.DEV && !PROJECT_ID) return 'xch1demo000000000000000000000000000000000000000000000000000000000'

  const c = await initClient()
  const res = await c.request<{ address: string }>({
    topic:   session.topic,
    chainId: CHAIN_ID,
    request: {
      method: 'chia_getCurrentAddress',
      params: { fingerprint: session.fingerprint },
    },
  })
  return res.address
}

// ─── RPC passthrough ─────────────────────────────────────────────────────────

export async function requestRpc<T = unknown>(
  session: ChiaSession,
  method:  string,
  params:  Record<string, unknown>,
): Promise<T> {
  const c = await initClient()
  return c.request<T>({
    topic:   session.topic,
    chainId: CHAIN_ID,
    request: { method, params },
  })
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export async function disconnectWallet(session: ChiaSession): Promise<void> {
  if (!client) return
  try {
    await client.disconnect({
      topic:  session.topic,
      reason: { code: 6000, message: 'User disconnected' },
    })
  } catch (err) {
    console.warn('[walletconnect] disconnect error', err)
  }
  activeSession = null
}

// ─── Dev mock (only when env not set) ────────────────────────────────────────

async function mockSession(): Promise<ChiaSession> {
  await new Promise(r => setTimeout(r, 800))
  return {
    topic:       'mock-topic',
    fingerprint: 1234567890,
    address:     'xch1demo000000000000000000000000000000000000000000000000000000000',
    chainId:     'chia:mainnet',
  }
}
