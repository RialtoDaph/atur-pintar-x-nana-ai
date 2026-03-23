import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all investments for this user
    const investments = await base44.entities.Investment.filter({ created_by: user.email });

    for (const investment of investments) {
      let newPrice = investment.price_per_unit;
      let symbol = investment.name?.toLowerCase() || '';

      try {
        if (investment.type === 'crypto') {
          // Fetch from CoinGecko API
          const cryptoMap = {
            bitcoin: 'bitcoin',
            ethereum: 'ethereum',
            btc: 'bitcoin',
            eth: 'ethereum'
          };
          const coinId = cryptoMap[symbol.split(' ')[0].toLowerCase()] || symbol.toLowerCase();
          
          const cryptoRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=idr&include_24hr_change=true`
          );
          const cryptoData = await cryptoRes.json();
          if (cryptoData[coinId]) {
            newPrice = cryptoData[coinId].idr;
          }
        } else if (investment.type === 'saham') {
          // Fetch from Finnhub API
          const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
          if (!finnhubKey) throw new Error('Finnhub API key not configured');
          
          const stockRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${finnhubKey}`
          );
          const stockData = await stockRes.json();
          if (stockData.c) {
            newPrice = stockData.c * 15000; // Convert USD to IDR (rough conversion)
          }
        } else if (investment.type === 'emas') {
          // Fetch gold price (simplified - using a public gold API)
          const goldRes = await fetch('https://api.metals.live/v1/spot/gold');
          const goldData = await goldRes.json();
          if (goldData.gold) {
            newPrice = goldData.gold * 600000; // Convert oz to gram and to IDR (rough)
          }
        }

        // Calculate price change percentage
        const oldPrice = investment.price_per_unit || newPrice;
        const changePercent = Math.abs((newPrice - oldPrice) / oldPrice * 100);

        // Update investment
        const newValue = investment.quantity * newPrice;
        await base44.entities.Investment.update(investment.id, {
          price_per_unit: newPrice,
          current_value: newValue,
          last_price_update: new Date().toISOString().split('T')[0],
          daily_change_pct: changePercent
        });

        // Create alert if change > 5%
        if (changePercent > 5) {
          await base44.asServiceRole.entities.Alert.create({
            type: 'unusual_pattern',
            title: `${investment.name} Price Change`,
            message: `${investment.name} harga berubah ${changePercent.toFixed(2)}%`,
            severity: newPrice > oldPrice ? 'low' : 'medium',
            status: 'unread',
            created_by: user.email
          });
        }
      } catch (error) {
        console.error(`Error updating ${investment.name}:`, error.message);
      }
    }

    return Response.json({ success: true, updated: investments.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});