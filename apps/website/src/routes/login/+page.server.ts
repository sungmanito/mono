import type { AuthTokenResponse } from '@supabase/supabase-js';
import type { Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

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
    const json = (await request.json()) as AuthTokenResponse['data'];
    await locals.supabase.auth.setSession({
      access_token: json.session?.access_token || '',
      refresh_token: json.session?.refresh_token || '',
    });

    return {
      success: true,
    };
  },
  'login-with-google': async ({ url, locals }) => {
    console.info(locals.config.allow_registration, dev);
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
