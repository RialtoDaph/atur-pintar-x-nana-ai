import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all watchlist items for this user
    const watchlistItems = await base44.entities.InvestmentWatchlist.filter({ created_by: user.email });
    
    for (const item of watchlistItems) {
      if (item.current_price && item.target_price && item.current_price <= item.target_price) {
        // Check if alert already exists for this watchlist item today
        const existingAlerts = await base44.entities.Alert.filter({
          created_by: user.email,
          type: 'bill_upcoming',
          category: item.id
        });
        
        const today = new Date().toISOString().split('T')[0];
        const alertExists = existingAlerts.some(a => a.created_date && a.created_date.split('T')[0] === today);
        
        if (!alertExists) {
          await base44.entities.Alert.create({
            type: 'bill_upcoming',
            title: `Target harga tercapai: ${item.name}`,
            message: `Harga ${item.name} telah mencapai target Rp ${item.target_price?.toLocaleString('id-ID')}. Harga saat ini: Rp ${item.current_price?.toLocaleString('id-ID')}`,
            severity: 'high',
            status: 'unread',
            category: item.id
          });
        }
      }
    }
    
    return Response.json({ success: true, checked: watchlistItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});