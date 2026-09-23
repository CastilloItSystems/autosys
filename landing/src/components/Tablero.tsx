'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IconBrandWhatsapp } from '@tabler/icons-react'
import { acciones } from '@/config/site'
import s from './Tablero.module.css'

/*
 * El tablero del camión. Estado inicial, también sin JavaScript: agujas en los
 * datos reales, STOP y motor encendidos, la LCD dice CAMIÓN DETENIDO.
 * Al pulsar un interruptor se "gira la llave": las agujas barren hasta el tope
 * y vuelven, el motor se apaga, el STOP se apaga último y enciende el verde.
 * El enlace abre WhatsApp en ese mismo instante: la animación nunca lo retrasa.
 *
 * Hay dos composiciones del mismo tablero: horizontal (escritorio) y apilada
 * (teléfono), para que en pantallas pequeñas los rótulos se lean a pleno sol.
 */

type Estado = 'detenido' | 'prueba' | 'arranque' | 'en-marcha'
type Accion = 'repuestos' | 'taller'

const INICIO = 135 // grados, abajo a la izquierda
const RECORRIDO = 270 // barrido del dial en sentido horario

const angulo = (v: number, max: number) => INICIO + (RECORRIDO * Math.min(v, max)) / max
const punto = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
}
const arco = (cx: number, cy: number, r: number, d0: number, d1: number) => {
  const [x0, y0] = punto(cx, cy, r, d0)
  const [x1, y1] = punto(cx, cy, r, d1)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/* ---------- Geometría de cada composición ---------- */
type Geo = {
  viewBox: string
  carcasa: [number, number, number, number]
  R: number
  izq: [number, number]
  der: [number, number]
  // desplazamientos verticales dentro del dial, relativos al centro
  unidadY: number
  lectura: { y: number; w: number; h: number }
  rotuloY: number // relativo al centro; puede quedar fuera del dial
  stop: [number, number, number, number]
  lcd: [number, number, number, number]
  lcdLineas: [number, number]
  lamparas: { y: number; x0: number; paso: number; tam: number }
  odometro: [number, number, number, number]
  odometroLineas: 1 | 2
  agujaRecorte: number // unidades que se acorta la aguja en esta composición
}

const ANCHO: Geo = {
  viewBox: '0 0 760 390',
  carcasa: [4, 4, 752, 382],
  R: 128,
  izq: [150, 186],
  der: [610, 186],
  unidadY: 40,
  lectura: { y: 52, w: 84, h: 36 },
  rotuloY: 108,
  stop: [322, 46, 116, 46],
  lcd: [300, 110, 160, 136],
  lcdLineas: [164, 198],
  lamparas: { y: 268, x0: 295, paso: 34, tam: 30 },
  odometro: [292, 314, 176, 56],
  odometroLineas: 2,
  agujaRecorte: 0,
}

const MOVIL: Geo = {
  viewBox: '0 0 400 548',
  carcasa: [4, 4, 392, 540],
  R: 84,
  izq: [102, 116],
  der: [298, 116],
  unidadY: 22,
  // la caja baja y se estrecha para quedar entre los numerales de los extremos
  lectura: { y: 44, w: 56, h: 26 },
  rotuloY: 112,
  stop: [140, 256, 120, 42],
  lcd: [56, 314, 288, 92],
  lcdLineas: [352, 384],
  lamparas: { y: 424, x0: 76, paso: 56, tam: 36 },
  odometro: [80, 486, 240, 40],
  odometroLineas: 1,
  agujaRecorte: 6,
}

/* ---------- Símbolos ISO 2575, dibujados en retícula de 24 ---------- */
type Tipo = 'motor' | 'bateria' | 'temperatura' | 'aceite' | 'freno'

function SimboloISO({ tipo }: { tipo: Tipo }) {
  switch (tipo) {
    case 'motor': // testigo de motor
      return (
        <>
          <path d="M2 11v5" />
          <path d="M2 13.5h2.5" />
          <path d="M4.5 10.5h2L8 8.5h2v-2h5v2h1.5L18 10.5h1.5v2H21v-2.5h1v7h-1v-2.5h-1.5v2L17 18.5H8.5L6.5 16H4.5z" />
        </>
      )
    case 'bateria': // testigo de carga
      return (
        <>
          <rect x="3" y="7.5" width="18" height="11.5" rx="1" />
          <path d="M6.5 7.5V5.5h3v2" />
          <path d="M14.5 7.5V5.5h3v2" />
          <path d="M6.5 13h4" />
          <path d="M13.5 13h4M15.5 11v4" />
        </>
      )
    case 'temperatura': // temperatura del refrigerante
      return (
        <>
          <path d="M12 3v10.2" />
          <circle cx="12" cy="15.3" r="2.2" />
          <path d="M12 5h3M12 8h3M12 11h3" />
          <path d="M3 20.5c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
        </>
      )
    case 'aceite': // presión de aceite
      return (
        <>
          <path d="M3 11h2.5l1-1.5h4L12 11h4l5-2.5-4.5 6H6.5L5 12.5H3z" />
          <path d="M8.5 9.5V8h-2" />
          <circle cx="20.5" cy="17.5" r="1.3" />
        </>
      )
    case 'freno': // sistema de frenos
      return (
        <>
          <circle cx="12" cy="12" r="6.2" />
          <path d="M12 8.8v3.8" />
          <circle cx="12" cy="15.3" r="0.4" />
          <path d="M4.3 6.3a9 9 0 0 0 0 11.4" />
          <path d="M19.7 6.3a9 9 0 0 1 0 11.4" />
        </>
      )
  }
}

const LAMPARAS: { tipo: Tipo; titulo: string }[] = [
  { tipo: 'motor', titulo: 'Testigo de motor' },
  { tipo: 'bateria', titulo: 'Testigo de carga de batería' },
  { tipo: 'temperatura', titulo: 'Testigo de temperatura del refrigerante' },
  { tipo: 'aceite', titulo: 'Testigo de presión de aceite' },
  { tipo: 'freno', titulo: 'Testigo del sistema de frenos' },
]

/* ---------- Medidor ---------- */
type MedidorProps = {
  geo: Geo
  c: [number, number]
  max: number
  paso: number
  valor: number
  zona: [number, number]
  unidad: string
  rotulo: string
  lectura: string
  agujaRef: (el: SVGGElement | null) => void
}

function Medidor({ geo, c: [cx, cy], max, paso, valor, zona, unidad, rotulo, lectura, agujaRef }: MedidorProps) {
  const { R } = geo
  const rNumeral = R * 0.64
  const marcas = []
  for (let v = 0; v <= max; v += paso / 2) {
    const mayor = v % paso === 0
    const deg = angulo(v, max)
    const [x0, y0] = punto(cx, cy, R * 0.89, deg)
    const [x1, y1] = punto(cx, cy, R * (mayor ? 0.75 : 0.81), deg)
    marcas.push(<line key={`m${v}`} x1={x0} y1={y0} x2={x1} y2={y1} className={mayor ? s.marcaMayor : s.marca} />)
    if (mayor) {
      const [tx, ty] = punto(cx, cy, rNumeral, deg)
      marcas.push(
        <text key={`n${v}`} x={tx} y={ty} className={s.numeral} textAnchor="middle" dominantBaseline="central">
          {v}
        </text>,
      )
    }
  }
  const deg = angulo(valor, max)
  // La aguja termina antes del anillo de numerales: nunca tapa el dato que marca.
  const punta = rNumeral - R * 0.13 - geo.agujaRecorte
  const { lectura: l } = geo
  return (
    <g>
      <circle cx={cx} cy={cy} r={R + 8} className={s.bisel} />
      <circle cx={cx} cy={cy} r={R} className={s.cara} />
      <path d={arco(cx, cy, R * 0.94, angulo(zona[0], max), angulo(zona[1], max))} className={s.zona} />
      {marcas}
      <text x={cx} y={cy + geo.unidadY} className={s.unidad} textAnchor="middle">
        {unidad}
      </text>
      <rect x={cx - l.w / 2} y={cy + l.y} width={l.w} height={l.h} rx={6} className={s.lecturaFondo} />
      <text x={cx} y={cy + l.y + l.h / 2} className={s.lecturaTexto} textAnchor="middle" dominantBaseline="central">
        {lectura}
      </text>
      <text x={cx} y={cy + geo.rotuloY} className={s.rotuloMedidor} textAnchor="middle">
        {rotulo}
      </text>
      <g
        ref={agujaRef}
        className={s.aguja}
        style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${deg}deg)` }}
        data-reposo={deg}
      >
        <path
          d={`M ${cx - R * 0.14} ${cy - 4} L ${cx + punta} ${cy - 1.5} L ${cx + punta} ${cy + 1.5} L ${cx - R * 0.14} ${cy + 4} Z`}
        />
      </g>
      <circle cx={cx} cy={cy} r={R * 0.1} className={s.eje} />
    </g>
  )
}

/* ---------- Un tablero completo, en una composición dada ---------- */
function Cuadro({
  geo,
  variante,
  lcd,
  agujas,
}: {
  geo: Geo
  variante: 'ancho' | 'movil'
  lcd: [string, string]
  agujas: (i: number) => (el: SVGGElement | null) => void
}) {
  const sufijo = variante === 'ancho' ? 'a' : 'm'
  const [sx, sy, sw, sh] = geo.stop
  const [lx, ly, lw, lh] = geo.lcd
  const [ox, oy, ow, oh] = geo.odometro
  const centro = lx + lw / 2
  const { lamparas: lp } = geo
  return (
    <svg
      viewBox={geo.viewBox}
      className={`${s.svg} ${variante === 'ancho' ? s.soloAncho : s.soloMovil}`}
      data-variante={variante}
      role="img"
      aria-labelledby={`tablero-titulo-${sufijo} tablero-desc-${sufijo}`}
    >
      <title id={`tablero-titulo-${sufijo}`}>Tablero de instrumentos de un camión Iveco</title>
      <desc id={`tablero-desc-${sufijo}`}>
        La luz STOP está encendida: el camión está detenido. El medidor izquierdo marca la solución con alquiler de
        partes en menos de 8 horas; el derecho, más de 25 años de experiencia. El odómetro indica 3.000 metros
        cuadrados de taller.
      </desc>
      <defs>
        <linearGradient id={`cromo-${sufijo}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef0f3" />
          <stop offset="0.5" stopColor="#8a9099" />
          <stop offset="1" stopColor="#cfd4da" />
        </linearGradient>
        <radialGradient id={`carcasa-${sufijo}`} cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#2a2e33" />
          <stop offset="0.6" stopColor="#15171a" />
        </radialGradient>
      </defs>
      <g style={{ ['--cromo' as string]: `url(#cromo-${sufijo})`, ['--carcasa' as string]: `url(#carcasa-${sufijo})` }}>
        <rect x={geo.carcasa[0]} y={geo.carcasa[1]} width={geo.carcasa[2]} height={geo.carcasa[3]} rx="30" className={s.carcasa} />

        <Medidor geo={geo} c={geo.izq} max={24} paso={4} valor={8} zona={[0, 8]} unidad="HORAS" rotulo="RESPUESTA" lectura="< 8 H" agujaRef={agujas(0)} />
        <Medidor geo={geo} c={geo.der} max={30} paso={5} valor={25} zona={[25, 30]} unidad="AÑOS" rotulo="EN LA VÍA" lectura="25+" agujaRef={agujas(1)} />

        <g className={s.stop}>
          <rect x={sx} y={sy} width={sw} height={sh} rx="6" />
          <text x={sx + sw / 2} y={sy + sh / 2} textAnchor="middle" dominantBaseline="central">
            STOP
          </text>
        </g>

        <rect x={lx} y={ly} width={lw} height={lh} rx="8" className={s.lcdVidrio} />
        <text x={centro} y={geo.lcdLineas[0]} textAnchor="middle" className={s.lcdTexto}>
          {lcd[0]}
        </text>
        <text x={centro} y={geo.lcdLineas[1]} textAnchor="middle" className={s.lcdTexto}>
          {lcd[1]}
        </text>
        <circle cx={lx + lw - 16} cy={ly + 16} r="6" className={s.enMarcha}>
          <title>Testigo de marcha</title>
        </circle>

        {LAMPARAS.map((l, i) => (
          <g
            key={l.tipo}
            className={s.lampara}
            data-tipo={l.tipo}
            transform={`translate(${lp.x0 + i * lp.paso} ${lp.y}) scale(${lp.tam / 24})`}
          >
            <title>{l.titulo}</title>
            <SimboloISO tipo={l.tipo} />
          </g>
        ))}

        <rect x={ox} y={oy} width={ow} height={oh} rx="6" className={s.odometroCaja} />
        {geo.odometroLineas === 2 ? (
          <>
            <text x={ox + ow / 2} y={oy + 19} textAnchor="middle" dominantBaseline="central" className={s.odometroTexto}>
              3.000 M²
            </text>
            <text x={ox + ow / 2} y={oy + 39} textAnchor="middle" dominantBaseline="central" className={s.odometroTexto}>
              TALLER
            </text>
          </>
        ) : (
          <text x={ox + ow / 2} y={oy + oh / 2} textAnchor="middle" dominantBaseline="central" className={s.odometroTexto}>
            3.000 M² TALLER
          </text>
        )}
      </g>
    </svg>
  )
}

const LCD: Record<Estado, [string, string]> = {
  detenido: ['CAMIÓN', 'DETENIDO'],
  prueba: ['PRUEBA DE', 'TESTIGOS'],
  arranque: ['ARRANCANDO', ''],
  'en-marcha': ['', ''],
}

export default function Tablero({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('detenido')
  const [accion, setAccion] = useState<Accion | null>(null)
  const agujas = useRef<(SVGGElement | null)[]>([])
  const timers = useRef<number[]>([])

  // Refs estables por composición: 0-1 escritorio, 2-3 teléfono.
  const refPara = (base: number) => (i: number) => (el: SVGGElement | null) => {
    agujas.current[base + i] = el
  }

  const limpiar = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const despues = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // Barrido: de la posición de reposo al tope del dial y de regreso.
  const barrer = useCallback((duracion: number) => {
    for (const el of agujas.current) {
      if (!el || typeof el.animate !== 'function') continue
      const reposo = Number(el.dataset.reposo)
      el.animate(
        [
          { transform: `rotate(${reposo}deg)` },
          { transform: `rotate(${INICIO + RECORRIDO}deg)`, offset: 0.45 },
          { transform: `rotate(${reposo}deg)` },
        ],
        { duration: duracion, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
      )
    }
  }, [])

  const sinMovimiento = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Al cargar: la prueba de testigos que hace todo camión al girar la llave.
  useEffect(() => {
    if (sinMovimiento()) return
    setEstado('prueba')
    barrer(1300)
    despues(900, () => setEstado('detenido'))
    return limpiar
  }, [barrer])

  const arrancar = (a: Accion) => {
    limpiar()
    setAccion(a)
    if (sinMovimiento()) {
      setEstado('en-marcha')
      return
    }
    setEstado('arranque')
    barrer(900)
    despues(950, () => setEstado('en-marcha'))
  }

  const lcd: [string, string] =
    estado === 'en-marcha' ? [accion === 'taller' ? 'TALLER' : 'REPUESTO', 'EN CAMINO'] : LCD[estado]
  const anuncio =
    estado === 'en-marcha'
      ? `Abriendo WhatsApp para ${accion === 'taller' ? 'solicitar taller' : 'pedir repuestos'}.`
      : ''

  return (
    <div className={s.hero}>
      <div className={s.texto}>
        {children}
        <div className={s.interruptores} id="acciones-principales">
          {(['repuestos', 'taller'] as const).map((a) => (
            <a
              key={a}
              href={acciones[a].href}
              target="_blank"
              rel="noopener"
              className={s.interruptor}
              data-activo={accion === a && estado !== 'detenido' ? '' : undefined}
              onClick={() => arrancar(a)}
              aria-label={`${acciones[a].etiqueta} por WhatsApp (se abre en otra ventana)`}
            >
              <span className={s.paleta}>
                <span className={s.lente} aria-hidden="true">
                  <IconBrandWhatsapp width={22} height={22} stroke={1.75} />
                </span>
                <span className={s.bisagra} aria-hidden="true" />
                <span className={s.etiqueta}>{acciones[a].etiqueta}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <figure className={s.tablero} data-estado={estado}>
        <Cuadro geo={ANCHO} variante="ancho" lcd={lcd} agujas={refPara(0)} />
        <Cuadro geo={MOVIL} variante="movil" lcd={lcd} agujas={refPara(2)} />
        <p className="solo-lector" aria-live="polite">
          {anuncio}
        </p>
      </figure>
    </div>
  )
}
