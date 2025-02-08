import { dev } from '$app/environment';
import { validateFormData } from '@jhecht/arktype-utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import type { Actions } from './$types';

export const load = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  if (code) {
    const { data: session, error: err } =
      await locals.supabase.auth.exchangeCodeForSession(code);

    if (err) error(400, { message: err.message });

    if (session) {
      redirect(303, '/profile?flow=update-password');
    }

    return {
      session,
      enabled: locals.config.allow_registration,
    };
  }
  return {
    enabled: locals.config.allow_registration || dev,
  };
};

export const actions = {
  saveLogin: async ({ request, locals }) => {
    const validator = type({
      username: 'string',
      password: 'string>=8',
    });

    let data: typeof validator.infer;

    try {
      data = validateFormData(await request.formData(), validator);
    } catch (e) {
      console.error('FORM VALIDATION FAILS', e);
      return fail(400);
    }

    const { data: session, error: err } =
      await locals.supabase.auth.signInWithPassword({
        email: data.username,
        password: data.password,
      });

    if (err) return fail(400, { message: err.message });

    return {
      success: true,
      session,
    };
  },
  'login-with-google': async ({ url, locals }) => {
    if (!locals.config.allow_registration && !dev) return fail(401);
    const { data, error: err } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${url.protocol}//${url.host}/auth/callback`,
        queryParams: {
          next: '/dashboard',
        },
      },
    });

    if (err) {
      console.error(err);
      return fail(400, {
        message: 'Supabase angy',
      });
    }

    redirect(303, data.url);
  },
} satisfies Actions;
