// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { getUserHouseholds } from '$lib/server/actions/households.actions';
import { SupabaseClient, type Session } from '@supabase/supabase-js';
import type { PostHog } from 'posthog-node';
declare global {
  namespace App {
    interface VercelConfig {
      is_live: boolean;
      allow_registration: boolean;
    }
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient;
      getSession: () => Promise<Session | null>;
      config: VercelConfig;
      userHouseholds: Awaited<ReturnType<typeof getUserHouseholds>>;
      posthog: PostHog;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
