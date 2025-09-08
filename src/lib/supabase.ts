import { createClient } from '@supabase/supabase-js'

// Use Vite-exposed env vars (VITE_ prefix) for client-side usage
const supabaseUrl =
  typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL
const supabaseKey =
  typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_SUPABASE_KEY
    : process.env.VITE_SUPABASE_KEY

// Export supabase as a top-level constant. We create either a mock proxy or the real client.
export const supabase = (() => {
  if (!supabaseUrl || !supabaseKey) {
    // Fallback mock (keeps previous behavior when env vars are not set)
    const handler = {
      get(target: any, prop: any) {
        if (prop in target) {
          return target[prop]
        }
        const fn = () => new Proxy({}, handler)
        return new Proxy(fn, handler)
      },
      apply(target: any, thisArg: any, args: any) {
        return new Proxy({}, handler)
      },
    }

    const supabaseMock = new Proxy({}, handler)
    return supabaseMock as any
  }

  // Create and return the real Supabase client
  return createClient(supabaseUrl as string, supabaseKey as string)
})()
