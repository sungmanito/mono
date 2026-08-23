export interface ReminderBillLine {
  billName: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBillReminderEmail(
  householdName: string,
  bills: ReminderBillLine[],
): { subject: string; html: string; text: string } {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
  });
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
      amount,
    );

  const plural = bills.length !== 1;
  const subject = plural
    ? `Reminder: ${bills.length} bills are due soon for ${householdName}`
    : `Reminder: ${bills[0].billName} is due soon`;

  const rows = bills
    .map(
      (bill) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e2e2;">${escapeHtml(bill.billName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e2e2;">${dateFormatter.format(bill.dueDate)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e2e2;text-align:right;">${formatCurrency(bill.amount, bill.currency)}</td>
        </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;color:#1a1a1a;">
      <p>Hi ${escapeHtml(householdName)},</p>
      <p>The following ${plural ? 'bills are' : 'bill is'} coming due soon:</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #1a1a1a;">Bill</th>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #1a1a1a;">Due</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:2px solid #1a1a1a;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const text = [
    `Hi ${householdName},`,
    '',
    `The following ${plural ? 'bills are' : 'bill is'} coming due soon:`,
    '',
    ...bills.map(
      (bill) =>
        `- ${bill.billName}: ${formatCurrency(bill.amount, bill.currency)}, due ${dateFormatter.format(bill.dueDate)}`,
    ),
  ].join('\n');

  return { subject, html, text };
}
