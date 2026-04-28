// Recalculates currentBalance from initialBalance + sum of all cashTransactions.
// Use this after any cashTransaction.create/delete to keep the stored balance in sync.
export async function recalculateBankBalance(
  tx: any,
  bankAccountId: string,
  empresaId: string,
): Promise<void> {
  const account = await tx.bankAccount.findUnique({
    where: { id: bankAccountId },
    select: { initialBalance: true, currency: true },
  })
  if (!account) return

  const agg = await tx.cashTransaction.aggregate({
    where: { bankAccountId, empresaId, currency: account.currency },
    _sum: { amount: true },
  })

  const newBalance = Number(account.initialBalance) + Number(agg._sum.amount ?? 0)

  await tx.bankAccount.update({
    where: { id: bankAccountId },
    data: { currentBalance: newBalance },
  })
}
