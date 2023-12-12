import type { Session } from '@supabase/supabase-js';

export function validateUserSession(session: Session | null): session is Session {
  return session !== null;
}
