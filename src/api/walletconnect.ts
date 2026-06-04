/**
 * Chia WalletConnect v2 (CHIP-0002) — aligned with Caster-101 / bow-app patterns.
 *
 *   initClient()        → SignClient + relay + stale session purge
 *   tryRestoreSession() → reuse active session on page load
 *   connectWallet()     → QR pairing
 *   resolveAddress()    → session accounts, then chia_getAddress fallbacks
 *   requestRpc()        → chia_takeOffer, NFT reads, etc.
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
const RELAY_URL = 'wss://relay.walletconnect.org'

const CHIA_METHODS_REQUIRED = [
  'chia_getAddress',
  'chia_getWalletAddresses',
  'chia_getCurrentAddress',
  'chia_getNFTs',
  'chia_takeOffer',
  'chip0002_getPublicKeys',
] as const

const CHIA_METHODS_OPTIONAL = [
  'chip0002_getAssetCoins',
  'chip0002_getAssetBalance',
  'chip0002_getNFTs',
  'chia_sendTransaction',
  'chia_signCoinSpends',
  'chia_createOfferForIds',
  'chia_getCATAssetInfo',
  'chia_signMessageByAddress',
] as const

export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [...CHIA_METHODS_REQUIRED],
    chains:  [CHAIN_ID],
    events:  ['chainChanged', 'accountsChanged'],
  },
}

export const OPTIONAL_NAMESPACES = {
  chia: {
    methods: [...CHIA_METHODS_OPTIONAL],
    chains:  [CHAIN_ID, 'chia:testnet11'],
    events:  [],
  },
}

let client:        SignClient | null = null
let activeSession: SessionTypes.Struct | null = null
let initPromise:   Promise<SignClient> | null = null

export function wcErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const o = err as { message?: string; code?: number }
    if (typeof o.message === 'string' && o.message) return o.message
    try { return JSON.stringify(err) } catch { /* fall through */ }
  }
  return String(err)
}

function isUserRejected(err: unknown): boolean {
  const msg = wcErrorMessage(err).toLowerCase()
  return msg.includes('rejected') || msg.includes('cancelled') || msg.includes('user disconn')
}

function parseAccount(account: string): { chainId: string; fingerprint: number; address: string } {
  const parts = account.split(':')
  const chainId = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : CHAIN_ID
  const third = parts[2] ?? ''
  if (/^xch1|^txch1/i.test(third)) {
    return { chainId, fingerprint: 0, address: third }
  }
  const fp = Number(third)
  return { chainId, fingerprint: Number.isFinite(fp) ? fp : 0, address: '' }
}

function addressFromSession(session: SessionTypes.Struct): string | null {
  const accounts = session.namespaces?.chia?.accounts ?? []
  for (const acc of accounts) {
    const { address } = parseAccount(acc)
    if (address) return address
  }
  return null
}

function sessionChainId(session: SessionTypes.Struct): string {
  const chains = session.namespaces?.chia?.chains
  return chains?.[0] ?? CHAIN_ID
}

function sessionToChia(session: SessionTypes.Struct): ChiaSession {
  const accounts = session.namespaces?.chia?.accounts ?? []
  const first = accounts[0] ?? ''
  const parsed = first ? parseAccount(first) : { chainId: CHAIN_ID, fingerprint: 0, address: '' }
  const address = parsed.address || addressFromSession(session) || ''

  return {
    topic:       session.topic,
    fingerprint: parsed.fingerprint,
    address,
    chainId:     parsed.chainId || sessionChainId(session),
  }
}

async function purgeStaleSessions(c: SignClient): Promise<void> {
  const now = Date.now() / 1000
  for (const s of c.session.getAll()) {
    if (s.expiry <= now) {
      await c.session.delete(s.topic, { code: 6000, message: 'Session expired' }).catch(() => null)
    }
  }
}

export async function initClient(): Promise<SignClient> {
  if (client) return client
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (!PROJECT_ID) throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID env var')

    const c = await SignClient.init({
      projectId: PROJECT_ID,
      relayUrl:  RELAY_URL,
      metadata: {
        name:        'ChocoTaco',
        description: 'The sweetest memecoin on Chia',
        url:         typeof window !== 'undefined' ? window.location.origin : 'https://chocotaco.xyz',
        icons:       [typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : ''],
      },
    })

    await purgeStaleSessions(c)

    const now = Date.now() / 1000
    const active = c.session.getAll().filter(s => s.expiry > now)
    if (active.length > 0) {
      activeSession = active[active.length - 1]
    }

    c.on('session_delete', () => { activeSession = null })
    c.on('session_expire', () => { activeSession = null })

    client = c
    return c
  })()

  try {
    return await initPromise
  } catch (e) {
    initPromise = null
    throw e
  }
}

/** Reuse an existing WC session after refresh (Caster-101 pattern). */
export async function tryRestoreSession(): Promise<ChiaSession | null> {
  if (!PROJECT_ID) {
    if (import.meta.env.DEV) return mockSession()
    return null
  }

  await initClient()
  if (!activeSession) return null

  const base = sessionToChia(activeSession)
  if (base.address) return base

  try {
    const address = await resolveAddress(base)
    return { ...base, address }
  } catch {
    activeSession = null
    return null
  }
}

export async function connectWallet(onUri?: (uri: string) => void): Promise<ChiaSession> {
  if (!PROJECT_ID) {
    if (import.meta.env.DEV) return mockSession()
    throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID env var')
  }

  const c = await initClient()

  if (activeSession) {
    const existing = sessionToChia(activeSession)
    if (existing.address) return existing
    const address = await resolveAddress(existing)
    return { ...existing, address }
  }

  const { uri, approval } = await c.connect({
    requiredNamespaces: REQUIRED_NAMESPACES,
    optionalNamespaces: OPTIONAL_NAMESPACES,
  })

  if (uri && onUri) onUri(uri)

  const session = await approval()
  activeSession = session
  const base = sessionToChia(session)
  const address = base.address || await resolveAddress(base)
  return { ...base, address }
}

export async function resolveAddress(session: ChiaSession): Promise<string> {
  if (session.address) return session.address

  if (!PROJECT_ID && import.meta.env.DEV) {
    return 'xch1demo000000000000000000000000000000000000000000000000000000000'
  }

  const c = await initClient()
  const full = activeSession?.topic === session.topic ? activeSession : null
  const chainId = full ? sessionChainId(full) : session.chainId || CHAIN_ID

  if (full) {
    const fromNs = addressFromSession(full)
    if (fromNs) return fromNs
  }

  // Caster-101 mint: chia_getAddress with no params
  try {
    const res = await c.request<{ address?: string } | string>({
      topic:   session.topic,
      chainId,
      request: { method: 'chia_getAddress', params: {} },
    })
    const addr = typeof res === 'string' ? res : res?.address
    if (addr) return addr
  } catch { /* try next */ }

  if (session.fingerprint) {
    try {
      const res = await c.request<{ address: string }>({
        topic:   session.topic,
        chainId,
        request: {
          method: 'chia_getCurrentAddress',
          params: { fingerprint: session.fingerprint },
        },
      })
      if (res.address) return res.address
    } catch { /* try next */ }

    try {
      const res = await c.request<{ addresses: string[] }>({
        topic:   session.topic,
        chainId,
        request: {
          method: 'chia_getWalletAddresses',
          params: { fingerprint: session.fingerprint },
        },
      })
      const addr = res.addresses?.find(a => /^xch1|^txch1/i.test(a))
      if (addr) return addr
    } catch { /* try next */ }
  }

  throw new Error('Could not resolve wallet address from Sage. Reconnect and approve all permissions.')
}

export async function requestRpc<T = unknown>(
  session: ChiaSession,
  method:  string,
  params:  Record<string, unknown>,
): Promise<T> {
  const c = await initClient()
  const chainId = session.chainId || CHAIN_ID
  return c.request<T>({
    topic:   session.topic,
    chainId,
    request: { method, params },
  })
}

export async function disconnectWallet(session: ChiaSession): Promise<void> {
  if (!client) return
  try {
    await client.disconnect({
      topic:  session.topic,
      reason: { code: 6000, message: 'User disconnected' },
    })
  } catch (err) {
    console.warn('[walletconnect] disconnect error', wcErrorMessage(err))
  }
  activeSession = null
}

export { isUserRejected }

async function mockSession(): Promise<ChiaSession> {
  await new Promise(r => setTimeout(r, 600))
  return {
    topic:       'mock-topic',
    fingerprint: 1234567890,
    address:     'xch1demo000000000000000000000000000000000000000000000000000000000',
    chainId:     CHAIN_ID,
  }
}
