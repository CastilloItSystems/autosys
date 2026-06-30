// backend/src/features/workshop/serviceOrders/serviceOrders.calcTotals.test.ts
//
// Tests unitarios puros de la lógica financiera de órdenes de servicio.
// No requieren base de datos: calcTotals es una función pura.

import { describe, test, expect } from '@jest/globals'
import { calcTotals } from './serviceOrders.calc.js'

describe('calcTotals — cálculo de totales de orden de servicio', () => {
  test('línea PART simple aplica IVA por defecto (16%)', () => {
    const r = calcTotals([
      { type: 'PART', quantity: 2, unitPrice: 100 },
    ])
    expect(r.subtotal).toBe(200)
    expect(r.discount).toBe(0)
    expect(r.taxAmt).toBeCloseTo(32, 6)
    expect(r.total).toBeCloseTo(232, 6)
    expect(r.partsTotal).toBe(200)
    expect(r.laborTotal).toBe(0)
    expect(r.otherTotal).toBe(0)
  })

  test('clasifica base por tipo: LABOR, PART y OTHER', () => {
    const r = calcTotals([
      { type: 'LABOR', quantity: 1, unitPrice: 50, taxRate: 0 },
      { type: 'PART', quantity: 1, unitPrice: 30, taxRate: 0 },
      { type: 'FEE', quantity: 1, unitPrice: 20, taxRate: 0 },
    ])
    expect(r.laborTotal).toBe(50)
    expect(r.partsTotal).toBe(30)
    expect(r.otherTotal).toBe(20)
    expect(r.subtotal).toBe(100)
  })

  test('descuento por línea reduce la base antes de impuestos', () => {
    const r = calcTotals([
      { type: 'PART', quantity: 1, unitPrice: 1000, discountPct: 10, taxRate: 0.16 },
    ])
    // base = 1000 - 100 = 900 ; tax = 144 ; total = 1044
    expect(r.discount).toBe(100)
    expect(r.subtotal).toBe(900)
    expect(r.taxAmt).toBeCloseTo(144, 6)
    expect(r.total).toBeCloseTo(1044, 6)
  })

  test('taxType EXEMPT ignora la tasa de impuesto', () => {
    const r = calcTotals([
      { type: 'PART', quantity: 1, unitPrice: 500, taxRate: 0.16, taxType: 'EXEMPT' },
    ])
    expect(r.taxAmt).toBe(0)
    expect(r.total).toBe(500)
  })

  test('agrega múltiples líneas con tasas e ítems mixtos', () => {
    const r = calcTotals([
      { type: 'LABOR', quantity: 2, unitPrice: 80, discountPct: 0, taxRate: 0.16 },
      { type: 'PART', quantity: 3, unitPrice: 40, discountPct: 50, taxRate: 0.16 },
      { type: 'FEE', quantity: 1, unitPrice: 25, taxType: 'EXEMPT' },
    ])
    // LABOR: base 160, tax 25.6
    // PART:  gross 120, desc 60, base 60, tax 9.6
    // FEE:   base 25, exento
    expect(r.subtotal).toBeCloseTo(245, 6)
    expect(r.discount).toBe(60)
    expect(r.taxAmt).toBeCloseTo(35.2, 6)
    expect(r.total).toBeCloseTo(280.2, 6)
  })

  test('lista vacía produce totales en cero', () => {
    const r = calcTotals([])
    expect(r).toEqual({
      laborTotal: 0,
      partsTotal: 0,
      otherTotal: 0,
      subtotal: 0,
      discount: 0,
      taxAmt: 0,
      total: 0,
    })
  })

  // Tras migrar a Money (ítem 2 del plan), la acumulación es exacta:
  // 0.1 + 0.2 da exactamente 0.3 (con Number daba 0.30000000000000004).
  test('PRECISIÓN: la acumulación con Money es exacta', () => {
    const r = calcTotals([
      { type: 'PART', quantity: 1, unitPrice: 0.1, taxRate: 0 },
      { type: 'PART', quantity: 1, unitPrice: 0.2, taxRate: 0 },
    ])
    expect(r.subtotal).toBe(0.3)
  })
})
