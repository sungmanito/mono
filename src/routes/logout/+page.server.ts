
import { invalidateAll } from '$app/navigation';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  await invalidateAll();
  redirect(300, '/');
}
