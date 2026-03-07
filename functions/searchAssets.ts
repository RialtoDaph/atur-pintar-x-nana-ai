import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Search crypto via CoinGecko
async function searchCrypto(query) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.coins || data.coins.length === 0) return [];

    const topCoins = data.coins.slice(0, 5);
    const ids = topCoins.map(c => c.id).join(',');
    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,idr&include_24hr_change=true`
    );
    const priceData = await priceRes.json();

    return topCoins.map(coin => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      id: coin.id,
      price: priceData[coin.id]?.idr || priceData[coin.id]?.usd || 0,
      priceFormatted: priceData[coin.id]?.idr
        ? `Rp ${Number(priceData[coin.id].idr).toLocaleString('id-ID')}`
        : `$${(priceData[coin.id]?.usd || 0).toFixed(2)}`,
      change24h: priceData[coin.id]?.usd_24h_change || 0,
      type: 'crypto',
    }));
  } catch (e) {
    console.error('Crypto search error:', e);
    return [];
  }
}

// Fetch USD to IDR exchange rate
async function getUsdToIdr() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data?.rates?.IDR || 16000;
  } catch (_) {
    return 16000; // static fallback
  }
}

// Search stocks via Finnhub (prices converted to IDR)
async function searchStocks(query) {
  try {
    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) { console.error('FINNHUB_API_KEY not set'); return []; }

    const res = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`);
    const data = await res.json();
    if (!data.result || data.result.length === 0) return [];

    const topResults = data.result.slice(0, 5);
    const [prices, usdToIdr] = await Promise.all([
      Promise.all(
        topResults.map(item =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${apiKey}`)
            .then(r => r.json())
            .catch(() => null)
        )
      ),
      getUsdToIdr(),
    ]);

    return topResults
      .map((item, idx) => {
        const priceData = prices[idx];
        const priceUsd = priceData?.c || 0;
        const priceIdr = Math.round(priceUsd * usdToIdr);
        return {
          name: item.description || item.symbol,
          symbol: item.symbol,
          price: priceIdr,
          priceUsd,
          priceFormatted: `Rp ${priceIdr.toLocaleString('id-ID')}`,
          change24h: priceData?.d || 0,
          changePercent: priceData?.dp || 0,
          type: 'saham',
        };
      })
      .filter(s => s.price > 0);
  } catch (e) {
    console.error('Stock search error:', e);
    return [];
  }
}

// Gold price via CoinGecko (XAU price in IDR via USD * IDR rate)
async function fetchGoldPrice() {
  try {
    // CoinGecko: gold price in USD, then convert using USD/IDR rate
    const [goldRes, rateRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=gold&vs_currencies=usd,idr'),
      fetch('https://api.exchangerate-api.com/v4/latest/USD'),
    ]);

    const goldData = await goldRes.json();
    const goldPriceUSD = goldData?.gold?.usd;
    const goldPriceIDR = goldData?.gold?.idr;

    // Price per troy oz → per gram (1 troy oz = 31.1035 g)
    if (goldPriceIDR) {
      const perGramIDR = goldPriceIDR / 31.1035;
      return [{
        name: 'Gold (XAU)',
        symbol: 'XAU',
        price: Math.round(perGramIDR),
        priceFormatted: `Rp ${Math.round(perGramIDR).toLocaleString('id-ID')} / gram`,
        change24h: 0,
        type: 'emas',
        unit: 'gram',
      }];
    }

    if (goldPriceUSD) {
      // fallback: try ExchangeRate API for USD→IDR
      let usdToIdr = 16000; // fallback static
      try {
        const rateData = await rateRes.json();
        usdToIdr = rateData?.rates?.IDR || 16000;
      } catch (_) {}
      const perGramIDR = (goldPriceUSD / 31.1035) * usdToIdr;
      return [{
        name: 'Gold (XAU)',
        symbol: 'XAU',
        price: Math.round(perGramIDR),
        priceFormatted: `Rp ${Math.round(perGramIDR).toLocaleString('id-ID')} / gram`,
        change24h: 0,
        type: 'emas',
        unit: 'gram',
      }];
    }

    return [];
  } catch (e) {
    console.error('Gold price error:', e);
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { query, type } = body;

    if (!query || query.trim().length < 1) {
      return Response.json({ results: [] });
    }

    let results = [];

    if (type === 'crypto') {
      results = await searchCrypto(query);
    } else if (type === 'saham' || type === 'obligasi') {
      results = await searchStocks(query);
    } else if (type === 'emas') {
      results = await fetchGoldPrice();
    }
    // deposito, reksa_dana, lainnya: no live search, return empty

    return Response.json({ results: results.slice(0, 5) });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ results: [], error: error.message }, { status: 500 });
  }
});