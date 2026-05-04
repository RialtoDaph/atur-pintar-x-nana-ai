import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called by entity automation when a new sensitive_access log is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct call and entity automation payload.
    // Only fire on CREATE events to prevent duplicate emails when a log is later updated.
    if (body.event && body.event.type !== "create") {
      return Response.json({ skipped: true, reason: "not a create event" });
    }
    const logData = body.data || body;

    if (!logData || logData.log_type !== "sensitive_access") {
      return Response.json({ skipped: true });
    }

    // Get admin email from AppConfig or fallback to env
    const configs = await base44.asServiceRole.entities.AppConfig.list();
    const adminEmail = configs?.[0]?.admin_alert_email || Deno.env.get("ADMIN_ALERT_EMAIL");

    if (!adminEmail) {
      return Response.json({ skipped: true, reason: "no admin email configured" });
    }

    const accessedBy = logData.user_email || "Unknown";
    const targetUser = logData.target_email || "—";
    const action = logData.action || "—";
    const details = logData.details || "—";
    const ip = logData.ip_address || "—";
    const timestamp = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    const emailBody = `
⚠️ PERINGATAN AKSES DATA SENSITIF - Atur Pintar

Waktu: ${timestamp} WIB
Admin: ${accessedBy}
Action: ${action}
Target User: ${targetUser}
IP Address: ${ip}
Detail: ${details}

---
Jika Anda tidak mengenali akses ini, segera amankan akun Anda.
Dashboard Admin: ${Deno.env.get("APP_URL") || "https://aturpintar.app"}/AdminLogs

Pesan ini dikirim otomatis oleh sistem keamanan Atur Pintar.
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `🚨 [Atur Pintar] Akses Sensitif Terdeteksi - ${accessedBy}`,
      body: emailBody,
    });

    return Response.json({ sent: true, to: adminEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});