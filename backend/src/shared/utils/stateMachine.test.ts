// backend/src/shared/utils/stateMachine.test.ts

import { describe, test, expect } from '@jest/globals'
import {
  canTransition,
  allowedTransitions,
  assertTransition,
  type TransitionMap,
} from './stateMachine.js'

type S = 'DRAFT' | 'OPEN' | 'CLOSED'
const MAP: TransitionMap<S> = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [],
}

describe('stateMachine', () => {
  test('canTransition respeta el mapa', () => {
    expect(canTransition(MAP, 'DRAFT', 'OPEN')).toBe(true)
    expect(canTransition(MAP, 'DRAFT', 'CLOSED')).toBe(false)
    expect(canTransition(MAP, 'CLOSED', 'OPEN')).toBe(false)
  })

  test('canTransition es null-safe ante estados no mapeados', () => {
    expect(canTransition(MAP, 'UNKNOWN' as S, 'OPEN')).toBe(false)
  })

  test('allowedTransitions devuelve [] para estado terminal o desconocido', () => {
    expect(allowedTransitions(MAP, 'CLOSED')).toEqual([])
    expect(allowedTransitions(MAP, 'UNKNOWN' as S)).toEqual([])
  })

  test('assertTransition no lanza en transición válida', () => {
    expect(() => assertTransition(MAP, 'DRAFT', 'OPEN')).not.toThrow()
  })

  test('assertTransition lanza con mensaje útil en transición inválida', () => {
    expect(() => assertTransition(MAP, 'DRAFT', 'CLOSED', { entity: 'OT' })).toThrow(
      /Transición de estado inválida/
    )
  })
})
