import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Only trigger on alert creation
    if (payload?.event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const alertData = payload?.data;
    if (!alertData) return Response.json({ skipped: true, reason: 'no data' });

    // Only send email for high/medium severity unread alerts
    if (alertData.email_sent) return Response.json({ skipped: true, reason: 'already sent' });
    if (alertData.severity === 'low') return Response.json({ skipped: true, reason: 'low severity' });

    const createdBy = alertData.created_by;
    if (!createdBy) return Response.json({ skipped: true, reason: 'no user' });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: createdBy,
      subject: `⚠️ ${alertData.title} - Atur.in`,
      body: `Halo!\n\nAtur.in mendeteksi notifikasi penting untuk keuanganmu:\n\n📌 ${alertData.title}\n${alertData.message}\n\nBuka aplikasi untuk melihat detail dan mengambil tindakan.\n\nSalam,\nTim Atur.in`,
    });

    // Mark email as sent
    await base44.asServiceRole.entities.Alert.update(alertData.id, { email_sent: true });

    return Response.json({ success: true, sent_to: createdBy });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});