export const load = async ({ locals }) => {
  await locals.supabase.auth.signOut();
  // redirect(303, '/');
};
