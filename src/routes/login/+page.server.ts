import type { AuthTokenResponse } from '@supabase/supabase-js';
import type { Actions } from './$types';
import { invalidate } from '$app/navigation';

export const actions = {
  saveLogin: async ({ request, locals }) => {
    const json = await request.json() as AuthTokenResponse['data'];
    await locals.supabase.auth.setSession({
      access_token: json.session?.access_token || '',
      refresh_token: json.session?.refresh_token || ''
    });
    invalidate('/');
  }
} satisfies Actions;