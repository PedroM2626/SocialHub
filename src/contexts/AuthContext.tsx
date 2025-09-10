// Always attempt a background sync on app load (push any anonymous fallbacks)
  useEffect(() => {
    try {
      syncLocalToSupabase().catch((e) =>
        console.warn('[Auth] syncLocalToSupabase (anonymous) failed', e),
      )
    } catch (e) {}
  }, [])
