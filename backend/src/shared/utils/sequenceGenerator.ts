// backend/src/shared/utils/sequenceGenerator.ts
//
// Generación de números secuenciales por empresa (folios, facturas, órdenes,
// cotizaciones, etc.) sin duplicados bajo concurrencia.
//
// Estrategia: tomar el MÁXIMO sufijo numérico existente con un row-lock
// (FOR UPDATE) y sumar 1. Es estrictamente más seguro que `COUNT(*) + 1`,
// que produce colisiones cuando se borran registros (el conteo baja y el
// siguiente número choca con uno ya emitido).
//
// IMPORTANTE: para que el lock evite carreras entre transacciones concurrentes,
// esta función debe ejecutarse DENTRO de una transacción ($transaction). Fuera
// de una transacción el lock se libera de inmediato y solo se obtiene el efecto
// de "leer el último número".
//
// SEGURIDAD: `table` y `column` se interpolan como identificadores SQL crudos
// (Prisma.raw). NUNCA deben provenir de entrada del usuario — son identificadores
// fijos definidos en el código.

import { PrismaClient, Prisma } from '../../generated/prisma/client.js'

// Tipo estructural: solo se necesita $queryRaw. Acepta tanto PrismaClient como
// un TransactionClient sin acoplarse al import concreto de cada feature.
type Db = Pick<PrismaClient, '$queryRaw'>

export interface SequenceOptions {
  db: Db
  /** Nombre físico de la tabla (el @@map de Prisma). Ej: 'workshop_quotations'. */
  table: string
  /** Columna que contiene el número. Ej: 'quotationNumber'. */
  column: string
  empresaId: string
  /** Prefijo del número. Ej: 'COT-'. */
  prefix: string
  /** Cantidad de dígitos con ceros a la izquierda. Por defecto 4. */
  pad?: number
}

export async function nextSequentialNumber(
  opts: SequenceOptions
): Promise<string> {
  const { db, table, column, empresaId, prefix, pad = 4 } = opts
  const col = Prisma.raw(`"${column}"`)
  const tbl = Prisma.raw(`"${table}"`)

  const rows = await db.$queryRaw<{ value: string | null }[]>(
    Prisma.sql`
      SELECT ${col} AS value
      FROM ${tbl}
      WHERE "empresaId" = ${empresaId}
        AND ${col} LIKE ${prefix + '%'}
      ORDER BY ${col} DESC
      LIMIT 1
      FOR UPDATE
    `
  )

  const last = rows[0]?.value ?? null
  const lastNum = last ? parseInt(last.slice(prefix.length), 10) || 0 : 0
  const next = lastNum + 1
  return `${prefix}${String(next).padStart(pad, '0')}`
}
