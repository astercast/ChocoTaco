-- ChocoTaco D1 schema
-- Run with: wrangler d1 execute chocotaco --file=./schema.sql

CREATE TABLE IF NOT EXISTS snapshots (
  week_iso       TEXT NOT NULL,           -- ISO week, e.g. "2026-W23"
  address        TEXT NOT NULL,
  points         INTEGER NOT NULL,
  claimable_cat  REAL    NOT NULL,
  claimed_at     INTEGER,                 -- unix epoch ms (NULL = unclaimed)
  PRIMARY KEY (week_iso, address)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_addr ON snapshots (address);
CREATE INDEX IF NOT EXISTS idx_snapshots_unclaimed ON snapshots (address, claimed_at);

CREATE TABLE IF NOT EXISTS social_bonuses (
  week_iso  TEXT NOT NULL,
  address   TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (week_iso, address)
);

CREATE TABLE IF NOT EXISTS network_stats (
  week_iso          TEXT PRIMARY KEY,
  total_points      INTEGER NOT NULL,
  weekly_emission   REAL    NOT NULL,
  vault_remaining   REAL    NOT NULL,
  computed_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS known_holders (
  address      TEXT PRIMARY KEY,
  first_seen   INTEGER NOT NULL,
  last_active  INTEGER NOT NULL
);

-- Golden slot reservations: 50 random mint numbers (1..500) chosen at deploy
-- time via verifiable randomness. When a mint hits one of these numbers, the
-- signer stamps Golden:true into the metadata.
CREATE TABLE IF NOT EXISTS golden_slots (
  slot_number  INTEGER PRIMARY KEY,
  seed_hash    TEXT NOT NULL,       -- SHA256 of public seed for verifiability
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mint_reservations (
  offer_hash    TEXT PRIMARY KEY,
  address       TEXT NOT NULL,
  offer         TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  claimed_at    INTEGER
);
