-- price_ticks: stores real-time price updates for tokenized property assets
-- Used as a persistent price ledger; Supabase Realtime broadcasts inserts live.

CREATE TABLE IF NOT EXISTS price_ticks (
  id          BIGSERIAL PRIMARY KEY,
  ticker      TEXT        NOT NULL,
  price       NUMERIC(20,8) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_ticks_ticker_time
  ON price_ticks(ticker, created_at DESC);

ALTER TABLE price_ticks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON price_ticks FOR SELECT USING (true);

CREATE POLICY "service insert"
  ON price_ticks FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE price_ticks;

-- Seed initial prices
INSERT INTO price_ticks (ticker, price) VALUES
  ('ASC',  1.2400),
  ('DHA9', 8.7500),
  ('BTI',  5.1000),
  ('GBR',  3.6200),
  ('CSC',  2.1800),
  ('OBK',  0.8800);
