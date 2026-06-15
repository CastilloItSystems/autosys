// Subir esta versión invalida el cache persistido (p.ej. al cambiar el shape
// de respuestas de la API), evitando hydration mismatches con datos viejos.
const SWR_CACHE_VERSION = "1";
const SWR_CACHE_KEY = "swr-cache";
const SWR_CACHE_VERSION_KEY = "swr-cache-version";

export function localStorageProvider() {
  // Si no estamos en el navegador, usa un Map vacío
  if (typeof window === "undefined") {
    return new Map<string, any>();
  }

  // Purga el cache si la versión no coincide
  if (localStorage.getItem(SWR_CACHE_VERSION_KEY) !== SWR_CACHE_VERSION) {
    localStorage.removeItem(SWR_CACHE_KEY);
    localStorage.setItem(SWR_CACHE_VERSION_KEY, SWR_CACHE_VERSION);
  }

  // Inicializa el cache desde localStorage (tolerante a JSON corrupto)
  let entries: [string, any][] = [];
  try {
    entries = JSON.parse(localStorage.getItem(SWR_CACHE_KEY) || "[]");
  } catch {
    localStorage.removeItem(SWR_CACHE_KEY);
  }
  const map = new Map<string, any>(entries);

  // Guarda el cache en localStorage cada vez que cambie
  window.addEventListener("beforeunload", () => {
    const arr = Array.from(map.entries());
    localStorage.setItem(SWR_CACHE_KEY, JSON.stringify(arr));
  });

  return map;
}
