// Supabase-owned schemas (`auth`, `storage`). Re-exported for app/relation use,
// but kept out of `drizzle.config.ts`'s schema glob so they never appear in
// generated migrations or `db:push` diffs.
export * from './auth';
export * from './storage';
