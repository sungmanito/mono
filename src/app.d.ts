// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { getUserHouseholds } from '$lib/server/actions/households.actions';
import { SupabaseClient, type Session } from '@supabase/supabase-js';
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient;
      getSession: () => Promise<Session | null>;
      config: { is_live: boolean };
      userHouseholds: Awaited<ReturnType<typeof getUserHouseholds>>;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
