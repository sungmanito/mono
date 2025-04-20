import { validateFormData } from '@jhecht/arktype-utils';
import { fail } from '@sveltejs/kit';
import { type } from 'arktype';

export const actions = {
  forget: async ({ request, url, locals }) => {
    const fd = validateFormData(
      await request.formData(),
      type({
        email: 'string.email',
      }),
    );

    const { error: err } = await locals.supabase.auth.resetPasswordForEmail(
      fd.email,
      {
        redirectTo: `${url.protocol}//${url.host}/login`,
      },
    );

    if (err) return fail(400);

    return fail(400);
  },
  code: async ({ url }) => {
    console.info(url.searchParams.get('code'));
    return fail(400);
  },
};
