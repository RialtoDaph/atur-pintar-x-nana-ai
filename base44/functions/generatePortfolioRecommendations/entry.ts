import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const riskProfile = body.data;

    if (!riskProfile || !riskProfile.risk_tolerance) {
      return Response.json({ error: 'Invalid risk profile data' }, { status: 400 });
    }

    let recommendation = '';
    if (riskProfile.risk_tolerance === 'conservative') {
      recommendation = '60% Deposito/Obligasi, 30% Reksa Dana, 10% Emas — Fokus pada keamanan dan return stabil.';
    } else if (riskProfile.risk_tolerance === 'moderate') {
      recommendation = '40% Reksa Dana, 30% Saham, 20% Emas, 10% Crypto — Balance antara growth dan safety.';
    } else if (riskProfile.risk_tolerance === 'aggressive') {
      recommendation = '50% Saham, 30% Crypto, 20% Reksa Dana — Fokus pada growth jangka panjang.';
    }

    // Create alert with portfolio recommendation
    await base44.entities.Alert.create({
      type: 'savings_opportunity',
      title: 'Rekomendasi Portfolio Investasi',
      message: `Berdasarkan profil risiko Anda (${riskProfile.risk_tolerance}), kami merekomendasikan: ${recommendation}`,
      severity: 'low',
      status: 'unread'
    });

    return Response.json({ success: true, recommendation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});