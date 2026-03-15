import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

// Fetch gold price in IDR
async function fetchGoldPriceIDR(usdToIdr) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    if (!closes || closes.length === 0) return null;
    const latestClose = closes[closes.length - 1];
    // Gold: troy oz → grams, USD → IDR
    const pricePerGramIDR = (latestClose / 31.1035) * usdToIdr;
    return { priceIDR: pricePerGramIDR, dailyChangePct: 0 };
  } catch {
    return null;
  }
}

// Common crypto name → CoinGecko ID mapping
const CRYPTO_COINGECKO_MAP = {
  "bitcoin": "bitcoin", "btc": "bitcoin",
  "ethereum": "ethereum", "eth": "ethereum",
  "binance coin": "binancecoin", "bnb": "binancecoin",
  "solana": "solana", "sol": "solana",
  "ripple": "ripple", "xrp": "ripple",
  "cardano": "cardano", "ada": "cardano",
  "dogecoin": "dogecoin", "doge": "dogecoin",
  "polygon": "matic-network", "matic": "matic-network",
  "chainlink": "chainlink", "link": "chainlink",
  "avalanche": "avalanche-2", "avax": "avalanche-2",
  "litecoin": "litecoin", "ltc": "litecoin",
  "polkadot": "polkadot", "dot": "polkadot",
  "shiba inu": "shiba-inu", "shib": "shiba-inu",
  "tron": "tron", "trx": "tron",
  "tether": "tether", "usdt": "tether",
  "usd coin": "usd-coin", "usdc": "usd-coin",
};

// Get current USD → IDR exchange rate
async function getUsdToIdr() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR");
    const data = await res.json();
    return data?.rates?.IDR || 16000; // fallback rate
  } catch {
    return 16000; // fallback
  }
}

// Fetch crypto price in IDR via CoinGecko
async function fetchCryptoPriceIDR(name) {
  const lower = name.toLowerCase().trim();
  const coinId = CRYPTO_COINGECKO_MAP[lower] || lower;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=idr&include_24hr_change=true`
    );
    const data = await res.json();
    if (data[coinId]?.idr) {
      return {
        priceIDR: data[coinId].idr,
        dailyChangePct: data[coinId].idr_24h_change || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Use Finnhub symbol search to find ticker
async function searchStockSymbol(name) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(name)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    if (data.result && data.result.length > 0) {
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
      return { priceUSD: data.c, previousClose: data.pc || data.c };
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch stock price, return in IDR
async function fetchStockPriceIDR(name, usdToIdr) {
  const trimmed = name.trim();
  const looksLikeTicker = trimmed.length <= 6 && trimmed === trimmed.toUpperCase();
  let symbol = looksLikeTicker ? trimmed : await searchStockSymbol(trimmed);
  if (!symbol) return null;

  // Indonesian stock (.JK suffix) — price is already in IDR
  const isIndonesian = symbol.endsWith(".JK") || symbol.endsWith(".JK");
  const quote = await fetchFinnhubQuote(symbol);
  if (!quote) return null;

  const priceIDR = isIndonesian ? quote.priceUSD : quote.priceUSD * usdToIdr;
  const dailyChangePct = quote.previousClose > 0
    ? ((quote.priceUSD - quote.previousClose) / quote.previousClose) * 100
    : 0;

  return { priceIDR, dailyChangePct };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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
      ["saham", "crypto", "emas"].includes(inv.type) &&
      inv.name &&
      inv.quantity != null
    );

    // Fetch exchange rate once for all stocks
    const usdToIdr = await getUsdToIdr();

    const results = { updated: 0, failed: 0, skipped: 0, details: [] };

    for (const inv of toUpdate) {
      let result = null;

      if (inv.type === "crypto") {
        result = await fetchCryptoPriceIDR(inv.name);
      } else if (inv.type === "saham") {
        result = await fetchStockPriceIDR(inv.name, usdToIdr);
      } else if (inv.type === "emas") {
        result = await fetchGoldPriceIDR(usdToIdr);
      }

      if (result && result.priceIDR > 0) {
        const qty = inv.quantity || 1;
        const newCurrentValue = result.priceIDR * qty;

        await base44.asServiceRole.entities.Investment.update(inv.id, {
          current_value: Math.round(newCurrentValue),
          price_per_unit: Math.round(result.priceIDR),
          last_price_update: new Date().toISOString().split("T")[0],
          daily_change_pct: Math.round(result.dailyChangePct * 100) / 100,
        });
        results.updated++;
        results.details.push({
          name: inv.name,
          priceIDR: Math.round(result.priceIDR),
          change: result.dailyChangePct.toFixed(2),
        });
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
      usdToIdr: Math.round(usdToIdr),
      details: results.details,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});