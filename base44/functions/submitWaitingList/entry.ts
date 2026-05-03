import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory rate limit store (resets on cold start, good enough for basic spam protection)
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    // Window expired, reset
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count++;
  rateLimitStore.set(key, entry);
  return entry.count > RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, whatsapp, job, city, biggest_money_problem, current_finance_tracking_method, early_access_interest, honeypot } = body;

    // Honeypot check — silently accept but don't save
    if (honeypot) {
      return Response.json({ success: true, id: "bot" });
    }

    if (!name || !email || !job || !city || !current_finance_tracking_method || !early_access_interest) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limiting by email
    const emailKey = `email:${email.toLowerCase()}`;
    if (checkRateLimit(emailKey)) {
      return Response.json({ error: 'Terlalu banyak percobaan, coba lagi nanti' }, { status: 429 });
    }

    // Check if email already registered
    const existing = await base44.asServiceRole.entities.WaitingList.filter({ email: email.toLowerCase() });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'Email ini sudah terdaftar di waiting list' }, { status: 409 });
    }

    // Use service role to bypass RLS (public form, user not logged in)
    const record = await base44.asServiceRole.entities.WaitingList.create({
      name,
      email,
      whatsapp: whatsapp || undefined,
      job,
      city,
      biggest_money_problem: biggest_money_problem || undefined,
      current_finance_tracking_method,
      early_access_interest,
    });

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});