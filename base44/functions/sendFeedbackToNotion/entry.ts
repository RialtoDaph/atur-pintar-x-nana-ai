import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// NOTE: Notion connector is not authorized for this app. Feedback is forwarded
// to admin email instead. Rename kept for backward-compatibility with frontend.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { rating, message, userName, userEmail } = payload || {};

    if (!message || !String(message).trim()) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    // Get admin email — priority: AppConfig.admin_alert_email → env → first admin user
    let adminEmail = Deno.env.get("ADMIN_ALERT_EMAIL");
    try {
      const configs = await base44.asServiceRole.entities.AppConfig.list();
      if (configs?.[0]?.admin_alert_email) adminEmail = configs[0].admin_alert_email;
    } catch (_) {}

    // Final fallback: lookup first admin user so feedback notifications never silently disappear
    if (!adminEmail) {
      try {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        if (admins?.[0]?.email) adminEmail = admins[0].email;
      } catch (_) {}
    }

    if (!adminEmail) {
      // Feedback still saved in FeedbackReport entity — admin can view it in AdminFeedback page.
      return Response.json({ success: true, forwarded: false });
    }

    let priority = "MEDIUM";
    if (rating >= 4) priority = "LOW";
    else if (rating && rating <= 2) priority = "HIGH";

    const userLabel = userName ? `${userName}${userEmail ? ` (${userEmail})` : ""}` : (userEmail || "Anonymous");
    const stars = rating ? "⭐".repeat(rating) : "—";

    const body = `
📩 Feedback Baru — Atur Pintar

User: ${userLabel}
Rating: ${stars} ${rating ? `(${rating}/5)` : ""}
Priority: ${priority}

Pesan:
${message}

---
Dikirim otomatis dari form Feedback in-app.
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `[Atur Pintar] Feedback Baru — ${priority} — ${userLabel}`,
      body,
      from_name: 'Atur Pintar Feedback',
    });

    return Response.json({ success: true, forwarded: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});