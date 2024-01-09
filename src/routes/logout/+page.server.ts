
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  await invalidateAll();
  throw redirect(300, '/');
}
