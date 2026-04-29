import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, whatsapp, job, city, biggest_money_problem, current_finance_tracking_method, early_access_interest } = body;

    if (!name || !email || !job || !city || !current_finance_tracking_method || !early_access_interest) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
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