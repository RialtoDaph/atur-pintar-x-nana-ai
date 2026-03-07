import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Get USD to IDR rate
async function getUsdToIdr() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data?.rates?.IDR || 16000;
  } catch (_) {
    return 16000;
  }
}

// Get historical stock price via Finnhub candles
async function getHistoricalStockPrice(symbol, dateStr) {
  try {
    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) return null;

    const date = new Date(dateStr);
    const from = Math.floor(date.getTime() / 1000);
    const to = Math.floor((date.getTime() + 86400000 * 3) / 1000); // +3 days buffer for weekends

    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`
    );
    const data = await res.json();

    if (data.s === 'ok' && data.c && data.c.length > 0) {
      const priceUsd = data.c[0]; // first close price after date
      const usdToIdr = await getUsdToIdr();
      return { price: Math.round(priceUsd * usdToIdr), priceUsd, source: 'finnhub' };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Get historical crypto price via CoinGecko
async function getHistoricalCryptoPrice(coinId, dateStr) {
  try {
    // CoinGecko expects DD-MM-YYYY
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formatted = `${day}-${month}-${year}`;

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/history?date=${formatted}`
    );
    const data = await res.json();
    const priceUsd = data?.market_data?.current_price?.usd;
    const priceIdr = data?.market_data?.current_price?.idr;

    if (priceIdr || priceUsd) {
      const usdToIdr = await getUsdToIdr();
      return {
        price: priceIdr || Math.round(priceUsd * usdToIdr),
        priceUsd,
        source: 'coingecko'
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Gold price historical via GoldAPI or fallback calculation
async function getHistoricalGoldPrice(dateStr) {
  try {
    // Use metals.live or similar — fallback: use current if no API
    const usdToIdr = await getUsdToIdr();
    // Approximate: XAU/USD historical via Yahoo Finance
    const date = new Date(dateStr);
    const from = Math.floor(date.getTime() / 1000);
    const to = Math.floor((date.getTime() + 86400000 * 3) / 1000);

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&period1=${from}&period2=${to}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    const priceUsd = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.[0];

    if (priceUsd) {
      const pricePerGramUsd = priceUsd / 31.1035; // troy oz to gram
      const pricePerGramIdr = Math.round(pricePerGramUsd * usdToIdr);
      return { price: pricePerGramIdr, priceUsd: pricePerGramUsd, source: 'yahoo', isGold: true };
    }
    return null;
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { symbol, type, date } = body;

    if (!symbol || !date) {
      return Response.json({ error: 'symbol and date are required' }, { status: 400 });
    }

    let result = null;

    if (type === 'saham') {
      result = await getHistoricalStockPrice(symbol, date);
    } else if (type === 'crypto') {
      result = await getHistoricalCryptoPrice(symbol, date);
    } else if (type === 'emas') {
      result = await getHistoricalGoldPrice(date);
    }

    if (!result) {
      return Response.json({ error: 'Historical price not found', price: null }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});