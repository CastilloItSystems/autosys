/**
 * Único punto de configuración del sitio.
 *
 * SITE_URL: mientras CAMABAR no tenga dominio propio se publica en Cloudflare
 * Pages (*.pages.dev). De esta URL dependen la dirección canónica, el sitemap,
 * robots.txt y las etiquetas para compartir en redes: al contratar el dominio,
 * basta con definir NEXT_PUBLIC_SITE_URL en Cloudflare y volver a desplegar.
 *
 * Todos los datos de contacto provienen del correo de la Sra. Lissette Lara,
 * Gerente (ver content/fuente-camabar.md). No se agregan datos sin confirmar.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://camabar.pages.dev').replace(/\/$/, '')

export const empresa = {
  nombre: 'CAMABAR',
  razonSocial: 'Camiones y Maquinarias Barcelona, C.A.',
  rif: 'J-30846726-0',
  ciudad: 'Barcelona',
  estado: 'Anzoátegui',
  pais: 'VE',
  cobertura: ['Anzoátegui', 'Monagas', 'Sucre', 'Nueva Esparta'],
  correo: 'camabar.rep.serv.admon@gmail.com',
  /**
   * PENDIENTE DE CONFIRMAR con el cliente. Mientras estén vacíos no se muestran:
   * la página no publica datos que CAMABAR no haya dado. Al completarlos aparecen
   * solos en Contacto.
   */
  direccion: null as string | null, // p. ej. 'Av. ..., Barcelona, Anzoátegui'
  horario: null as string | null, // p. ej. 'Lunes a viernes, 7:30 a. m. a 5:00 p. m.'
  redes: [] as { nombre: string; url: string }[], // p. ej. { nombre: 'Instagram', url: '...' }
}

export type Telefono = { mostrar: string; e164: string }

export const telefonosFijos: Telefono[] = [
  { mostrar: '0281-274.65.99', e164: '+582812746599' },
  { mostrar: '0281-274.65.82', e164: '+582812746582' },
  { mostrar: '0281-274.51.88', e164: '+582812745188' },
]

export const celulares: Telefono[] = [
  { mostrar: '0414-809.36.51', e164: '+584148093651' },
  { mostrar: '0424-847.87.47', e164: '+584248478747' },
]

/**
 * WhatsApp. Las dos acciones principales tienen el mismo peso y abren la misma
 * línea, cada una con su mensaje ya escrito, para que CAMABAR sepa de inmediato
 * si es una consulta de repuestos o de taller.
 * PENDIENTE DE CONFIRMAR con el cliente: qué celular atiende WhatsApp y si
 * repuestos y taller deben ir a números distintos.
 */
const WHATSAPP = '584148093651'

const wa = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`

export const acciones = {
  repuestos: {
    etiqueta: 'Pedir repuestos',
    href: wa('Hola CAMABAR, necesito un repuesto para mi Iveco. Modelo y año: '),
  },
  taller: {
    etiqueta: 'Solicitar taller',
    href: wa('Hola CAMABAR, quiero llevar mi Iveco al taller. Modelo y falla: '),
  },
}

export const llamar = { etiqueta: 'Llamar', href: `tel:${telefonosFijos[0].e164}` }
