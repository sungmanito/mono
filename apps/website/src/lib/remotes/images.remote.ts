import { command, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { type } from 'arktype';
import { PAYMENT_BUCKET_NAME } from '$env/static/private';
import { ulidValidator } from '$lib/typesValidators';
import { error } from '@sveltejs/kit';

/**
 * @description Given a path, fetch the image ID from the database
 */
export const getImageIdByPath = query(type('string'), async (path) => {
  const image = await db.query.objects.findFirst({
    where: ({ bucketId, name }, { eq, and }) =>
      and(eq(bucketId, PAYMENT_BUCKET_NAME), eq(name, path)),
    columns: {
      id: true,
    },
  });
  return image?.id;
});

/**
 * @description Remove an image by its path
 */
export const removeImageByPath = command(ulidValidator, async (id) => {
  const event = await getRequestEvent();
  const res = await event.locals.supabase.storage
    .from(PAYMENT_BUCKET_NAME)
    .remove([]);

  if (res.error) {
    console.error('Failed to remove image from storage:', res.error);
    error(500, 'Failed to remove image from storage');
  }
});
