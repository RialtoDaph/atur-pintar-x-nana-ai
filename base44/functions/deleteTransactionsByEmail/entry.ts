import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can delete other users' transactions
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Fetch all transactions for the email using service role
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ created_by: email });

    if (transactions.length === 0) {
      return Response.json({ message: 'No transactions found', deletedCount: 0 });
    }

    // Delete all transactions
    await Promise.all(
      transactions.map(tx => base44.asServiceRole.entities.Transaction.delete(tx.id))
    );

    return Response.json({
      message: `Deleted ${transactions.length} transactions for ${email}`,
      deletedCount: transactions.length,
      email
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});