-- ============================================================
-- ORAKZAI PROPERTIES — Complete Supabase SQL Setup
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ── 1. price_ticks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_ticks (
  id         BIGSERIAL PRIMARY KEY,
  ticker     TEXT          NOT NULL,
  price      NUMERIC(20,8) NOT NULL,
  created_at TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_ticks_ticker_time
  ON price_ticks(ticker, created_at DESC);

ALTER TABLE price_ticks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON price_ticks FOR SELECT USING (true);

CREATE POLICY "anon insert"
  ON price_ticks FOR INSERT WITH CHECK (true);

-- Enable Realtime on price_ticks (broadcasts INSERTs to all subscribers)
ALTER PUBLICATION supabase_realtime ADD TABLE price_ticks;

-- ── 2. trades ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id         BIGSERIAL PRIMARY KEY,
  ticker     TEXT          NOT NULL,
  side       TEXT          NOT NULL CHECK (side IN ('BUY','SELL')),
  price      NUMERIC(20,8) NOT NULL,
  amount     NUMERIC(20,8) NOT NULL,
  total_usdt NUMERIC(20,8) NOT NULL,
  user_id    TEXT,
  created_at TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trades_ticker_time
  ON trades(ticker, created_at DESC);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON trades FOR SELECT USING (true);

CREATE POLICY "anon insert"
  ON trades FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE trades;

-- ── 3. Trigger: price discovery on every trade ──────────────
-- When a trade is inserted, a new price tick is calculated
-- based on trade direction and size, then inserted into price_ticks.
-- This drives real price discovery from actual buy/sell activity.

CREATE OR REPLACE FUNCTION fn_price_after_trade()
RETURNS TRIGGER AS $$
DECLARE
  last_price NUMERIC;
  impact     NUMERIC;
  new_price  NUMERIC;
BEGIN
  -- Get the most recent price for this ticker
  SELECT price INTO last_price
  FROM price_ticks
  WHERE ticker = NEW.ticker
  ORDER BY created_at DESC
  LIMIT 1;

  -- Fall back to trade price if no history yet
  IF last_price IS NULL THEN
    last_price := NEW.price;
  END IF;

  -- Price impact: 0.01% per 100 USDT (buy → up, sell → down)
  impact := (NEW.total_usdt / 100.0) * 0.0001;

  IF NEW.side = 'BUY' THEN
    new_price := last_price * (1.0 + impact);
  ELSE
    new_price := last_price * (1.0 - impact);
  END IF;

  -- Insert the new price tick (Realtime broadcasts this to all clients)
  INSERT INTO price_ticks (ticker, price)
  VALUES (NEW.ticker, GREATEST(0.0001, new_price));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_price_after_trade ON trades;
CREATE TRIGGER trg_price_after_trade
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION fn_price_after_trade();

-- ── 4. Seed initial prices ──────────────────────────────────
INSERT INTO price_ticks (ticker, price) VALUES
  ('ASC',  1.2400),
  ('DHA9', 8.7500),
  ('BTI',  5.1000),
  ('GBR',  3.6200),
  ('CSC',  2.1800),
  ('OBK',  0.8800);

-- ── Done ─────────────────────────────────────────────────────
-- After running this:
-- 1. Deploy supabase/functions/price-ticker/ via Supabase CLI
--    (supabase functions deploy price-ticker)
-- 2. Vercel will auto-deploy from GitHub push
