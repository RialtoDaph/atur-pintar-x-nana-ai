import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const cleanupEmails = ['larasadelia586@gmail.com', 'imeldaiis61@gmail.com'];
    const duplicateAccountIds = [
      '69d6ab5e92af1ffb43dc4917', '69d6ab5e92af1ffb43dc4918', '69d6ab5e92af1ffb43dc4919',
      '69d6aa3cc8f31cc09e13834f', '69d6aa3cc8f31cc09e138350', '69d6aa3cc8f31cc09e138351',
      '69d6a81dbf4eab411c1e3b5f', '69d6a81dbf4eab411c1e3b60', '69d6a81dbf4eab411c1e3b61'
    ];
    const duplicateBudgetIds = [
      '69d6ab7f1680e71b98b67492', '69d6ab7f1680e71b98b67493', '69d6ab7f1680e71b98b67494',
      '69d6ab7f1680e71b98b67495', '69d6ab7f1680e71b98b67496', '69d6a831a9d77c15217d1acd',
      '69d6a831a9d77c15217d1ace', '69d6a831a9d77c15217d1acf', '69d6a831a9d77c15217d1ad0',
      '69d6a831a9d77c15217d1ad1', '69d6a831a9d77c15217d1ad2'
    ];
    const duplicateSavingsGoalIds = [
      '69d6ab664a7c07d8b8471061', '69d6ab664a7c07d8b8471062',
      '69d6a8391be33dd60be07185', '69d6a8391be33dd60be07186', '69d6a8391be33dd60be07187'
    ];
    const duplicateReminderIds = [
      '69d6ab86f3c659b25c017603', '69d6ab86f3c659b25c017604', '69d6ab86f3c659b25c017605',
      '69d6a84014f0628553cc2613', '69d6a84014f0628553cc2614', '69d6a84014f0628553cc2615'
    ];
    const duplicateInvestmentIds = [
      '69d6ac16b817fa58e538e224', '69d6ac16b817fa58e538e225', '69d6ac16b817fa58e538e226'
    ];
    const duplicateSubscriptionIds = [
      '69d6ac4606bb8cd9079bb2b1', '69d6ac4606bb8cd9079bb2b2', '69d6ac4606bb8cd9079bb2b3', '69cb05d03f1c8c8b5a1b14e1'
    ];
    const duplicateGamificationIds = [
      '69d6ac4b01a1998f0953eaa5', '69d6aa35f1492c128b01b6c8'
    ];
    const duplicateAlertIds = [
      '69d6ac61427fef70824fe32a', '69d6ac61427fef70824fe32b', '69d6ac61427fef70824fe32c'
    ];
    const pendingPaymentIds = [
      '69c921cf743210a9b99440bf', '69c26e0c787e691b56c26fd2', '69c269cd24b7e02baca3ce49'
    ];

    // Delete entities by created_by
    const entities = [
      'Transaction', 'SavingsGoal', 'Debt', 'Account', 'Budget', 'Reminder',
      'GamificationProfile', 'NanaPreferences', 'UserRiskProfile', 'Investment',
      'InvestmentTransaction', 'InvestmentWatchlist', 'Subscription', 'Alert',
      'SplitBill', 'SplitIOU'
    ];

    let deletedCount = 0;
    for (const entityName of entities) {
      try {
        const query = { '$or': [{ created_by: cleanupEmails[0] }, { created_by: cleanupEmails[1] }] };
        // Note: SDK may not support bulk delete with OR - try individually
        for (const email of cleanupEmails) {
          const records = await base44.asServiceRole.entities[entityName].filter({ created_by: email });
          for (const r of records) {
            await base44.asServiceRole.entities[entityName].delete(r.id);
            deletedCount++;
          }
        }
      } catch (e) {}
    }

    // Delete duplicate records by ID
    const idDeletions = [
      ...duplicateAccountIds, ...duplicateBudgetIds, ...duplicateSavingsGoalIds,
      ...duplicateReminderIds, ...duplicateInvestmentIds, ...duplicateSubscriptionIds,
      ...duplicateGamificationIds, ...duplicateAlertIds, ...pendingPaymentIds
    ];

    for (const id of idDeletions) {
      try {
        // Try deleting from each entity
        const allEntities = ['Account', 'Budget', 'SavingsGoal', 'Reminder', 'Investment', 'Subscription', 'GamificationProfile', 'Alert', 'SubscriptionPayment'];
        for (const entityName of allEntities) {
          try {
            await base44.asServiceRole.entities[entityName].delete(id);
            deletedCount++;
            break;
          } catch (e) {}
        }
      } catch (e) {}
    }

    // Fix OVO account balance
    try {
      await base44.asServiceRole.entities.Account.update('69d68ec8fed56014e1f5ba78', { balance: 0 });
    } catch (e) {}

    // Approve hd722875 payment
    try {
      const today = new Date().toISOString().split('T')[0];
      await base44.asServiceRole.entities.SubscriptionPayment.update('69ccbb1d40b8ac188f504e23', {
        status: 'approved',
        approved_at: today
      });

      const userRes = await base44.asServiceRole.entities.User.filter({ email: 'hd722875@gmail.com' });
      if (userRes.length > 0) {
        await base44.asServiceRole.entities.User.update(userRes[0].id, {
          subscription_plan: 'premium_monthly',
          subscription_status: 'active',
          subscription_start_date: today,
          subscription_end_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    } catch (e) {}

    // Log cleanup action
    try {
      await base44.asServiceRole.entities.SystemLog.create({
        log_type: 'activity',
        user_email: user.email,
        action: 'data_cleanup',
        severity: 'warning',
        details: `Cleaned ${deletedCount} records`
      });
    } catch (e) {}

    return Response.json({
      success: true,
      message: `Data cleanup completed. Deleted ${deletedCount} records.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});