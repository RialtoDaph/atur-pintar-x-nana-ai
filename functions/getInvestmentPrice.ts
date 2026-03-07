import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Simple price fetcher - supports stocks (YFinance) and crypto (CoinGecko)
async function fetchStockPrice(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const price = data.chart?.result?.[0]?.regularMarketPrice || null;
    return price ? { price, source: 'yahoo' } : null;
  } catch (e) {
    return null;
  }
}

async function fetchCryptoPrice(symbol) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd,idr`);
    const data = await res.json();
    const id = symbol.toLowerCase();
    if (data[id]) {
      return { price: data[id].idr || data[id].usd, source: 'coingecko' };
    }
  } catch (e) {
    return null;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { symbol, type } = body; // type: 'stock' | 'crypto'

    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 });
    }

    let result;
    if (type === 'crypto') {
      result = await fetchCryptoPrice(symbol);
    } else {
      result = await fetchStockPrice(symbol);
    }

    if (!result) {
      return Response.json({ error: 'Price not found' }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});