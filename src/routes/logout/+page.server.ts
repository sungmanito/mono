
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  throw redirect(300, '/');
}
