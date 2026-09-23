import {
  IconBrandWhatsapp,
  IconHeadset,
  IconMail,
  IconMapPin,
  IconPhone,
  IconRoad,
} from '@tabler/icons-react'
import Cabecera from '@/components/Cabecera'
import Tablero from '@/components/Tablero'
import BarraMovil from '@/components/BarraMovil'
import { acciones, celulares, empresa, telefonosFijos } from '@/config/site'
import s from './page.module.css'

// Una línea por servicio, tomada de la fuente (content/fuente-camabar.md).
const serviciosTaller = [
  { nombre: 'Taller autorizado Iveco', texto: 'Un servicio óptimo, chequeando minuciosamente cada detalle.' },
  { nombre: 'Mano de obra especializada', texto: 'Diagnóstico, evaluación y reparación de su vehículo de carga.' },
  { nombre: 'Mantenimiento preventivo y correctivo', texto: 'Para no detener el movimiento de su inversión.' },
  { nombre: 'Latonería y pintura', texto: 'Inscritos en las aseguradoras más prestigiosas del país.' },
]

function BotonWhatsApp({ accion, variante }: { accion: 'repuestos' | 'taller'; variante?: 'claro' }) {
  const a = acciones[accion]
  return (
    <a
      href={a.href}
      target="_blank"
      rel="noopener"
      className={variante === 'claro' ? `${s.boton} ${s.botonClaro}` : s.boton}
      aria-label={`${a.etiqueta} por WhatsApp (se abre en otra ventana)`}
    >
      <IconBrandWhatsapp width={20} height={20} stroke={1.75} aria-hidden="true" />
      {a.etiqueta}
    </a>
  )
}

export default function Inicio() {
  return (
    <>
      <Cabecera />
      <main id="contenido">
        {/* Primera pantalla: el tablero */}
        <section id="inicio" className="contenedor" aria-labelledby="titulo-principal">
          <Tablero>
            <h1 id="titulo-principal" className={s.titular}>
              Su Iveco parado vuelve a la vía.
            </h1>
            <p className={s.bajada}>
              Concesionario autorizado Iveco en Barcelona. Repuestos originales y taller autorizado para
              transporte pesado, mediano y liviano.
            </p>
          </Tablero>
        </section>

        {/* Repuestos: la banda azul de la marca */}
        <section id="repuestos" className={s.banda} aria-labelledby="titulo-repuestos">
          <div className={`contenedor ${s.bandaRejilla}`}>
            <div className={s.bandaTexto}>
              <h2 id="titulo-repuestos" className={s.tituloBanda}>
                El más amplio stock de repuestos Iveco del Oriente.
              </h2>
              <p className={s.parrafoBanda}>
                Repuestos, accesorios y lubricantes totalmente originales y garantizados. Todo lo que busca
                para reparar y mantener su vehículo, de manera rápida, sencilla y económica.
              </p>
              <p className={s.lema}>Cuide su motor: use repuestos 100% originales.</p>
              <BotonWhatsApp accion="repuestos" variante="claro" />
            </div>

            <div className={s.ruta} aria-labelledby="titulo-ruta">
              <h3 id="titulo-ruta" className={s.rutaTitulo}>
                Entrega a domicilio
              </h3>
              <p className={s.rutaNota}>Llame, pida sus repuestos y se los hacemos llegar.</p>
              <ol className={s.paradas}>
                <li className={s.origen}>
                  <span>Barcelona</span>
                  <small>Salida</small>
                </li>
                {empresa.cobertura.map((e) => (
                  <li key={e}>
                    <span>{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Taller: lista con reglas sobre blanco */}
        <section id="taller" className={`contenedor ${s.seccion}`} aria-labelledby="titulo-taller">
          <div className={s.cabezal}>
            <h2 id="titulo-taller" className={s.titulo}>
              Taller autorizado, con mano de obra especializada.
            </h2>
            <p className={s.parrafo}>
              Profesionales capacitados y entrenados para cuidar su inversión, con los equipos y herramientas
              más modernos.
            </p>
          </div>
          <ul className={s.serviciosTaller}>
            {serviciosTaller.map(({ nombre, texto }) => (
              <li key={nombre}>
                <h3 className={s.servicioNombre}>{nombre}</h3>
                <p className={s.servicioTexto}>{texto}</p>
              </li>
            ))}
          </ul>
          <div className={s.accionTaller}>
            <BotonWhatsApp accion="taller" />
          </div>
        </section>

        {/* Respuesta: segunda banda azul */}
        <section id="servicios" className={s.banda} aria-labelledby="titulo-servicios">
          <div className="contenedor">
            <h2 id="titulo-servicios" className={s.tituloBanda}>
              Cuando el camión no puede esperar.
            </h2>
            <div className={s.respuestaRejilla}>
              <article className={s.principal}>
                <h3 className={s.principalNombre}>Alquiler de partes mecánicas: solución en menos de 8 horas.</h3>
                <p className={s.parrafoBanda}>
                  Un sistema de alquiler de partes mecánicas que le garantiza la solución inmediata a su problema.
                </p>
              </article>
              <div className={s.secundarios}>
                <article className={s.secundario}>
                  <IconRoad width={28} height={28} stroke={1.75} aria-hidden="true" />
                  <div>
                    <h3 className={s.secundarioNombre}>Servicio en carretera</h3>
                    <p>
                      Una unidad móvil totalmente dotada lo asiste en cualquier emergencia, dentro o fuera de la
                      ciudad.
                    </p>
                  </div>
                </article>
                <article className={s.secundario}>
                  <IconHeadset width={28} height={28} stroke={1.75} aria-hidden="true" />
                  <div>
                    <h3 className={s.secundarioNombre}>Servicio al cliente</h3>
                    <p>Un personal dispuesto a atenderlo, escucharlo y asesorarlo en la solución de su problema.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* Empresa: la trayectoria, dicha en grande */}
        <section id="empresa" className={`contenedor ${s.seccion}`} aria-labelledby="titulo-empresa">
          <h2 id="titulo-empresa" className={s.tituloEmpresa}>
            Más de 25 años en el transporte pesado, mediano y liviano.
          </h2>
          <p className={s.declaracion}>
            <strong>3.000 m² de taller</strong> y <strong>3.000 m² de estacionamiento</strong>, con oficinas,
            área de exhibición, almacén y despacho que aseguran la entrada inmediata de su orden de servicio.
          </p>
          <dl className={s.valores}>
            <div>
              <dt>Compromiso</dt>
              <dd>Somos responsables de lo que hacemos.</dd>
            </div>
            <div>
              <dt>Confiabilidad</dt>
              <dd>Cumplimos nuestras promesas.</dd>
            </div>
          </dl>
          <p className={s.cierre}>Un taller de calidad es garantía de trabajos de calidad.</p>
        </section>

        {/* Contacto */}
        <section id="contacto" className={s.contacto} aria-labelledby="titulo-contacto">
          <div className={`contenedor ${s.seccion}`}>
            <h2 id="titulo-contacto" className={s.titulo}>
              Hablemos de su camión.
            </h2>
            <div className={s.contactoAcciones}>
              <BotonWhatsApp accion="repuestos" />
              <BotonWhatsApp accion="taller" />
            </div>
            <div className={s.contactoRejilla}>
              <div>
                <h3 className={s.contactoRotulo}>
                  <IconPhone width={20} height={20} stroke={1.75} aria-hidden="true" /> Teléfonos
                </h3>
                <ul className={s.lista}>
                  {telefonosFijos.map((t) => (
                    <li key={t.e164}>
                      <a href={`tel:${t.e164}`}>{t.mostrar}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={s.contactoRotulo}>
                  <IconPhone width={20} height={20} stroke={1.75} aria-hidden="true" /> Celulares
                </h3>
                <ul className={s.lista}>
                  {celulares.map((t) => (
                    <li key={t.e164}>
                      <a href={`tel:${t.e164}`}>{t.mostrar}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={s.contactoRotulo}>
                  <IconMail width={20} height={20} stroke={1.75} aria-hidden="true" /> Correo
                </h3>
                <ul className={s.lista}>
                  <li>
                    <a href={`mailto:${empresa.correo}`} className={s.correo}>
                      {empresa.correo}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={s.contactoRotulo}>
                  <IconMapPin width={20} height={20} stroke={1.75} aria-hidden="true" /> Ubicación
                </h3>
                <p className={s.ubicacion}>{empresa.direccion ?? `${empresa.ciudad}, estado ${empresa.estado}.`}</p>
                {empresa.horario && <p className={s.ubicacion}>{empresa.horario}</p>}
                {empresa.redes.length > 0 && (
                  <ul className={s.lista}>
                    {empresa.redes.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} rel="noopener">
                          {r.nombre}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.pie}>
        <div className={`contenedor ${s.pieFila}`}>
          <p>
            <strong>CAMABAR</strong>, concesionario autorizado Iveco. {empresa.razonSocial}{' '}
            <span className={s.sinCorte}>RIF {empresa.rif}</span>.
          </p>
          <p>Siempre tenemos la oportunidad de mejorar.</p>
        </div>
      </footer>
      <BarraMovil />
    </>
  )
}
