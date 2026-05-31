import { createClient } from '@supabase/supabase-js';
import { nextMonthDateFor } from './next-month-date.ts';

const BATCH_SIZE = parseInt(Deno.env.get('BATCH_SIZE') ?? '500');
const BATCH_DELAY_MS = parseInt(Deno.env.get('BATCH_DELAY_MS') ?? '100');
const JOB_NAME = 'generate-monthly-payments';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey!,
    { auth: { persistSession: false } },
  );

  const startedAt = Date.now();
  let created = 0;
  let skipped = 0;
  let batches = 0;
  let errorMessage: string | null = null;

  try {
    const now = new Date();
    let offset = 0;

    while (true) {
      const { data: bills, error: fetchError } = await supabase
        .from('bills')
        .select('id, household_id, due_date')
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) throw fetchError;
      if (!bills || bills.length === 0) break;

      const payments = bills.map((bill) => ({
        bill_id: bill.id,
        household_id: bill.household_id,
        for_month_d: nextMonthDateFor(bill.due_date, now),
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('payments')
        .upsert(payments, {
          onConflict: 'bill_id,for_month_d',
          ignoreDuplicates: true,
        })
        .select('id');

      if (insertError) throw insertError;

      const insertedCount = inserted?.length ?? 0;
      created += insertedCount;
      skipped += payments.length - insertedCount;
      batches++;

      if (bills.length < BATCH_SIZE) break;

      offset += BATCH_SIZE;
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[${JOB_NAME}] error:`, errorMessage);
  }

  const durationMs = Date.now() - startedAt;
  const summary = { created, skipped, batches, duration_ms: durationMs };

  const { error: jobRunError } = await supabase.from('job_runs').insert({
    job_name: JOB_NAME,
    created,
    skipped,
    duration_ms: durationMs,
    error: errorMessage,
  });
  if (jobRunError) {
    console.error(`[${JOB_NAME}] failed to write job_run:`, jobRunError.message);
  }

  console.log(`[${JOB_NAME}]`, JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: errorMessage ? 500 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
