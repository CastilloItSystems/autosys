import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CAMABAR, concesionario Iveco',
    short_name: 'CAMABAR',
    description: 'Repuestos originales y taller autorizado Iveco en Barcelona, Anzoátegui.',
    lang: 'es-VE',
    start_url: '/',
    display: 'browser',
    background_color: '#fcfcfc',
    theme_color: '#286cc8',
    icons: [
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
