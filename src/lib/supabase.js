// src/lib/supabase.js
//
// Supabase is used ONLY as the OAuth identity provider (Google / GitHub).
// The app's real session is still the HttpOnly cookie set by our own server:
// AuthCallbackPage trades the Supabase access token for that cookie via
// POST /api/auth/supabase/session, then drops the Supabase session again.
//
// persistSession is left at its default (true) on purpose: PKCE stores a code
// verifier in storage before redirecting to the provider, and it must survive
// that full-page redirect or the code exchange on /auth/callback fails.
// (The server uses persistSession: false because it never redirects anywhere.)
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set: Google and GitHub sign-in are hidden.",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        // AuthCallbackPage exchanges the ?code= itself, exactly once
        detectSessionInUrl: false,
        // the Supabase session is thrown away right after the exchange
        autoRefreshToken: false,
      },
    })
  : null;