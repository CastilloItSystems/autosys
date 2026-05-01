export const resolveImageUrl = (url: string): string => {
  let absoluteUrl = url;

  if (url.startsWith("/")) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api";
    const backendRoot = apiBase.replace(/\/api\/?$/, "");
    absoluteUrl = `${backendRoot}${url}`;
  }

  if (
    typeof window !== "undefined" &&
    (url.startsWith("/templates") ||
      url.startsWith("/images") ||
      url.startsWith("/logo") ||
      url.startsWith("/favicon"))
  ) {
    absoluteUrl = `${window.location.origin}${url}`;
  }

  if (absoluteUrl.includes("localhost")) {
    absoluteUrl = absoluteUrl.replace("localhost", "127.0.0.1");
  }

  return absoluteUrl;
};

export const urlToBase64ViaProxy = async (
  url: string,
): Promise<string | null> => {
  try {
    const absoluteUrl = resolveImageUrl(url);
    const res = await fetch(
      `/api/proxy/image?url=${encodeURIComponent(absoluteUrl)}`,
    );

    if (!res.ok) {
      console.warn(`Proxy falló para ${absoluteUrl}:`, res.statusText);
      return null;
    }

    const { dataUrl } = (await res.json()) as { dataUrl?: string | null };
    return dataUrl ?? null;
  } catch (error) {
    console.error("Error convirtiendo a base64:", error);
    return null;
  }
};
