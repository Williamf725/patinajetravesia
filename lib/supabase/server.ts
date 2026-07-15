import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return 'https://placeholder.supabase.co';
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key && key !== 'your-anon-key' && key.trim() !== '') {
    return key;
  }
  return 'placeholder';
};

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Keep createClient as an alias for backward compatibility for now, but mark it deprecated if possible or just export it.
export const createClient = createServerClient;
