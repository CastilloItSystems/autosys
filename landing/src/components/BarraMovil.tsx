'use client'

import { useEffect, useState } from 'react'
import { IconBrandWhatsapp } from '@tabler/icons-react'
import { acciones } from '@/config/site'
import s from './BarraMovil.module.css'

/**
 * En el teléfono, las dos acciones quedan siempre a un toque. Aparece solo
 * cuando los interruptores de la primera pantalla salen de vista, para no
 * duplicarlos en pantalla.
 */
export default function BarraMovil() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const objetivo = document.getElementById('acciones-principales')
    if (!objetivo || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { threshold: 0 })
    io.observe(objetivo)
    return () => io.disconnect()
  }, [])

  return (
    <div className={s.barra} data-visible={visible || undefined} aria-hidden={!visible}>
      {(['repuestos', 'taller'] as const).map((a) => (
        <a
          key={a}
          href={acciones[a].href}
          target="_blank"
          rel="noopener"
          tabIndex={visible ? 0 : -1}
          className={s.boton}
          aria-label={`${acciones[a].etiqueta} por WhatsApp (se abre en otra ventana)`}
        >
          <IconBrandWhatsapp width={20} height={20} stroke={1.75} aria-hidden="true" />
          {acciones[a].etiqueta}
        </a>
      ))}
    </div>
  )
}
