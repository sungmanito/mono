export const actions = {
  saveSession: async ({ locals }) => {
    locals.supabase.auth.updateUser({
      password: 'some very secure password'
    });
  }
}

export const load = async () => {
  return {};
}