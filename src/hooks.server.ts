import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { getAll } from '@vercel/edge-config';
import { EDGE_CONFIG } from '$env/static/private';
import { getUserHouseholds } from '$lib/server/actions/households.actions';
import { validateUserSession } from '$lib/util/session';

// Little bit of tricksy shenanigans since we don't use .env around these parts,
// but the vercel 
process.env.EDGE_CONFIG = EDGE_CONFIG;

export const handle: Handle = async ({ event, resolve }) => {
  /**
   * Creates a supabase server client using some ENV variables.
   */
  const supabase = createSupabaseServerClient({
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
    event,
  });

  event.locals.config = await getAll<{is_live: boolean}>();

  // Passes this on to the locals
  event.locals.supabase = supabase;

  // Wrapper function
  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  const session = await event.locals.getSession();
  
  if(validateUserSession(session)) {
    event.locals.userHouseholds = await getUserHouseholds(session.user.id);
  } else {
    event.locals.userHouseholds = [];
  }


  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range'
    }
  });
}