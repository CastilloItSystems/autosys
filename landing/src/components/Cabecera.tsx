import Image from 'next/image'
import { IconPhone } from '@tabler/icons-react'
import { llamar } from '@/config/site'
import s from './Cabecera.module.css'

const enlaces = [
  { href: '#repuestos', texto: 'Repuestos' },
  { href: '#taller', texto: 'Taller' },
  { href: '#servicios', texto: 'Servicios' },
  { href: '#empresa', texto: 'Empresa' },
  { href: '#contacto', texto: 'Contacto' },
]

export default function Cabecera() {
  return (
    <header className={s.cabecera}>
      <div className={`contenedor ${s.fila}`}>
        <a href="#inicio" className={s.marca} aria-label="CAMABAR, ir al inicio">
          <Image
            src="/brand/camabar-iveco.webp"
            alt="CAMABAR, concesionario Iveco"
            width={423}
            height={132}
            priority
            className={s.logo}
          />
        </a>
        <nav aria-label="Secciones" className={s.nav}>
          {enlaces.map((e) => (
            <a key={e.href} href={e.href}>
              {e.texto}
            </a>
          ))}
        </nav>
        <a href={llamar.href} className={s.llamar}>
          <IconPhone width={18} height={18} stroke={2} aria-hidden="true" />
          {llamar.etiqueta}
        </a>
      </div>
    </header>
  )
}
