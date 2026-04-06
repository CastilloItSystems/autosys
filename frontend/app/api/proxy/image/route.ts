import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Only allow R2/storage URLs to prevent SSRF, also allow own domain
  const allowedHosts = [
    process.env.R2_PUBLIC_URL,
    process.env.NEXT_PUBLIC_R2_URL,
    "r2.cloudflarestorage.com",
    "pub-",
    "castilloitsystems.com",
  ].filter(Boolean);

  const requestOrigin = req.headers.get("origin") || req.nextUrl.origin;

  const isAllowed =
    allowedHosts.some((host) => url.includes(host!)) ||
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith(requestOrigin) ||
    url.startsWith("/"); // In case some relative URL still passes

  if (!isAllowed) {
    console.warn(`Proxy rejected URL: ${url}`);
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    // Si la URL sigue siendo relativa (inicia con /), hacerla absoluta para node-fetch
    const finalUrl = url.startsWith("/") ? `${requestOrigin}${url}` : url;

    console.log(`[Proxy Image] Fetching: ${finalUrl}`);
    const response = await fetch(finalUrl);
    if (!response.ok) {
      console.error(
        `[Proxy Image] Failed to fetch image. Status: ${response.status}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status },
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error("[Proxy Image] Exception:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 },
    );
  }
}
