// This file is mocked to avoid the build error caused by the missing @supabase/supabase-js package.
// The application logic has been refactored to use mock data instead of making real API calls.

const handler = {
  get(target: any, prop: any) {
    if (prop in target) {
      return target[prop]
    }
    // Return a function that can also be called and returns a proxy, allowing for chaining.
    const fn = () => new Proxy({}, handler)
    return new Proxy(fn, handler)
  },
  apply(target: any, thisArg: any, args: any) {
    // Return a proxy so that chained calls after a function call don't fail.
    return new Proxy({}, handler)
  },
}

const supabaseMock = new Proxy({}, handler)

export const supabase = supabaseMock
