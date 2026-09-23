# Sitio web de CAMABAR C.A.

Landing page de CAMABAR, concesionario autorizado Iveco en Barcelona, Anzoátegui.
Next.js con exportación estática: cada página se genera como HTML completo, que es
lo que los buscadores indexan, y se publica en Cloudflare Pages sin servidor.

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| Dominio del sitio, teléfonos, correo, WhatsApp | `src/config/site.ts` |
| Textos de la página | `src/app/page.tsx` |
| Título y descripción para Google, datos estructurados | `src/app/layout.tsx` |
| Colores y tipografía | `src/app/globals.css` |
| Tablero de instrumentos | `src/components/Tablero.tsx` |

Todo texto nuevo debe salir de CAMABAR. La fuente autorizada está en
`content/fuente-camabar.md`: no se publican cifras, testimonios ni datos sin confirmar.

## Trabajar en local

```bash
npm install
npm run dev
```

Queda en http://localhost:3100. Para ver exactamente lo que se publicará:

```bash
npm run build
npm start
```

## Publicar en Cloudflare Pages

La cuenta de Cloudflare es del cliente (`Camabariveco@gmail.com`).

### Opción A: conectado a GitHub (se actualiza solo en cada cambio)

En Cloudflare: **Workers & Pages > Create > Pages > Connect to Git**, elegir el repositorio
y configurar:

| Campo | Valor |
|---|---|
| Framework preset | Next.js (Static HTML Export) |
| Root directory | `landing` |
| Build command | `npm run build` |
| Build output directory | `out` |
| Variable `NODE_VERSION` | `22` |
| Variable `NEXT_PUBLIC_SITE_URL` | la URL pública, por ejemplo `https://camabar.pages.dev` |

### Opción B: subida directa desde esta máquina

```bash
npm run build
```

```bash
npx wrangler pages deploy out --project-name camabar
```

## Cuando CAMABAR tenga dominio propio

1. En Cloudflare Pages: **Custom domains > Set up a domain**.
2. Cambiar la variable `NEXT_PUBLIC_SITE_URL` al dominio nuevo.
3. Volver a desplegar. Con eso se actualizan la dirección canónica, el sitemap,
   `robots.txt` y la imagen para compartir en redes.
4. Registrar el dominio en Google Search Console y enviar `/sitemap.xml`.

## Pendiente de confirmar con el cliente

- Qué celular atiende WhatsApp, y si repuestos y taller van a números distintos.
- Dirección exacta y horario: hoy la página solo dice "Barcelona, estado Anzoátegui".
- Redes sociales.
- Archivo vectorial original del logotipo. El actual se recortó de la foto de perfil de Instagram.
- Fotografías reales del taller y del almacén.

## Imágenes

Ninguna imagen es generada por IA. El logotipo y los íconos salen del logo del cliente, en
`brand-source/`. La imagen para redes (`public/og.png`) se regenera con:

```bash
python brand-source/generar-og.py
```
