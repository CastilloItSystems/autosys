# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, por requerimiento del usuario, con SEO óptimo y despliegue en el Cloudflare Pages del cliente
(cuenta asociada a Camabariveco@gmail.com).

Delegado dentro de React: **Next.js (App Router) con `output: 'export'`**. Cada página se prerenderiza a
HTML estático completo, que es lo que los buscadores indexan sin ejecutar JavaScript, y la carpeta `out/`
se sube tal cual a Cloudflare Pages sin servidor. Se eligió Next.js porque el equipo ya mantiene Next.js en
`frontend/` del mismo monorepo.

## Users

- **Transportistas y flotas** con camiones Iveco (pesados, medianos y livianos) del oriente venezolano:
  dueños de flota, jefes de mantenimiento y choferes-propietarios. Llegan buscando un repuesto original
  concreto o un taller autorizado para una falla, con el vehículo parado o por parar, y el tiempo detenido
  les cuesta dinero.
- **Aseguradoras y sus asegurados**, para latonería y pintura tras un siniestro.

## Product Purpose

Sitio web de CAMABAR C.A. Convierte a quien busca repuestos Iveco o taller autorizado en el oriente del
país en un contacto directo con la empresa. Éxito = consultas de repuestos y solicitudes de servicio de
taller que llegan por WhatsApp o teléfono.

## Positioning

Concesionario autorizado Iveco, descrito por la propia empresa como el más grande y completo de la zona de
Oriente. Combina en un solo lugar repuestos originales, taller autorizado y servicios de respuesta rápida
que un taller genérico o una tienda de repuestos no ofrecen juntos: alquiler de partes mecánicas con
solución en menos de 8 horas, unidad móvil de servicio en carretera y entrega a domicilio en cuatro estados.

## Operating Context

- El visitante suele llegar desde el teléfono y desde Google, buscando por repuesto, falla o "taller Iveco".
- El contacto real ocurre por WhatsApp y por teléfono; no existe comercio en línea ni catálogo con precios.
- Cobertura de entrega: Anzoátegui, Monagas, Sucre y Nueva Esparta.
- Taller inscrito en aseguradoras del país (latonería y pintura con cobertura de siniestros).

## Capabilities and Constraints

- Dos acciones principales **con el mismo peso**: pedir repuestos y agendar servicio de taller.
- Sitio estático, sin backend: el contacto se resuelve con enlaces a WhatsApp, teléfono y correo.
- **Sin dominio propio por ahora**: se publica en `*.pages.dev`. La URL del sitio debe vivir en un único
  punto de configuración, porque de ella dependen la dirección canónica, el sitemap y las etiquetas sociales.
- Idioma: español de Venezuela (`es-VE`).
- Pendiente de confirmar: dirección física exacta, horario de atención, redes sociales. No se inventan.
- El Chatbot de Servicios del contrato con Castillo IT Systems se integrará en este sitio más adelante.

## Brand Commitments

- Nombre: **CAMABAR C.A.** (razón social: Camiones y Maquinarias Barcelona, C.A., RIF J-30846726-0).
- Concesionario autorizado **Iveco**. Se puede nombrar la marca como hecho comercial; no se usan logotipos
  ni recursos gráficos de Iveco sin autorización expresa.
- Lema: "Un taller de calidad es garantía de trabajos de calidad".
- Frases propias: "Cuide su motor, use repuestos 100% originales" y "Siempre tenemos la oportunidad de mejorar".
- Valores: Compromiso ("Somos responsables de lo que hacemos") y Confiabilidad ("Cumplimos nuestras promesas").
- **Logotipo**: palabra CAMABAR en azul, en una sans geométrica extendida con una C de terminales en
  diagonal, sobre la palabra IVECO en negro y una raya azul a la izquierda. Original recibido como foto de
  perfil de Instagram (`brand-source/logo-camabar-instagram-original.jpg`). El aro degradado y el fondo gris
  oscuro son el marco de Instagram, **no la marca**: no se usan. Versión recortada y transparente en
  `public/brand/camabar-iveco.png`; se usa solo sobre blanco. Pedir al cliente el archivo vectorial original.
- **Colores de marca**, medidos del logotipo: azul CAMABAR `#286CC8`, negro `#000000`, blanco `#FCFCFC`.
  El usuario pidió que la paleta y el contraste de la landing se deriven del logo. Contrastes medidos: azul
  sobre blanco 5,03:1 (AA); el azul sobre fondo oscuro da 3,48:1, así que el texto sobre oscuro usa un
  tinte del mismo azul.

## Evidence on Hand

Fuente: correo de la Sra. Lissette Lara, Gerente de CAMABAR C.A. (29 de julio), transcrito en
`landing/content/fuente-camabar.md`.

- Más de 25 años de experiencia en transporte pesado, mediano y liviano.
- Más de 3.000 m² de taller y 3.000 m² de estacionamiento, con oficinas, área de exhibición, almacén y despacho.
- Servicios: repuestos, accesorios y lubricantes originales; mano de obra especializada; taller autorizado;
  mantenimiento preventivo y correctivo; latonería y pintura; alquiler de partes (solución en menos de
  8 horas); servicio en carretera con unidad móvil; entrega a domicilio.
- Contacto: teléfonos 0281-274.65.99, 0281-274.65.82, 0281-274.51.88; celulares 0414-809.36.51 y
  0424-847.87.47; correos camabar.rep.serv.admon@gmail.com y lizetlara@hotmail.com (alternativo).

**No existen y no se fabrican:** fotografías reales (solo habrá logo), testimonios, cifras de clientes o
ventas, reseñas, precios, dirección exacta, horario.

## Product Principles

1. **El camión parado es el problema.** Cada sección responde a cuánto tarda CAMABAR en devolver el
   vehículo a la vía.
2. **Contactar en un toque.** Desde cualquier punto de la página, el visitante está a un toque de WhatsApp
   o de una llamada, para repuestos o para taller.
3. **Solo afirmaciones del cliente.** Todo dato proviene de CAMABAR; lo que falta se deja pendiente, no se rellena.
4. **Rápido en teléfonos modestos y redes lentas.** El público está en la calle o en el taller, no en un escritorio.

## Accessibility & Inclusion

Pantallas pequeñas, conexión móvil irregular y lectura a pleno sol en taller o carretera: contraste alto,
texto legible sin zoom y blancos táctiles generosos. Objetivo WCAG 2.2 AA.
