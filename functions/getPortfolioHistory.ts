import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

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
};

async function getUsdToIdr() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR");
    const data = await res.json();
    return data?.rates?.IDR || 16000;
  } catch {
    return 16000;
  }
}

function generateDatePoints(period) {
  const now = new Date();
  const points = [];
  let totalDays, intervalDays;
  if (period === '1M') { totalDays = 30; intervalDays = 1; }
  else if (period === '3M') { totalDays = 90; intervalDays = 4; }
  else if (period === '6M') { totalDays = 180; intervalDays = 7; }
  else { totalDays = 365; intervalDays = 14; }

  for (let d = totalDays; d >= 0; d -= intervalDays) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    points.push(date);
  }
  if (points[points.length - 1].toDateString() !== now.toDateString()) {
    points.push(now);
  }
  return points;
}

function dateToStr(date) {
  return date.toISOString().split('T')[0];
}

async function getCryptoHistory(coinId, fromDate, toDate) {
  try {
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=idr&from=${from}&to=${to}`
    );
    const data = await res.json();
    if (!data.prices || data.prices.length === 0) return null;
    return data.prices; // [[timestamp_ms, price_idr], ...]
  } catch {
    return null;
  }
}

async function getStockHistory(symbol, fromDate, toDate, usdToIdr) {
  try {
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    if (data.s !== 'ok' || !data.t) return null;
    const isIndonesian = symbol.endsWith('.JK');
    return data.t.map((ts, i) => [
      ts * 1000,
      Math.round(data.c[i] * (isIndonesian ? 1 : usdToIdr))
    ]);
  } catch {
    return null;
  }
}

async function getGoldHistory(fromDate, toDate, usdToIdr) {
  try {
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&period1=${from}&period2=${to}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close;
    if (!timestamps || !closes) return null;
    // Gold price is per troy oz in USD, convert to IDR per gram
    return timestamps.map((ts, i) => [ts * 1000, Math.round((closes[i] / 31.1035) * usdToIdr)]);
  } catch {
    return null;
  }
}

function findClosestPrice(priceArray, targetTs) {
  if (!priceArray || priceArray.length === 0) return null;
  let closest = priceArray[0];
  let minDiff = Math.abs(priceArray[0][0] - targetTs);
  for (const point of priceArray) {
    const diff = Math.abs(point[0] - targetTs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  // Only use if within 4 days
  if (minDiff > 4 * 24 * 60 * 60 * 1000) return null;
  return closest[1];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { period = '3M' } = body;

    const investments = await base44.entities.Investment.filter({ created_by: user.email });
    if (!investments || investments.length === 0) {
      return Response.json({ data: [] });
    }

    const datePoints = generateDatePoints(period);
    const fromDate = datePoints[0];
    const toDate = datePoints[datePoints.length - 1];

    // Fetch exchange rate once
    const usdToIdr = await getUsdToIdr();

    // Fetch price history for each investment
    const investmentHistories = await Promise.all(
      investments.map(async (inv) => {
        const { type, name, quantity = 1, current_value = 0 } = inv;
        let priceHistory = null;

        if (type === 'crypto') {
          const coinId = CRYPTO_COINGECKO_MAP[name.toLowerCase()] || name.toLowerCase();
          priceHistory = await getCryptoHistory(coinId, fromDate, toDate);
        } else if (type === 'saham') {
          const symbol = name.trim().toUpperCase();
          priceHistory = await getStockHistory(symbol, fromDate, toDate, usdToIdr);
          // If not found, try searching for the symbol
          if (!priceHistory) {
            try {
              const searchRes = await fetch(
                `https://finnhub.io/api/v1/search?q=${encodeURIComponent(name)}&token=${FINNHUB_API_KEY}`
              );
              const searchData = await searchRes.json();
              if (searchData.result?.length > 0) {
                const found = searchData.result.find(r =>
                  r.symbol?.toUpperCase() === name.toUpperCase() ||
                  r.displaySymbol?.toUpperCase() === name.toUpperCase()
                );
                const sym = (found || searchData.result[0]).symbol;
                priceHistory = await getStockHistory(sym, fromDate, toDate, usdToIdr);
              }
            } catch { /* ignore */ }
          }
        } else if (type === 'emas') {
          // For gold, don't fetch history—use fallback as gold prices are volatile
          // History will fallback to current_value in the chart calculation
          priceHistory = null;
        }

        return { inv, priceHistory, quantity, current_value, type };
      })
    );

    // Build chart data: for each date point, sum portfolio value
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = dateToStr(today);
    const isLatestPoint = (date) => dateToStr(date) === todayStr;

    const chartData = datePoints.map((date) => {
      const targetTs = date.getTime();
      let totalValue = 0;
      let hasRealData = false;
      const isLatest = isLatestPoint(date);

      for (const { priceHistory, quantity, current_value } of investmentHistories) {
        // For today's date, always use current_value from database (already updated)
        if (isLatest) {
          totalValue += current_value;
        } else if (priceHistory && priceHistory.length > 0) {
          const price = findClosestPrice(priceHistory, targetTs);
          if (price !== null) {
            totalValue += price * quantity;
            hasRealData = true;
          } else {
            totalValue += current_value;
          }
        } else {
          totalValue += current_value;
        }
      }

      const label = period === '1M'
        ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });

      return {
        date: dateToStr(date),
        value: Math.round(totalValue),
        label,
        hasRealData,
      };
    });

    return Response.json({ data: chartData, usdToIdr: Math.round(usdToIdr) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});