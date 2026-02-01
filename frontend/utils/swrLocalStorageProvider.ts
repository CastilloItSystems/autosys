export function localStorageProvider() {
  // Si no estamos en el navegador, usa un Map vacío
  if (typeof window === "undefined") {
    return new Map<string, any>();
  }

  // Inicializa el cache desde localStorage
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem("swr-cache") || "[]")
  );

  // Guarda el cache en localStorage cada vez que cambie
  window.addEventListener("beforeunload", () => {
    const arr = Array.from(map.entries());
    localStorage.setItem("swr-cache", JSON.stringify(arr));
  });

  return map;
}
