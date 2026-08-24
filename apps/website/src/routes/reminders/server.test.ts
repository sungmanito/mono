import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from './$types';

vi.mock('$lib/server/email/resend', () => ({
  resend: { emails: { send: vi.fn() } },
}));

vi.mock('$lib/server/reminders', () => ({
  getUpcomingUnpaidBillsByHousehold: vi.fn(),
}));

vi.mock('$lib/server/db', () => ({
  db: { insert: vi.fn(), delete: vi.fn() },
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    CRON_SECRET: 'test-secret',
    REMINDER_SENDER_EMAIL: 'reminders@example.com',
  },
}));

const { GET } = await import('./+server');
const { resend } = await import('$lib/server/email/resend');
const { getUpcomingUnpaidBillsByHousehold } = await import(
  '$lib/server/reminders'
);
const { db } = await import('$lib/server/db');

function makeInsertChain(returning: unknown[]) {
  return {
    values: () => ({
      onConflictDoNothing: () => ({
        returning: () => Promise.resolve(returning),
      }),
    }),
  };
}

function makeEvent(authorization?: string): RequestEvent {
  return {
    request: new Request('http://localhost/reminders', {
      headers: authorization ? { authorization } : undefined,
    }),
  } as RequestEvent;
}

describe('GET /reminders', () => {
  let deleteWhereMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue(makeInsertChain([]) as never);
    vi.mocked(db.delete).mockReturnValue({ where: deleteWhereMock } as never);
    vi.mocked(getUpcomingUnpaidBillsByHousehold).mockResolvedValue({});
  });

  it('rejects a missing or wrong CRON_SECRET with 401 and does no work', async () => {
    await expect(GET(makeEvent())).rejects.toMatchObject({ status: 401 });
    await expect(GET(makeEvent('Bearer wrong'))).rejects.toMatchObject({
      status: 401,
    });

    expect(getUpcomingUnpaidBillsByHousehold).not.toHaveBeenCalled();
    expect(resend.emails.send).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('sends one email per household with the correct recipients on the happy path', async () => {
    const dueDate = new Date(2026, 7, 25);
    vi.mocked(getUpcomingUnpaidBillsByHousehold).mockResolvedValue({
      'household-1': {
        householdName: 'The Smiths',
        memberEmails: ['a@example.com', 'b@example.com'],
        bills: [
          {
            id: 'bill-1',
            billName: 'Internet',
            amount: 79.99,
            currency: 'USD',
            dueDate,
          },
        ],
      },
    });
    vi.mocked(db.insert).mockReturnValue(
      makeInsertChain([
        {
          id: 'reminder-1',
          billId: 'bill-1',
          householdId: 'household-1',
          forMonthD: dueDate,
        },
      ]) as never,
    );
    vi.mocked(resend.emails.send).mockResolvedValue({
      data: { id: 'sent-1' },
    } as never);

    const response = await GET(makeEvent('Bearer test-secret'));
    const body = await response.json();

    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['a@example.com', 'b@example.com'],
        from: 'reminders@example.com',
      }),
    );
    expect(db.delete).not.toHaveBeenCalled();
    expect(body.results).toEqual([
      { householdId: 'household-1', sent: true, billCount: 1 },
    ]);
  });

  it('rolls back the claim when the send fails', async () => {
    const dueDate = new Date(2026, 7, 25);
    vi.mocked(getUpcomingUnpaidBillsByHousehold).mockResolvedValue({
      'household-1': {
        householdName: 'The Smiths',
        memberEmails: ['a@example.com'],
        bills: [
          {
            id: 'bill-1',
            billName: 'Internet',
            amount: 79.99,
            currency: 'USD',
            dueDate,
          },
        ],
      },
    });
    vi.mocked(db.insert).mockReturnValue(
      makeInsertChain([
        {
          id: 'reminder-1',
          billId: 'bill-1',
          householdId: 'household-1',
          forMonthD: dueDate,
        },
      ]) as never,
    );
    vi.mocked(resend.emails.send).mockRejectedValue(
      new Error('Resend is down'),
    );

    const response = await GET(makeEvent('Bearer test-secret'));
    const body = await response.json();

    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(body.results).toEqual([
      {
        householdId: 'household-1',
        sent: false,
        billCount: 0,
        error: 'Resend is down',
      },
    ]);
  });

  it('skips a household entirely when all its bills are already claimed (already reminded)', async () => {
    const dueDate = new Date(2026, 7, 25);
    vi.mocked(getUpcomingUnpaidBillsByHousehold).mockResolvedValue({
      'household-1': {
        householdName: 'The Smiths',
        memberEmails: ['a@example.com'],
        bills: [
          {
            id: 'bill-1',
            billName: 'Internet',
            amount: 79.99,
            currency: 'USD',
            dueDate,
          },
        ],
      },
    });
    // ON CONFLICT DO NOTHING claimed zero rows - this bill was already reminded.
    vi.mocked(db.insert).mockReturnValue(makeInsertChain([]) as never);

    const response = await GET(makeEvent('Bearer test-secret'));
    const body = await response.json();

    expect(resend.emails.send).not.toHaveBeenCalled();
    expect(body.results).toEqual([]);
  });
});
