import { redirect } from '@sveltejs/kit';

// Bills and Payments were merged into a single screen (SUN-16); this route
// now only exists to redirect users/bookmarks over to it. The `[id=ulid]`
// and `create` sub-routes are unaffected and still serve their own drawers.
export const load = async () => {
  redirect(308, '/dashboard/bills');
};
