// backend/src/features/exchangeRates/bcv/bcvFetch.service.ts
//
// Scraping directo del BCV (Banco Central de Venezuela).
// Usa node:https con rejectUnauthorized:false porque el cert del BCV
// no está en el bundle de Node.js (pero sí en el CA del sistema).

import https from 'node:https'
import { PrismaClient } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { exchangeRateService } from '../exchangeRates.service.js'

const BCV_URL = 'https://www.bcv.org.ve/'
const FETCH_TIMEOUT_MS = 15_000
const MAX_RATE_CHANGE_PCT = 50 // Sanity check: rechazar si difiere >50% del día anterior

interface BcvRates {
  usdVes: number
  eurVes: number
  date: Date
}

class BcvFetchService {
  /**
   * Extrae una tasa de cambio del HTML del BCV.
   * El BCV usa coma como separador decimal: "36,5874" → 36.5874
   */
  private parseRate(html: string, currencyId: string): number | null {
    // Mapa de id interno al código ISO (para los nuevos patrones del BCV)
    const isoCodeMap: Record<string, string> = {
      dolar: 'USD',
      euro: 'EUR',
    }
    const isoCode = isoCodeMap[currencyId] ?? currencyId.toUpperCase()

    // Intenta múltiples patrones para el HTML del BCV
    const patterns = [
      // BCV actual: <div id="dolar"...>...<strong class="strong-tb"> 535,38530000 </strong>
      new RegExp(`id=["']${currencyId}["'][^>]*>[\\s\\S]{0,1200}?<strong[^>]*>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i'),
      // Fallback: class contiene el id
      new RegExp(`class=["'][^"']*${currencyId}[^"']*["'][^>]*>[\\s\\S]{0,1200}?<strong[^>]*>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i'),
      // Fallback span con id
      new RegExp(`id=["']${currencyId}["'][^>]*>[\\s\\S]{0,1200}?<span[^>]*>\\s*([\\d,.]+)\\s*<\\/span>`, 'i'),
      // BCV (fallback texto): código ISO seguido directamente por la tasa (e.g. "USD 535,38530000")
      new RegExp(`\\b${isoCode}\\s+([\\d]{2,}[,.]\\d+)`, 'i'),
      // Variante: imágenes o elementos intermedios entre el código y el valor
      new RegExp(`${isoCode}[^\\d<]{0,80}([\\d]{2,}[,.]\\d{4,})`, 'i'),
    ]

    for (const regex of patterns) {
      const match = html.match(regex)
      if (!match) continue

      // Normalizar: BCV usa coma decimal "481,21770000" o punto de miles "1.234,56"
      const raw = match[1].trim()
      const normalized = raw.includes(',')
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw

      const value = parseFloat(normalized)
      if (!isNaN(value) && value > 0) return value
    }

    return null
  }

  /**
   * Descarga el HTML del BCV usando node:https con rejectUnauthorized:false
   * (el cert del BCV no está en el bundle de Node.js).
   */
  private fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timeout al conectar con el BCV')),
        FETCH_TIMEOUT_MS
      )
      https
        .get(
          url,
          {
            rejectUnauthorized: false,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AutoSys/1.0)',
              Accept: 'text/html,application/xhtml+xml',
              'Accept-Encoding': 'identity',
              'Accept-Language': 'es-VE,es;q=0.9',
              Connection: 'close',
            },
          },
          (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              clearTimeout(timer)
              reject(new Error(`BCV respondió con status ${res.statusCode}`))
              res.resume()
              return
            }
            const chunks: Buffer[] = []
            res.on('data', (c: Buffer) => chunks.push(c))
            res.on('end', () => {
              clearTimeout(timer)
              resolve(Buffer.concat(chunks).toString('utf-8'))
            })
            res.on('error', (e: Error) => {
              clearTimeout(timer)
              reject(e)
            })
          }
        )
        .on('error', (e: Error) => {
          clearTimeout(timer)
          reject(e)
        })
    })
  }

  /**
   * Fetch y parseo de tasas del BCV.
   */
  async fetchRates(): Promise<BcvRates> {
    let html: string
    try {
      html = await this.fetchHtml(BCV_URL)
    } catch (err: any) {
      throw new Error(`Error al conectar con el BCV: ${err.message}`)
    }

    const usdVes = this.parseRate(html, 'dolar')
    const eurVes = this.parseRate(html, 'euro')

    if (!usdVes) {
      logger.error('[BCV] No se pudo extraer tasa USD/VES del HTML', { htmlLen: html.length })
      throw new Error('No se pudo parsear la tasa USD/VES del BCV')
    }
    if (!eurVes) {
      logger.warn('[BCV] No se pudo extraer tasa EUR/VES del HTML — solo USD disponible')
    }

    // Fecha de hoy (fecha de publicación)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return { usdVes, eurVes: eurVes ?? 0, date: today }
  }

  /**
   * Valida que la tasa nueva no sea aberrantemente diferente a la última conocida.
   */
  private async validateRate(
    empresaId: string,
    from: 'USD' | 'EUR',
    newRate: number,
    db: PrismaClient
  ): Promise<boolean> {
    try {
      const last = await exchangeRateService.getLatestRate(empresaId, from, 'VES', 'BCV', db)
      const prevRate = Number(last.rate)
      if (prevRate <= 0) return true
      const changePct = Math.abs((newRate - prevRate) / prevRate) * 100
      if (changePct > MAX_RATE_CHANGE_PCT) {
        logger.warn(`[BCV] Tasa ${from}/VES sospechosa: ${prevRate} → ${newRate} (${changePct.toFixed(1)}% cambio)`, {
          empresaId,
        })
        return false
      }
      return true
    } catch {
      // No hay tasa previa → aceptar
      return true
    }
  }

  /**
   * Fetch y guardado de tasas BCV para una empresa específica.
   */
  async fetchAndSaveForEmpresa(empresaId: string, db: PrismaClient): Promise<void> {
    try {
      const rates = await this.fetchRates()

      const toSave: Array<{ fromCurrency: 'USD' | 'EUR'; toCurrency: 'VES'; rate: number; date: Date }> = []

      const usdValid = await this.validateRate(empresaId, 'USD', rates.usdVes, db)
      if (usdValid) {
        toSave.push({ fromCurrency: 'USD', toCurrency: 'VES', rate: rates.usdVes, date: rates.date })
      }

      if (rates.eurVes > 0) {
        const eurValid = await this.validateRate(empresaId, 'EUR', rates.eurVes, db)
        if (eurValid) {
          toSave.push({ fromCurrency: 'EUR', toCurrency: 'VES', rate: rates.eurVes, date: rates.date })
        }
      }

      if (toSave.length > 0) {
        await exchangeRateService.saveBcvRates(empresaId, toSave, db)

        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'exchange_rates.bcv.fetched',
            module: 'exchange_rates',
            title: 'Tasas BCV actualizadas',
            message: `Se actualizaron ${toSave.length} tasa(s) BCV.`,
            type: 'info',
            entityType: 'EXCHANGE_RATE',
            entityId: `bcv:${rates.date.toISOString().slice(0, 10)}`,
            priority: 'LOW',
            severity: 'INFO',
            link: '/empresa/tasas-cambio',
            source: 'exchange_rates.bcv_fetch',
            dedupKey: `exchange_rates.bcv.fetched:${rates.date.toISOString().slice(0, 10)}`,
            metadata: {
              rates: toSave,
              date: rates.date.toISOString(),
            },
            createdById: 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      }
    } catch (error) {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'exchange_rates.bcv.fetch_failed',
          module: 'exchange_rates',
          title: 'Error al actualizar tasas BCV',
          message: 'No se pudo actualizar la tasa BCV para la empresa.',
          type: 'error',
          entityType: 'EXCHANGE_RATE',
          entityId: 'bcv',
          priority: 'CRITICAL',
          severity: 'ERROR',
          link: '/empresa/tasas-cambio',
          source: 'exchange_rates.bcv_fetch',
          dedupKey: `exchange_rates.bcv.fetch_failed:${new Date().toISOString().slice(0, 10)}`,
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
          createdById: 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
      throw error
    }
  }

  /**
   * Fetch y guardado para todas las empresas activas.
   * El cron job llama este método.
   */
  async fetchAndSaveForAllEmpresas(db: PrismaClient): Promise<void> {
    // Fetch una sola vez y reusar
    let rates: BcvRates
    try {
      rates = await this.fetchRates()
    } catch (error) {
      logger.error('[BCV] Error al obtener tasas del BCV', { error })
      const empresas = await db.empresa.findMany({
        where: { eliminado: false },
        select: { id_empresa: true },
      })
      for (const empresa of empresas) {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId: empresa.id_empresa,
            eventCode: 'exchange_rates.bcv.fetch_failed',
            module: 'exchange_rates',
            title: 'Error al actualizar tasas BCV',
            message: 'No se pudo obtener la tasa BCV.',
            type: 'error',
            entityType: 'EXCHANGE_RATE',
            entityId: 'bcv',
            priority: 'CRITICAL',
            severity: 'ERROR',
            link: '/empresa/tasas-cambio',
            source: 'exchange_rates.bcv_fetch',
            dedupKey: `exchange_rates.bcv.fetch_failed:${new Date().toISOString().slice(0, 10)}`,
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
            createdById: 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      }
      return
    }

    logger.info(`[BCV] Tasas obtenidas: USD/VES=${rates.usdVes}, EUR/VES=${rates.eurVes}`)

    const empresas = await db.empresa.findMany({
      where: { eliminado: false },
      select: { id_empresa: true },
    })

    let saved = 0
    let errors = 0

    for (const empresa of empresas) {
      try {
        const toSave: Array<{ fromCurrency: 'USD' | 'EUR'; toCurrency: 'VES'; rate: number; date: Date }> = []

        const usdValid = await this.validateRate(empresa.id_empresa, 'USD', rates.usdVes, db)
        if (usdValid) toSave.push({ fromCurrency: 'USD', toCurrency: 'VES', rate: rates.usdVes, date: rates.date })

        if (rates.eurVes > 0) {
          const eurValid = await this.validateRate(empresa.id_empresa, 'EUR', rates.eurVes, db)
          if (eurValid) toSave.push({ fromCurrency: 'EUR', toCurrency: 'VES', rate: rates.eurVes, date: rates.date })
        }

        if (toSave.length > 0) {
          await exchangeRateService.saveBcvRates(empresa.id_empresa, toSave, db)
          saved++
          await domainEventBus.publish(
            toDomainEvent({
              empresaId: empresa.id_empresa,
              eventCode: 'exchange_rates.bcv.fetched',
              module: 'exchange_rates',
              title: 'Tasas BCV actualizadas',
              message: `Se actualizaron ${toSave.length} tasa(s) BCV.`,
              type: 'info',
              entityType: 'EXCHANGE_RATE',
              entityId: `bcv:${rates.date.toISOString().slice(0, 10)}`,
              priority: 'LOW',
              severity: 'INFO',
              link: '/empresa/tasas-cambio',
              source: 'exchange_rates.bcv_fetch',
              dedupKey: `exchange_rates.bcv.fetched:${rates.date.toISOString().slice(0, 10)}`,
              metadata: {
                rates: toSave,
                date: rates.date.toISOString(),
              },
              createdById: 'SYSTEM',
              createdByName: 'Sistema',
            })
          )
        }
      } catch (error) {
        errors++
        logger.error(`[BCV] Error al guardar tasas para empresa ${empresa.id_empresa}`, { error })
        await domainEventBus.publish(
          toDomainEvent({
            empresaId: empresa.id_empresa,
            eventCode: 'exchange_rates.bcv.fetch_failed',
            module: 'exchange_rates',
            title: 'Error al actualizar tasas BCV',
            message: 'No se pudo guardar la tasa BCV en esta empresa.',
            type: 'error',
            entityType: 'EXCHANGE_RATE',
            entityId: 'bcv',
            priority: 'CRITICAL',
            severity: 'ERROR',
            link: '/empresa/tasas-cambio',
            source: 'exchange_rates.bcv_fetch',
            dedupKey: `exchange_rates.bcv.fetch_failed:${new Date().toISOString().slice(0, 10)}:${empresa.id_empresa}`,
            metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
            createdById: 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      }
    }

    logger.info(`[BCV] Proceso completado: ${saved} empresa(s) actualizadas, ${errors} error(es)`)
  }
}

export const bcvFetchService = new BcvFetchService()
export default bcvFetchService
