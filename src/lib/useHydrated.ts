import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false on the server render and during hydration (it uses the server snapshot,
// so the client's first render matches the pre-rendered HTML); true on the
// re-render React does right after hydrating, and always on client-only renders.
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
