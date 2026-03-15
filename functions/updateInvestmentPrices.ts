import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

async function fetchFinnhubQuote(symbol) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();
    // c = current price, pc = previous close
    if (data.c && data.c > 0) {
      return { price: data.c, previousClose: data.pc || data.c };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCryptoPrice(symbol) {
  try {
    // Finnhub crypto uses BINANCE:BTCUSDT format
    const finnhubSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${FINNHUB_API_KEY}`
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

    // Fetch investments for this user or all (service role)
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
    const updatableTypes = ["saham", "crypto"];
    const toUpdate = investments.filter(inv =>
      updatableTypes.includes(inv.type) &&
      inv.name &&
      inv.quantity > 0
    );

    const results = { updated: 0, failed: 0, skipped: 0 };

    for (const inv of toUpdate) {
      let priceData = null;

      if (inv.type === "saham") {
        priceData = await fetchFinnhubQuote(inv.name.toUpperCase());
      } else if (inv.type === "crypto") {
        // Try the name as a crypto symbol (e.g. BTC, ETH)
        priceData = await fetchCryptoPrice(inv.name);
      }

      if (priceData && priceData.price > 0) {
        const newCurrentValue = priceData.price * (inv.quantity || 1);
        const dailyChangePct = priceData.previousClose > 0
          ? ((priceData.price - priceData.previousClose) / priceData.previousClose) * 100
          : 0;

        await base44.asServiceRole.entities.Investment.update(inv.id, {
          current_value: Math.round(newCurrentValue * 100) / 100,
          price_per_unit: priceData.price,
          last_price_update: new Date().toISOString().split("T")[0],
          daily_change_pct: Math.round(dailyChangePct * 100) / 100,
        });
        results.updated++;
      } else {
        results.failed++;
      }
    }

    results.skipped = investments.length - toUpdate.length;

    return Response.json({
      success: true,
      total: investments.length,
      ...results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});