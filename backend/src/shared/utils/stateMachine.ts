// backend/src/shared/utils/stateMachine.ts
//
// Validación centralizada de transiciones de estado.
//
// Cada feature mantiene su propio mapa de transiciones (es lógica de dominio),
// pero la VALIDACIÓN se centraliza aquí para unificar tres patrones que estaban
// duplicados e inconsistentes en el código:
//   - unos accedían a `MAP[estado]` sin null-safety (rompe ante estados nuevos),
//   - otros usaban `MAP[estado] ?? []`,
//   - y cada uno lanzaba un mensaje de error distinto.
//
// Uso:
//   const TRANSITIONS: TransitionMap<MiEstado> = { ... }
//   assertTransition(TRANSITIONS, actual, nuevo, { entity: 'Orden de servicio' })

import { BadRequestError } from './apiError.js'

export type TransitionMap<S extends string> = Partial<Record<S, readonly S[]>>

/** ¿Está permitida la transición `from → to`? Null-safe. */
export function canTransition<S extends string>(
  map: TransitionMap<S>,
  from: S,
  to: S
): boolean {
  return (map[from] ?? []).includes(to)
}

/** Lista de estados a los que se puede transicionar desde `from`. */
export function allowedTransitions<S extends string>(
  map: TransitionMap<S>,
  from: S
): readonly S[] {
  return map[from] ?? []
}

/** Lanza BadRequestError con mensaje consistente si la transición es inválida. */
export function assertTransition<S extends string>(
  map: TransitionMap<S>,
  from: S,
  to: S,
  opts?: { entity?: string }
): void {
  if (canTransition(map, from, to)) return

  const allowed = allowedTransitions(map, from)
  const prefix = opts?.entity ? `${opts.entity}: ` : ''
  const detail = allowed.length
    ? `Estados permitidos desde "${from}": ${allowed.join(', ')}.`
    : `El estado "${from}" no permite más transiciones.`
  throw new BadRequestError(
    `${prefix}Transición de estado inválida: "${from}" → "${to}". ${detail}`
  )
}
