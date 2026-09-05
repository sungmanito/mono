-- Custom SQL migration file, put your code below! --
-- SUN-33: add bills.recurrence + bills.anchor_date, backfill anchor_date from
-- the existing day-of-month due_date, and rename payments/bill_reminders
-- for_month_d -> due_date. See the SUN-5 design doc for the full rationale.
--
-- IMPORTANT (packages/db/CLAUDE.md): `db:push` only diffs schema - it does not
-- run this file. Apply this migration by hand (`psql "$DB_URL" -f
-- drizzle/0001_sun33_recurrence_anchor_date_due_date_rename.sql`) against
-- every environment BEFORE merging the matching bills/payments/billReminders
-- table changes to main, so that db:push's next run against that DB sees no
-- diff for these columns/indexes instead of trying (and failing, or worse,
-- guessing) to apply them itself.
--
-- bills.due_date (int, day-of-month) is intentionally left in place - it is
-- dropped in a later contract migration (SUN-39) once SUN-36/37/38 stop
-- reading it.

-- 1. Add the new bills columns. recurrence has a safe default; anchor_date
--    starts nullable so the backfill below can populate existing rows before
--    it's made NOT NULL.
ALTER TABLE "bills" ADD COLUMN "recurrence" interval NOT NULL DEFAULT '1 mon';
ALTER TABLE "bills" ADD COLUMN "anchor_date" date;
--> statement-breakpoint

-- 2. Backfill anchor_date: the next occurrence of the existing day-of-month
--    due_date on/after today. Mirrors resolveNextDueDate
--    (apps/website/src/lib/server/reminders.ts).
UPDATE "bills" SET "anchor_date" =
  CASE
    WHEN "due_date" >= extract(day FROM current_date)
      THEN make_date(
        extract(year  FROM current_date)::int,
        extract(month FROM current_date)::int,
        "due_date")
    ELSE (make_date(
        extract(year  FROM current_date)::int,
        extract(month FROM current_date)::int,
        "due_date") + interval '1 month')::date
  END;
--> statement-breakpoint

-- 3. Lock anchor_date down now that every row has a value. due_date is
--    already constrained to 1-28 today, so this check can't fail here.
ALTER TABLE "bills" ALTER COLUMN "anchor_date" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_anchor_day_chk"
  CHECK (extract(day from "anchor_date") between 1 and 28);
--> statement-breakpoint

-- 4. Pure rename: for_month_d -> due_date, both tables it appears on, plus
--    their indexes. No semantic change - see packages/db/CLAUDE.md.
ALTER TABLE "payments" RENAME COLUMN "for_month_d" TO "due_date";
--> statement-breakpoint
ALTER TABLE "bill_reminders" RENAME COLUMN "for_month_d" TO "due_date";
--> statement-breakpoint
ALTER INDEX "billId_month" RENAME TO "payments_bill_due_date_uq";
--> statement-breakpoint
ALTER INDEX "month_idx" RENAME TO "payments_due_date_idx";
--> statement-breakpoint
ALTER INDEX "bill_reminder_bill_month_idx" RENAME TO "bill_reminder_bill_due_date_idx";
