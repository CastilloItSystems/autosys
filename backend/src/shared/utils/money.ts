// backend/src/shared/utils/money.ts
//
// Wrapper de precisión decimal para cálculos financieros.
//
// Motivación: la aritmética de `number` en JavaScript es de punto flotante
// (IEEE-754), por lo que sumas como 0.1 + 0.2 no son exactas. En cálculos de
// dinero (subtotales, impuestos, descuentos) esto produce errores de redondeo
// que se acumulan. `Money` envuelve `Prisma.Decimal` para operar con precisión
// exacta y redondear de forma controlada al final.
//
// Uso típico:
//   const subtotal = Money.sum(lineas.map((l) => Money.of(l.qty).mul(l.price)))
//   const total = subtotal.add(impuesto).round() // 2 decimales
//   guardar(total.toNumber())   // o total.toDecimal() para Prisma

import { Prisma } from '../../generated/prisma/client.js'

type Decimal = Prisma.Decimal
type MoneyInput = Money | number | string | Decimal

export class Money {
  private readonly value: Decimal

  private constructor(value: Decimal) {
    this.value = value
  }

  /** Crea un Money a partir de number, string, Decimal u otro Money. */
  static of(input: MoneyInput): Money {
    if (input instanceof Money) return input
    return new Money(new Prisma.Decimal(input))
  }

  /** Cero. Útil como acumulador inicial. */
  static zero(): Money {
    return new Money(new Prisma.Decimal(0))
  }

  /** Suma una lista de montos con precisión exacta. */
  static sum(items: MoneyInput[]): Money {
    return items.reduce<Money>((acc, item) => acc.add(item), Money.zero())
  }

  add(other: MoneyInput): Money {
    return new Money(this.value.plus(Money.of(other).value))
  }

  sub(other: MoneyInput): Money {
    return new Money(this.value.minus(Money.of(other).value))
  }

  mul(other: MoneyInput): Money {
    return new Money(this.value.times(Money.of(other).value))
  }

  div(other: MoneyInput): Money {
    return new Money(this.value.dividedBy(Money.of(other).value))
  }

  /** Aplica un porcentaje (ej. percent(16) = 16% del valor). */
  percent(pct: MoneyInput): Money {
    return new Money(this.value.times(Money.of(pct).value).dividedBy(100))
  }

  /** Redondea a `decimals` posiciones (por defecto 2), redondeo half-up. */
  round(decimals = 2): Money {
    return new Money(
      this.value.toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP)
    )
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  isNegative(): boolean {
    return this.value.isNegative()
  }

  equals(other: MoneyInput): boolean {
    return this.value.equals(Money.of(other).value)
  }

  /** Número para cálculos no financieros o respuestas JSON simples. */
  toNumber(): number {
    return this.value.toNumber()
  }

  /** Decimal de Prisma, para persistir en columnas @db.Decimal. */
  toDecimal(): Decimal {
    return this.value
  }

  /** String con `decimals` posiciones fijas (por defecto 2). */
  toString(decimals = 2): string {
    return this.value.toFixed(decimals)
  }
}
