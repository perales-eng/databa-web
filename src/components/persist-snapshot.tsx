"use client";

import { usePersistSnapshot } from "@/lib/offline-client";

/**
 * Componente cliente que, en cada render online, persiste el `data` que recibe
 * bajo `cacheKey` en IndexedDB. Pensado para montarse dentro de páginas server
 * que ya cargan datos del DB — así esa misma data queda disponible offline
 * para la próxima sesión.
 *
 * No renderiza nada.
 */
export function PersistSnapshot<T>({
  cacheKey,
  data,
}: {
  cacheKey: string;
  data: T;
}) {
  usePersistSnapshot(cacheKey, data);
  return null;
}
