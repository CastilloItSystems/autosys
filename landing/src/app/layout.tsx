import type { Metadata, Viewport } from 'next'
import { Michroma, Saira } from 'next/font/google'
import { SITE_URL, empresa, telefonosFijos, celulares } from '@/config/site'
import './globals.css'

// Linaje Microgramma: la letra extendida de los tableros y del logotipo.
const michroma = Michroma({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-michroma',
})

// Cuadrada y legible, como los rótulos de un instrumento. Variable en peso y ancho.
const saira = Saira({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-saira',
  axes: ['wdth'],
})

const titulo = 'CAMABAR | Concesionario Iveco en Barcelona: repuestos y taller'
const descripcion =
  'Concesionario autorizado Iveco en Barcelona, Anzoátegui. Repuestos originales, taller autorizado, ' +
  'alquiler de partes, servicio en carretera y entrega a domicilio en el Oriente de Venezuela.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: titulo,
  description: descripcion,
  alternates: { canonical: '/' },
  applicationName: 'CAMABAR',
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: '/',
    siteName: 'CAMABAR',
    title: titulo,
    description: descripcion,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'CAMABAR, concesionario autorizado Iveco' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: titulo,
    description: descripcion,
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#286cc8',
  colorScheme: 'light',
}

/**
 * Datos estructurados (schema.org). Solo hechos confirmados por CAMABAR: no hay
 * calificaciones, reseñas ni horario, porque no existen o no están confirmados.
 */
const datosEstructurados = {
  '@context': 'https://schema.org',
  '@type': ['AutoRepair', 'AutoPartsStore'],
  '@id': `${SITE_URL}/#empresa`,
  name: 'CAMABAR',
  legalName: empresa.razonSocial,
  taxID: empresa.rif,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/icon-512.png`,
  image: `${SITE_URL}/og.png`,
  description: descripcion,
  slogan: 'Un taller de calidad es garantía de trabajos de calidad',
  email: empresa.correo,
  telephone: [...telefonosFijos, ...celulares].map((t) => t.e164),
  brand: { '@type': 'Brand', name: 'Iveco' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: empresa.ciudad,
    addressRegion: empresa.estado,
    addressCountry: empresa.pais,
  },
  areaServed: empresa.cobertura.map((e) => ({ '@type': 'State', name: e })),
  knowsAbout: [
    'Repuestos originales Iveco',
    'Mantenimiento preventivo y correctivo de camiones',
    'Latonería y pintura de vehículos de carga',
    'Servicio en carretera',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${michroma.variable} ${saira.variable}`}>
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        {children}
        <script
          type="application/ld+json"
          // Contenido generado a partir de constantes propias, no de datos del usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
        />
      </body>
    </html>
  )
}
