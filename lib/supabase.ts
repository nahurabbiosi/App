import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Database } from '@/types/database';

// ⚠️ Credenciales configuradas
const supabaseUrl = 'https://fftxllgmqmjrgnnzwhda.supabase.co';
const supabaseAnonKey = 'sb_publishable_93mV9Hdm1dj7M6WhknphsQ_r0tDVJ_P';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Inicia sesión con Google usando Supabase OAuth + Expo AuthSession.
 * Requiere configurar Google como proveedor en Supabase Dashboard > Auth > Providers.
 */
export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No se obtuvo URL de autenticación');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    // Los tokens vienen en el fragment (#) de la URL de redirect
    const hashParams = result.url.split('#')[1];
    if (hashParams) {
      const params = new URLSearchParams(hashParams);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    }
  }
}
