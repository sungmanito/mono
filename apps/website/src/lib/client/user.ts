import { readable } from 'svelte/store';
import client from './supabase';
import type { User } from '@supabase/supabase-js';

export const user = readable<User | null>(null, (set) => {
  client.auth
    .getSession()
    .then((r) => console.info(r))
    .catch(console.error);
  client.auth
    .getUser()
    .then((u) => {
      // Grab the user
      if (u.error) throw u.error;
      set(u.data.user);
    })
    .catch(console.error);

  // Setup event listeners

  client.auth.onAuthStateChange((ev, session) => {
    console.info('Auth event called');
    if (ev === 'SIGNED_IN' && session && session.user) {
      set(session.user);
    } else if (ev === 'SIGNED_OUT') {
      set(null);
    } else if (ev === 'TOKEN_REFRESHED' && session?.user) {
      set(session.user);
    }
  });
});
