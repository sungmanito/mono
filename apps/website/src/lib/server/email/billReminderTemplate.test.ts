import { describe, expect, it } from 'vitest';
import { renderBillReminderEmail } from './billReminderTemplate';

describe('renderBillReminderEmail', () => {
  it('renders a singular subject and content for one bill', () => {
    const { subject, html, text } = renderBillReminderEmail('The Smiths', [
      {
        billName: 'Internet',
        amount: 79.99,
        currency: 'USD',
        dueDate: new Date(2026, 7, 25),
      },
    ]);

    expect(subject).toBe('Reminder: Internet is due soon');
    expect(html).toContain('Internet');
    expect(html).toContain('$79.99');
    expect(html).toContain('August 25');
    expect(text).toContain('Internet');
    expect(text).toContain('$79.99');
    expect(text).toContain('August 25');
  });

  it('renders a plural subject and content for multiple bills', () => {
    const { subject, html, text } = renderBillReminderEmail('The Smiths', [
      {
        billName: 'Internet',
        amount: 79.99,
        currency: 'USD',
        dueDate: new Date(2026, 7, 25),
      },
      {
        billName: 'Water',
        amount: 40,
        currency: 'USD',
        dueDate: new Date(2026, 7, 26),
      },
    ]);

    expect(subject).toBe('Reminder: 2 bills are due soon for The Smiths');
    expect(html).toContain('Internet');
    expect(html).toContain('Water');
    expect(text).toContain('Internet');
    expect(text).toContain('Water');
  });

  it('formats currency per bill', () => {
    const { html } = renderBillReminderEmail('The Smiths', [
      {
        billName: 'Rent',
        amount: 1500,
        currency: 'EUR',
        dueDate: new Date(2026, 7, 1),
      },
    ]);

    expect(html).toContain('€1,500.00');
  });

  it('escapes household and bill names to avoid breaking the HTML', () => {
    const { html } = renderBillReminderEmail('<script>alert(1)</script>', [
      {
        billName: 'Bill & <b>Bold</b>',
        amount: 1,
        currency: 'USD',
        dueDate: new Date(2026, 7, 1),
      },
    ]);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Bill &amp; &lt;b&gt;Bold&lt;/b&gt;');
  });
});
