import { dev } from '$app/environment';
import { validateFormData } from '$lib/util/formData';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { type } from 'arktype';

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
      password: 'string',
    });

    let userInfo: typeof validator.infer;

    try {
      userInfo = validateFormData(await request.formData(), validator);
    } catch (e) {
      console.error('Failed validation', e);
      return fail(400);
    }

    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: userInfo.username,
      password: userInfo.password,
    });

    if (error !== null) {
      console.error('SUPABASE AUTH FAILED', error);
      return fail(400);
    }

    await locals.supabase.auth.setSession(data.session);

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  },
  'login-with-google': async ({ url, locals }) => {
    if (!locals.config.allow_registration && !dev) return fail(400);

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
