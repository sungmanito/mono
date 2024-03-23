import { fail, redirect } from '@sveltejs/kit';
import { allowedImageTypes } from '$lib/util/images';
import { type } from 'arktype';
import { validateFormData } from '$lib/util/formData.js';
import { dev } from '$app/environment';

export const load = async ({ locals: { config } }) => {
  if (!dev || !config.allow_registration) {
    redirect(307, '/');
  }
  return {
    enabled: dev || !!config.allow_registration,
  };
};

export const actions = {
  signup: async ({ request, locals: { supabase, config }, fetch, url }) => {
    if (!config.allow_registration)
      return fail(400, {
        message: 'Signup disabled',
      });
    const data = validateFormData(
      await request.formData(),
      type({
        email: 'email',
        password: 'string>=8',
        password_confirm: 'string>=8',
        'avatar_url?': 'string',
        'name?': 'string',
      }),
    );

    // Validate the avatar URL

    if (data.avatar_url) {
      const image = await fetch(data.avatar_url);

      if (!allowedImageTypes.has(image.headers.get('content-type') || '')) {
        return fail(400, {
          message: `Unallowed image type ${image.headers.get('content-type')}`,
        });
      }

      const size = Number(image.headers.get('content-length'));

      if (isNaN(size) || size > 30 * 1024) {
        return fail(403, {
          message: 'Image must be less than 30kb',
        });
      }
    }

    const { data: response, error: err } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${url.protocol}//${url.host}/login`,
        data: {
          name: data.name,
          avatar_url: data.avatar_url,
        },
      },
    });

    if (err) return fail(400, { message: err.message });

    return response;
  },
};
