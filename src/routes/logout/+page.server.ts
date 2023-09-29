
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  console.info('hi jim');
  locals.supabase.auth.signOut();
  throw redirect(300, '/');
}