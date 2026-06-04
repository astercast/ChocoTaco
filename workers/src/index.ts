/**
 * ChocoTaco Worker — main router
 *
 * Endpoints:
 *   GET  /api/snapshot/:address     → claimable + estimate
 *   POST /api/claim                 → build CHOCO offer for user to sign
 *   GET  /api/network-stats         → vault remaining, mint count, etc.
 *   POST /api/social/verify         → tweet verification → +15 weekly bonus
 *   POST /api/mint/reserve          → (mode B only) allocate offer files for OG mint
 *
 * Cron (Sun 17:00 UTC):
 *   computeWeeklySnapshot()         → reads chain, writes snapshots table
 */

import { handleSnapshot, handleNetworkStats, handleHistory } from './routes/snapshot'
import { handleClaim }                         from './routes/claim'
import { handleSocialVerify }                  from './routes/social'
import { handleMint, handleMintReserve }       from './routes/mint'
import { computeWeeklySnapshot }               from './snapshot'

export interface Env {
  DB:                    D1Database
  SPACESCAN_BASE:        string
  MINTGARDEN_BASE:       string
  CHOCO_ASSET_ID:        string
  LP_ASSET_ID:           string
  OG_COLLECTION_ID:      string
  LIMITED_COLLECTION_ID: string
  LAUNCH_WEEK_ISO:       string
  TREASURY_ADDRESS:      string
  ALLOWED_ORIGIN:        string
  TREASURY_MNEMONIC?:    string
  SPACESCAN_KEY?:        string
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    const cors = corsHeaders(env)

    // Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    try {
      // Routes
      if (url.pathname.startsWith('/api/snapshot/') && req.method === 'GET') {
        const address = url.pathname.replace('/api/snapshot/', '')
        return json(await handleSnapshot(env, address), cors)
      }
      if (url.pathname.startsWith('/api/history/') && req.method === 'GET') {
        const address = url.pathname.replace('/api/history/', '')
        return json(await handleHistory(env, address), cors)
      }
      if (url.pathname === '/api/network-stats' && req.method === 'GET') {
        return json(await handleNetworkStats(env), cors)
      }
      if (url.pathname === '/api/claim' && req.method === 'POST') {
        const body = await req.json() as { address: string }
        return json(await handleClaim(env, body.address), cors)
      }
      if (url.pathname === '/api/social/verify' && req.method === 'POST') {
        const body = await req.json() as { address: string; tweetUrl: string }
        return json(await handleSocialVerify(env, body.address, body.tweetUrl), cors)
      }
      if (url.pathname === '/api/mint' && req.method === 'POST') {
        const body = await req.json() as { address: string; traits?: Record<string, number> }
        return json(await handleMint(env, body), cors)
      }
      if (url.pathname === '/api/mint/reserve' && req.method === 'POST') {
        const body = await req.json() as { address: string; quantity: number }
        return json(await handleMintReserve(env, body.address, body.quantity), cors)
      }
      if (url.pathname === '/' || url.pathname === '/health') {
        return json({ ok: true, service: 'chocotaco-api' }, cors)
      }

      return json({ error: 'not_found' }, cors, 404)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'internal_error'
      return json({ success: false, error: msg }, cors, 500)
    }
  },

  // Cron — Sunday 17:00 UTC
  async scheduled(_ev: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(computeWeeklySnapshot(env))
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin':  env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data: unknown, cors: HeadersInit, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
