import { dev } from '$app/environment';
import { validateFormData } from '@jhecht/arktype-utils';
import { fail, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { notNull } from '$lib/util/validation';

export const actions = {
  register: async ({ locals, request }) => {
    const validator = type({
      email: 'string.email',
      password: 'string>=8',
      'password-confirm': 'string>=8',
      'given?': 'string',
    });
    let data: typeof validator.infer | null = null;
    try {
      data = validateFormData(await request.formData(), validator);
    } catch (problems) {
      if (problems) {
        console.error(problems);
        return fail(400);
      }
    }

    if (!notNull(data)) {
      return fail(400);
    }

    if (data.password !== data['password-confirm']) {
      return fail(400, {
        error: 'passwords do not match',
      });
    }

    const { data: result, error } = await locals.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display: data.given || null,
        },
        emailRedirectTo: 'http://localhost:5173/login',
      },
    });

    if (error) {
      console.error('ERROR', error);
      return fail(400);
    }

    console.info(result);
    return {
      success: true,
      user: result,
    };
  },
};

export const load = async ({ locals }) => {
  if (!locals.config.allow_registration && !dev) {
    redirect(307, '/');
  }
  return {
    enabled: locals.config.allow_registration || dev,
  };
};
