import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

export const actions = {
  updateProfile: async ({ locals, request }) => {
    
    const session = await locals.getSession();
    if(!validateUserSession(session)) throw error(401);

    const data = await request.formData();
    console.info(data);
    
    return {}
  },
};

export const ssr = false;