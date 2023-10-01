
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  locals.supabase.auth.signOut();
  throw redirect(300, '/');
}
