// backend/src/shared/utils/money.test.ts

import { describe, test, expect } from '@jest/globals'
import { Money } from './money.js'

describe('Money — wrapper de precisión decimal', () => {
  test('resuelve el caso clásico de punto flotante con exactitud', () => {
    // Con Number: 0.1 + 0.2 === 0.30000000000000004
    const r = Money.of(0.1).add(0.2)
    expect(r.toString()).toBe('0.30')
    expect(r.equals(0.3)).toBe(true)
  })

  test('of acepta number, string, Money y es idempotente', () => {
    expect(Money.of('100').toNumber()).toBe(100)
    expect(Money.of(Money.of(100)).toNumber()).toBe(100)
  })

  test('sum agrega una lista sin acumular error', () => {
    const total = Money.sum([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    expect(total.toString()).toBe('1.00')
    expect(total.equals(1)).toBe(true)
  })

  test('mul y percent calculan base e impuesto', () => {
    const base = Money.of(2).mul(100) // 200
    const tax = base.percent(16) // 32
    expect(base.toNumber()).toBe(200)
    expect(tax.toNumber()).toBe(32)
    expect(base.add(tax).toString()).toBe('232.00')
  })

  test('sub aplica descuento de línea antes de impuesto', () => {
    const gross = Money.of(1).mul(1000)
    const discount = gross.percent(10) // 100
    const net = gross.sub(discount) // 900
    expect(net.toNumber()).toBe(900)
    expect(net.add(net.percent(16)).toString()).toBe('1044.00')
  })

  test('round usa half-up a 2 decimales', () => {
    expect(Money.of('1.005').round().toString()).toBe('1.01')
    expect(Money.of('1.004').round().toString()).toBe('1.00')
  })

  test('zero, isZero, isNegative', () => {
    expect(Money.zero().isZero()).toBe(true)
    expect(Money.of(-5).isNegative()).toBe(true)
    expect(Money.of(5).isNegative()).toBe(false)
  })

  test('toDecimal devuelve un Prisma.Decimal persistible', () => {
    const d = Money.of('12.50').toDecimal()
    expect(d.toFixed(2)).toBe('12.50')
  })
})
