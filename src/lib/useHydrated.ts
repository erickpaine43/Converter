import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false en el render de servidor y durante la hidratación (usa el snapshot de
// servidor, así el primer render del cliente calza con el HTML pre-renderizado);
// true en el re-render que React hace apenas termina de hidratar, y siempre en
// renders puramente de cliente.
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
