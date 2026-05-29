import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const target = users[0];
    const updated = await base44.asServiceRole.entities.User.update(target.id, {
      onboarding_completed: false,
      tour_completed: false,
    });

    return Response.json({ success: true, user: { id: target.id, email: target.email }, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});