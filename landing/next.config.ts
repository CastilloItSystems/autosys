import type { NextConfig } from 'next'

/**
 * Exportación estática: `next build` genera en `out/` HTML completo por página,
 * que los buscadores indexan sin ejecutar JavaScript. Esa carpeta se sube tal
 * cual a Cloudflare Pages; no hay servidor.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // La optimización de imágenes de Next necesita servidor; en export se sirven tal cual.
  images: { unoptimized: true },
  poweredByHeader: false,
}

export default nextConfig
