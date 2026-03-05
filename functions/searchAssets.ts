import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Search crypto assets via CoinGecko
async function searchCrypto(query) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (!data.coins || data.coins.length === 0) return [];

    // Get top 5 results with price data
    const topCoins = data.coins.slice(0, 5);
    const ids = topCoins.map(c => c.id).join(',');
    
    const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    const priceData = await priceRes.json();

    return topCoins.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      id: coin.id,
      price: priceData[coin.id]?.usd || 0,
      priceFormatted: `$${(priceData[coin.id]?.usd || 0).toFixed(2)}`,
      change24h: priceData[coin.id]?.usd_24h_change || 0,
      type: 'crypto'
    }));
  } catch (e) {
    console.error('Crypto search error:', e);
    return [];
  }
}

// Search stocks via Yahoo Finance
async function searchStocks(query) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/searchip?query=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=5&newsCount=0`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();

    if (!data.quotes || data.quotes.length === 0) return [];

    return data.quotes.slice(0, 5).map(quote => ({
      name: quote.longname || quote.symbol,
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      priceFormatted: `$${(quote.regularMarketPrice || 0).toFixed(2)}`,
      change24h: quote.regularMarketChangePercent || 0,
      type: 'saham'
    }));
  } catch (e) {
    console.error('Stock search error:', e);
    return [];
  }
}

// Search for mutual funds / Indonesian assets
async function searchMutualFunds(query) {
  // For now, return empty - in production, integrate with Indonesian financial APIs
  // like BNI Investasi, Mandiri Investasi, etc.
  return [];
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { query, type } = body;

    if (!query || query.trim().length < 1) {
      return Response.json({ results: [] });
    }

    let results = [];

    if (type === 'crypto') {
      results = await searchCrypto(query);
    } else if (type === 'saham') {
      results = await searchStocks(query);
    } else if (type === 'reksa_dana') {
      results = await searchMutualFunds(query);
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ results: [], error: error.message }, { status: 500 });
  }
});