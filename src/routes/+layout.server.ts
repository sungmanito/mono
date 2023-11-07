export const load = async ({ locals }) => {
  const { data: {
    user
  }, error } = await locals.supabase.auth.getUser()

  if(error) console.error(error);
  
  return {
    user: user || undefined,
    session: locals.getSession() || {},
  };
}