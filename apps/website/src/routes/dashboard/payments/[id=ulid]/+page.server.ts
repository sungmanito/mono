import { db } from '$lib/server/db/client.js';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();

  // Validate the session
  if (!validateUserSession(session)) error(401);

  // Grab the user's households.
  const userHouseholds = locals.userHouseholds;

  const payment = await db.query.payments.findFirst({
    with: {
      household: true,
      proofRef: true,
      payee: true,
      bill: true,
    },
    // Need this to have some shenanigans forthe image later on.
    extras(_, { sql }) {
      return {
        paymentImageUrl: sql<string>`''`.as('payment_image_url'),
      };
    },
    where(fields, { and, eq, inArray }) {
      return and(
        eq(fields.id, params.id),
        inArray(
          fields.householdId,
          userHouseholds.map((uh) => uh.households.id),
        ),
      );
    },
  });

  if (payment?.proofImage && payment.proofRef) {
    const {
      data: { publicUrl },
    } = locals.supabase.storage
      .from(payment.proofRef.bucketId)
      .getPublicUrl(payment?.proofRef?.name);
    payment.paymentImageUrl = publicUrl;
  }

  // Throw a 404 error if we do not have a payment option.
  if (!payment) error(404);

  console.info(payment);

  // Return the payment for this page.
  return {
    payment,
  };
};
