import { validateFormData } from '$lib/util/formData.js';
import { fail } from '@sveltejs/kit';
import { type } from 'arktype';

export const actions = {
  forget: async ({ request, url, locals }) => {
    const fd = validateFormData(await request.formData(), type({
      email: 'email'
    }));

    const { data, error: err } = await locals.supabase.auth.resetPasswordForEmail(fd.email, {
      redirectTo: `${url.protocol}//${url.host}/login`
    });

    if(err) return fail(400);

    console.info(data);

    return fail(400);
  },
  code: async ({ request, url, locals }) => {
    console.info(url.searchParams.get('code'));
    console.info('hi you');
    return fail(400);
  }
}