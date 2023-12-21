import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, redirect } from '@sveltejs/kit';
import { type } from 'arktype';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif']);

export const actions = {
  updateProfile: async ({ locals, request, fetch }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw redirect(304, '/login');

    const data = formDataValidObject(
      await request.formData(),
      type({
        'avatar-url': 'string',
        name: 'string',
        email: 'email',
      }),
    );

    // Testing out the image just to see
    const image = await fetch(data['avatar-url']);

    // Grab the content length as a number
    const size = Number(image.headers.get('content-length'));

    console.info('Image size', size);
    // Thrw an error on size
    if (isNaN(size) || size > 30 * 1024)
      throw error(403, 'must be less than 30kb');
    // throw an error if we don't have an image
    if (!allowedImageTypes.has(image.headers.get('content-type') as string))
      throw error(403, 'Image is not a JPEG, PNG, or GIF');

    const r = await locals.supabase.auth.updateUser({
      email: data.email,
      data: {
        name: data.name,
        avatar_url: data['avatar-url'],
      },
    });

    if (r.error) throw error(422);

    return {
      user: r.data.user,
    };
  },
};

export const ssr = false;
