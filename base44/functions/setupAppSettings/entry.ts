import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // FIX 5: Delete orphaned service account AppSettings
    const serviceEmail = 'service+1c1a7794-cfa4-4c7a-8f36-4adc17f611f6@no-reply.base44.com';
    const orphaned = await base44.asServiceRole.entities.AppSettings.filter({ created_by: serviceEmail });
    for (const record of orphaned) {
      await base44.asServiceRole.entities.AppSettings.delete(record.id);
    }

    // FIX 5: Setup AppSettings for altodaphino@gmail.com if missing
    const targetEmail = 'altodaphino@gmail.com';
    const existing = await base44.asServiceRole.entities.AppSettings.filter({ created_by: targetEmail });
    
    if (!existing.length) {
      await base44.asServiceRole.entities.AppSettings.create({
        created_by: targetEmail,
        language: 'id',
        currency: 'IDR',
        currency_symbol: 'Rp',
        decimal_separator: ',',
        thousand_separator: '.',
        date_format: 'DD/MM/YYYY',
        settings_unlocked: true,
        category_order: [],
        analytics_cards: []
      });
    }

    // FIX 6: Set subscription dates for admin
    const admin = await base44.asServiceRole.entities.User.filter({ email: targetEmail });
    if (admin.length && !admin[0].subscription_end_date) {
      await base44.asServiceRole.entities.User.update(admin[0].id, {
        subscription_start_date: '2026-03-04',
        subscription_end_date: '2026-12-31'
      });
    }

    return Response.json({ 
      success: true,
      cleaned_orphaned: orphaned.length,
      setup_appsettings: !existing.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});