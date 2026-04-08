import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let deleted = 0;

    // Gap 6: Delete older NanaPreferences for altodaphino
    const nanaPrefs = await base44.asServiceRole.entities.NanaPreferences.filter({ created_by: 'altodaphino@gmail.com' });
    if (nanaPrefs.length > 1) {
      nanaPrefs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const olderOne = nanaPrefs[0];
      await base44.asServiceRole.entities.NanaPreferences.delete(olderOne.id);
      deleted++;
    }

    // Gap 7: Delete orphaned AppSettings for deleted users
    const orphanedEmails = ['imeldaiis61@gmail.com', 'larasadelia586@gmail.com'];
    for (const email of orphanedEmails) {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({ created_by: email });
      for (const s of settings) {
        await base44.asServiceRole.entities.AppSettings.delete(s.id);
        deleted++;
      }
    }

    // Gap 7: Create default AppSettings for altodaphino if missing
    const altodoSettings = await base44.asServiceRole.entities.AppSettings.filter({ created_by: 'altodaphino@gmail.com' });
    if (altodoSettings.length === 0) {
      await base44.asServiceRole.entities.AppSettings.create({
        created_by: 'altodaphino@gmail.com',
        language: 'id',
        currency: 'IDR',
        currency_symbol: 'Rp',
        decimal_separator: ',',
        thousand_separator: '.',
        date_format: 'DD/MM/YYYY',
        settings_unlocked: true
      });
      deleted++;
    }

    return Response.json({ success: true, cleaned: deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});