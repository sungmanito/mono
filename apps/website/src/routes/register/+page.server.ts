import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const actions = {
  saveSession: async ({ locals }) => {
    locals.supabase.auth.updateUser({
      password: 'some very secure password',
    });
  },
};

export const load = async ({ locals }) => {
  if (!locals.config.allow_registration || !dev) {
    redirect(307, '/');
  }
  return {
    enabled: locals.config.allow_registration || dev,
  };
};
