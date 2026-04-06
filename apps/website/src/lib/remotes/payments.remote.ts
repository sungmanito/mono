import { command, form, getRequestEvent, query } from '$app/server';
import { PAYMENT_BUCKET_NAME } from '$env/static/private';
import { db } from '$lib/server/db';
import { ulidValidator } from '$lib/typesValidators';
import { allowedImageTypes } from '$utils/images';
import schema from '@sungmanito/db';
import { error } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { getUser, getUserHouseholds } from './common.remote';
import { getImageIdByPath } from './images.remote';

const optionalISODateValidator = type(
  /^\d{4}-\d{2}-\d{2}((?:T|\s)\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,
)
  .or('undefined')
  .or('Date')
  .narrow((value) => {
    if (value === undefined) return true;
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    // For string values, verify the date is actually valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  });

export const getCurrentPaymentsByHousehold = query(
  optionalISODateValidator,
  async (date) => {
    const payments = await getCurrentPayments(date);
    const grouped: Record<string, { name: string; payments: typeof payments }> =
      payments.reduce(
        (acc, payment) => {
          if (!acc[payment.householdId]) {
            acc[payment.householdId] = {
              name: payment.household.name,
              payments: [],
            };
          }

          acc[payment.householdId].payments.push(payment);

          return acc;
        },
        {} as Record<string, { name: string; payments: typeof payments }>,
      );
    return grouped;
  },
);

export const getCurrentPayments = query(
  optionalISODateValidator,
  async (date) => {
    const userHouseholds = await getUserHouseholds();
    const isoDate = (date ? new Date(date) : new Date()).toISOString();
    const [isoYear, isoMonth] = isoDate.split('T')[0].split('-').map(Number);

    return db
      .select({
        ...getTableColumns(schema.payments),
        billName: schema.bills.billName,
        household: schema.households,
      })
      .from(schema.payments)
      .innerJoin(schema.bills, eq(schema.bills.id, schema.payments.billId))
      .innerJoin(
        schema.households,
        eq(schema.households.id, schema.payments.householdId),
      )
      .where(
        and(
          inArray(
            schema.payments.householdId,
            userHouseholds.map((h) => h.id),
          ),
          eq(
            sql`extract('month' from ${schema.payments.forMonthD})`,
            isoMonth,
          ),
          eq(
            sql`extract(YEAR from ${schema.payments.forMonthD})`,
            isoYear,
          ),
        ),
      )
      .orderBy(schema.payments.forMonthD);
  },
);

export const unmarkPayment = command(ulidValidator, async (id) => {
  const userHouseholds = await getUserHouseholds();
  const payment = await db
    .update(schema.payments)
    .set({ paidAt: null, proofImage: null, notes: null, updatedBy: null })
    .where(
      and(
        eq(schema.payments.id, id),
        inArray(
          schema.payments.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .returning();

  getCurrentPayments().refresh();
  getCurrentPaymentsByHousehold.refresh();
  return payment[0];
});

const uploadImageValidator = type({
  paymentId: ulidValidator,
  householdId: ulidValidator,
  proofFile: 'File',
  amount: type("number>=0 | ''").pipe((s) => s === '' && 0),
  'proof?': 'string>=0',
});

export const uploadImage = form(
  uploadImageValidator,
  async ({ paymentId, householdId, proofFile: image, amount = 0, proof }) => {
    // need this to update the paidBy field
    const user = await getUser();
    // Need this for our where clause to ensure we aren't uploading an image to the wrong place
    const userHouseholds = await getUserHouseholds();

    const { locals } = await getRequestEvent();

    if (image.type && !allowedImageTypes.has(image.type)) {
      throw error(400, 'Invalid image type');
    }

    if (image.size > 5 * 1024 * 1024) {
      throw error(400, 'Image too large (max 5MB)');
    }

    let imageId: string | null = null;

    if (image.size > 0) {
      const fileName = `${householdId}/${paymentId}.${image.name.split('.').at(-1)}`;
      const bucket = locals.supabase.storage.from(PAYMENT_BUCKET_NAME);
      const { data: url, error: signingErr } =
        await bucket.createSignedUploadUrl(fileName, {
          upsert: true,
        });

      if (signingErr) {
        error(500, 'Error creating upload URL');
      }

      const uploadResult = await bucket.uploadToSignedUrl(
        url.path,
        url.token,
        image,
      );

      if (uploadResult.data) {
        imageId = (await getImageIdByPath(uploadResult.data.path)) || null;
      }
    }

    const [updated] = await db
      .update(schema.payments)
      .set({
        updatedBy: user.id,
        proofImage: imageId || undefined,
        paidAt: new Date(),
        notes: proof ? (proof.length > 0 ? proof : null) : undefined,
        amount:
          typeof amount === 'number' && amount > 0
            ? amount.toString()
            : undefined,
      })
      .where(
        and(
          eq(schema.payments.id, paymentId),
          eq(schema.payments.householdId, householdId),
          inArray(
            schema.payments.householdId,
            userHouseholds.map((h) => h.id),
          ),
        ),
      )
      .returning();

    if (updated) {
      // reset the payments cache
      getCurrentPayments().refresh();
      // reset the cache for this specific payment
      getPayment(paymentId).refresh();
      // reset the grouped cache
      getCurrentPaymentsByHousehold.refresh();
      return updated;
    }

    return null;
  },
);

/**
 *
 * Gets a singular payment by ID
 */
export const getPayment = query(ulidValidator, async (id) => {
  const userHouseholds = await getUserHouseholds();

  return db
    .select({
      ...getTableColumns(schema.payments),
      billName: schema.bills.billName,
      household: schema.households,
    })
    .from(schema.payments)
    .innerJoin(schema.bills, eq(schema.bills.id, schema.payments.billId))
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.payments.householdId),
    )
    .where(
      and(
        eq(schema.payments.id, id),
        inArray(
          schema.payments.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .orderBy(desc(schema.payments.forMonthD))
    .limit(1)
    .then((r) => r[0]);
});

export const togglePayment = form(
  type({
    paymentId: ulidValidator,
  }),
  async ({ paymentId }) => {
    const { locals } = await getRequestEvent();
    const user = await getUser();
    const userHouseholds = await getUserHouseholds();

    /**
     * 1. determine if the payment has an associated image with it
     * 2. if it does, remove that image
     * 3. toggle the paidAt field and updatedBy field
     */

    const txResult = await db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(schema.objects)
        .innerJoin(
          schema.payments,
          eq(schema.objects.id, schema.payments.proofImage),
        )
        .where(eq(schema.payments.id, paymentId));
      if (image) {
        // We must remove the image from storage.
        const res = await locals.supabase.storage
          .from(PAYMENT_BUCKET_NAME)
          .remove([image.objects.name]);

        if (res.error) {
          console.error('Failed to remove image from storage:', res.error);
          tx.rollback();
          error(500, 'Failed to remove image from storage');
        }
      }
      const [res] = await tx
        .update(schema.payments)
        .set({
          paidAt: sql`case when ${schema.payments.paidAt} is null then now() else null end`,
          updatedBy: sql`case when ${schema.payments.paidAt} is null then ${user.id}::uuid else null end`,
          proofImage: image ? null : undefined,
        })
        .where(
          and(
            eq(schema.payments.id, paymentId),
            inArray(
              schema.payments.householdId,
              userHouseholds.map((h) => h.id),
            ),
          ),
        )
        .returning();

      if (!res) {
        tx.rollback();
        error(400, 'Failed to update payment');
      } else {
        getCurrentPayments().refresh();
        getPayment(paymentId).refresh();
        getCurrentPaymentsByHousehold.refresh();
      }

      return {
        image: image?.objects,
        payment: res,
      };
    });

    return null;
  },
);

export const markPayment = form(
  type({
    paymentId: ulidValidator,
  }),
  async (data) => {
    const user = await getUser();
    const userHouseholds = await getUserHouseholds();

    const [updated] = await db
      .update(schema.payments)
      .set({
        paidAt: new Date(),
        updatedBy: user.id,
      })
      .where(
        and(
          eq(schema.payments.id, data.paymentId),
          inArray(
            schema.payments.householdId,
            userHouseholds.map((h) => h.id),
          ),
        ),
      )
      .returning();

    if (updated) {
      // reset the payments cache
      getCurrentPayments().refresh();
      // reset the cache for this specific payment
      getPayment(data.paymentId).refresh();
      // reset the grouped cache
      getCurrentPaymentsByHousehold.refresh();
      return updated;
    }
    return null;
  },
);

export const getPaymentHistoryMonths = query(async () => {
  const userHouseholds = await getUserHouseholds();
  return (
    db
      .selectDistinct({
        month:
          sql<string>`date_trunc('month', ${schema.payments.forMonthD})::timestamp at time zone 'UTC'`.mapWith(
            schema.payments.forMonthD,
          ),
      })
      .from(schema.payments)
      .where(
        inArray(
          schema.payments.householdId,
          userHouseholds.map((h) => h.id),
        ),
      )
      // Used to get the fields
      .orderBy((fields) => desc(fields.month))
  );
});