import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE } from '$env/static/private';
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { getAll } from '@vercel/edge-config';
import { EDGE_CONFIG } from '$env/static/private';
import { getUserHouseholds } from '$lib/server/actions/households.actions';
import { validateUserSession } from '$lib/util/session';

Sentry.init({
  dsn: 'https://9db800c9bbef384d6a68668ae0f68235@o4506608178102272.ingest.sentry.io/4506608184131584',
  tracesSampleRate: 1,
});

// Little bit of tricksy shenanigans since we don't use .env around these parts,
// but the vercel
process.env.EDGE_CONFIG = EDGE_CONFIG;

export const handle: Handle = sequence(
  Sentry.sentryHandle(),
  async ({ event, resolve }) => {
    /**
     * Creates a supabase server client using some ENV variables.
     * This is an admin-level client, so be careful when calling any deletes.
     */
    const supabase = createServerClient(
      PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE,
      {
        cookies: {
          get: (key) => event.cookies.get(key),
          set: (key, value, options) => {
            event.cookies.set(key, value, options);
          },
          remove: (key, options) => {
            event.cookies.delete(key, options);
          },
        },
      },
    );

    /**
     * This is from the Vercel Edge Config
     */
    event.locals.config = await getAll<App.VercelConfig>();

    // Passes this on to the locals so that load functions can use it later
    event.locals.supabase = supabase;

    // Wrapper function to make getting the user session easier
    event.locals.getSession = async () => {
      const {
        data: { session },
      } = await event.locals.supabase.auth.getSession();
      return session;
    };

    const session = await event.locals.getSession();

    // Quick and easy way to protect the dashboard.
    if (session === null && event.url.pathname.startsWith('/dashboard')) {
      throw redirect(303, `/login?url=${event.url.pathname}`);
    }

    // We are gathering the logged in users' households a lot
    // To hopefully save that, we store them in the locals.
    if (validateUserSession(session)) {
      console.info('Gathering user households');
      event.locals.userHouseholds = await getUserHouseholds(session.user.id);
    } else {
      event.locals.userHouseholds = [];
    }

    return resolve(event, {
      filterSerializedResponseHeaders(name) {
        return name === 'content-range';
      },
    });
  },
);
export const handleError = Sentry.handleErrorWithSentry();
