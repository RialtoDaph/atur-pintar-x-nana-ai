import { base44 } from "@/api/base44Client";

/**
 * Recalculates an account's balance from all its transactions.
 */
export async function recalculateAccountBalance(accountId) {
  if (!accountId) return;
  const [accounts, transactions] = await Promise.all([
    base44.entities.Account.filter({ id: accountId }),
    base44.entities.Transaction.filter({ account_id: accountId }),
  ]);
  const account = accounts[0];
  if (!account) return;
  const initialBalance = account.initial_balance || 0;
  let income = 0, expense = 0, savings = 0;
  for (const tx of transactions) {
    if (tx.is_deleted) continue;
    if (tx.type === 'income') income += tx.amount || 0;
    else if (tx.type === 'expense') expense += tx.amount || 0;
    else if (tx.type === 'savings') savings += tx.amount || 0;
  }
  const newBalance = initialBalance + income - expense - savings;
  await base44.entities.Account.update(accountId, { balance: newBalance });
  return newBalance;
}

/**
 * Adjusts an account's balance based on a transaction.
 * @param {string} accountId
 * @param {number} amount
 * @param {string} type - "income" | "expense" | "savings"
 * @param {1 | -1} direction - 1 = apply, -1 = reverse
 */
export async function syncAccountBalance(accountId, amount, type, direction = 1) {
  if (!accountId || !amount) return;
  const accounts = await base44.entities.Account.filter({ id: accountId });
  const account = accounts[0];
  if (!account) return;

  const delta = type === "income" ? amount : -amount;
  const newBalance = (account.balance || 0) + delta * direction;
  await base44.entities.Account.update(accountId, { balance: newBalance });
}