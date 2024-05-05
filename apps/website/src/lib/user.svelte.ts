import type { User } from '@supabase/supabase-js';

export const user = $state<User | null>(null);
