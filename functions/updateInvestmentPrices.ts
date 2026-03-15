import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

// Common crypto name → symbol mapping
const CRYPTO_NAME_MAP = {
  "bitcoin": "BTC", "btc": "BTC",
  "ethereum": "ETH", "eth": "ETH",
  "binance coin": "BNB", "bnb": "BNB",
  "solana": "SOL", "sol": "SOL",
  "ripple": "XRP", "xrp": "XRP",
  "cardano": "ADA", "ada": "ADA",
  "dogecoin": "DOGE", "doge": "DOGE",
  "polygon": "MATIC", "matic": "MATIC",
  "chainlink": "LINK", "link": "LINK",
  "avalanche": "AVAX", "avax": "AVAX",
  "litecoin": "LTC", "ltc": "LTC",
  "polkadot": "DOT", "dot": "DOT",
  "shiba inu": "SHIB", "shib": "SHIB",
  "tron": "TRX", "trx": "TRX",
};

// Use Finnhub symbol search to find ticker for a given name
async function searchStockSymbol(name) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(name)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    if (data.result && data.result.length > 0) {
      // Prefer exact symbol match, otherwise first result
      const exact = data.result.find(r =>
        r.symbol?.toUpperCase() === name.toUpperCase() ||
        r.displaySymbol?.toUpperCase() === name.toUpperCase()
      );
      return (exact || data.result[0]).symbol;
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchFinnhubQuote(symbol) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    if (data.c && data.c > 0) {
      return { price: data.c, previousClose: data.pc || data.c };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCryptoPrice(nameCleaned) {
  // Resolve symbol from name map or treat as-is
  const lower = nameCleaned.toLowerCase().trim();
  const symbol = CRYPTO_NAME_MAP[lower] || nameCleaned.toUpperCase();
  const finnhubSymbol = `BINANCE:${symbol}USDT`;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    if (data.c && data.c > 0) {
      return { price: data.c, previousClose: data.pc || data.c, symbol };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchStockPrice(name) {
  // If it looks like a ticker already (short, all caps), use directly
  const trimmed = name.trim();
  const looksLikeTicker = trimmed.length <= 6 && trimmed === trimmed.toUpperCase();
  
  let symbol = looksLikeTicker ? trimmed : await searchStockSymbol(trimmed);
  if (!symbol) return null;

  return await fetchFinnhubQuote(symbol);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated users and scheduled automation (service role)
    let targetEmail = null;
    try {
      const user = await base44.auth.me();
      if (user) targetEmail = user.email;
    } catch {
      // scheduled/service role call — process all users
    }

    let investments;
    if (targetEmail) {
      investments = await base44.asServiceRole.entities.Investment.filter(
        { created_by: targetEmail },
        "-created_date",
        200
      );
    } else {
      investments = await base44.asServiceRole.entities.Investment.list("-created_date", 500);
    }

    // Only update types that have live market prices
    const toUpdate = investments.filter(inv =>
      ["saham", "crypto"].includes(inv.type) &&
      inv.name &&
      (inv.quantity > 0 || inv.quantity != null)
    );

    const results = { updated: 0, failed: 0, skipped: 0, details: [] };

    for (const inv of toUpdate) {
      let priceData = null;

      if (inv.type === "saham") {
        priceData = await fetchStockPrice(inv.name);
      } else if (inv.type === "crypto") {
        priceData = await fetchCryptoPrice(inv.name);
      }

      if (priceData && priceData.price > 0) {
        const qty = inv.quantity || 1;
        const newCurrentValue = priceData.price * qty;
        const dailyChangePct = priceData.previousClose > 0
          ? ((priceData.price - priceData.previousClose) / priceData.previousClose) * 100
          : 0;

        await base44.asServiceRole.entities.Investment.update(inv.id, {
          current_value: Math.round(newCurrentValue * 100) / 100,
          price_per_unit: Math.round(priceData.price * 100) / 100,
          last_price_update: new Date().toISOString().split("T")[0],
          daily_change_pct: Math.round(dailyChangePct * 100) / 100,
        });
        results.updated++;
        results.details.push({ name: inv.name, price: priceData.price, change: dailyChangePct.toFixed(2) });
      } else {
        results.failed++;
        results.details.push({ name: inv.name, error: "price not found" });
      }
    }

    results.skipped = investments.length - toUpdate.length;

    return Response.json({
      success: true,
      total: investments.length,
      updated: results.updated,
      failed: results.failed,
      skipped: results.skipped,
      details: results.details,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});