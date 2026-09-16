import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

function isValidHttpUrl(stringToTest: unknown): stringToTest is string {
  if (typeof stringToTest !== 'string') return false;
  const trimmed = stringToTest.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const DEFAULT_URL = 'https://fftxllgmqmjrgnnzwhda.supabase.co';
const DEFAULT_KEY = 'sb_publishable_93mV9Hdm1dj7M6WhknphsQ_r0tDVJ_P';

const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = isValidHttpUrl(envUrl) ? envUrl.trim() : DEFAULT_URL;
const supabaseAnonKey = typeof envKey === 'string' && envKey.trim().length > 0 ? envKey.trim() : DEFAULT_KEY;

let client: ReturnType<typeof createClient<Database>>;

try {
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.warn('[Supabase] Could not initialize client with provided URL, using fallback:', error);
  // Safe dummy fallback in case createClient fails
  const noOpChain = () => ({
    select: noOpChain,
    insert: noOpChain,
    update: noOpChain,
    delete: noOpChain,
    eq: noOpChain,
    gte: noOpChain,
    order: noOpChain,
    single: async () => ({ data: null, error: null }),
    then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
  });

  client = {
    from: noOpChain,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Modo offline') }),
      signUp: async () => ({ data: null, error: new Error('Modo offline') }),
      signOut: async () => ({ error: null }),
    },
  } as any;
}

export const supabase = client;
