import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ASSETS = [
  { ticker: "ASC",  price: 1.2400 },
  { ticker: "DHA9", price: 8.7500 },
  { ticker: "BTI",  price: 5.1000 },
  { ticker: "GBR",  price: 3.6200 },
  { ticker: "CSC",  price: 2.1800 },
  { ticker: "OBK",  price: 0.8800 },
];

const TICKERS = ASSETS.map(a => a.ticker);

async function runTicks(supabase: ReturnType<typeof createClient>, priceMap: Record<string, number>) {
  // Broadcast 30 ticks (one every 2s = 60s total) to cover the full minute
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const channel = supabase.channel("price-feed");
    await channel.subscribe();

    for (const ticker of TICKERS) {
      const last = priceMap[ticker];
      const drift = (Math.random() - 0.499) * last * 0.0008;
      const next = Math.max(0.0001, last + drift);
      priceMap[ticker] = next;

      await channel.send({
        type: "broadcast",
        event: "tick",
        payload: { ticker, price: Number(next.toFixed(8)) },
      });
    }

    await supabase.removeChannel(channel);
  }
}

Deno.cron("price-ticker", "* * * * *", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Seed price map from defaults
  const priceMap: Record<string, number> = {};
  for (const a of ASSETS) priceMap[a.ticker] = a.price;

  // Try to get last known prices from price_ticks table (if it exists)
  try {
    const { data } = await supabase
      .from("price_ticks")
      .select("ticker, price")
      .in("ticker", TICKERS)
      .order("created_at", { ascending: false })
      .limit(TICKERS.length);

    for (const row of data ?? []) {
      if (!priceMap[row.ticker]) priceMap[row.ticker] = Number(row.price);
    }
  } catch { /* table may not exist yet, use defaults */ }

  await runTicks(supabase, priceMap);
});
