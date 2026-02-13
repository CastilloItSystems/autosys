// backend/src/shared/utils/dateHelper.ts

import {
  format,
  parseISO,
  isValid,
  addDays,
  subDays,
  differenceInDays,
} from 'date-fns'
import { es } from 'date-fns/locale'

export class DateHelper {
  static readonly DEFAULT_FORMAT = 'yyyy-MM-dd'
  static readonly DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss'
  static readonly DISPLAY_FORMAT = 'dd/MM/yyyy'
  static readonly DISPLAY_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'

  static format(
    date: Date | string,
    formatStr: string = this.DEFAULT_FORMAT
  ): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date

    if (!isValid(dateObj)) {
      throw new Error('Fecha inválida')
    }

    return format(dateObj, formatStr, { locale: es })
  }

  static formatDisplay(date: Date | string): string {
    return this.format(date, this.DISPLAY_FORMAT)
  }

  static formatDisplayDateTime(date: Date | string): string {
    return this.format(date, this.DISPLAY_DATETIME_FORMAT)
  }

  static parse(dateStr: string): Date {
    const date = parseISO(dateStr)

    if (!isValid(date)) {
      throw new Error('Fecha inválida')
    }

    return date
  }

  static isValid(date: any): boolean {
    if (!date) return false

    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj)
  }

  static addDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return addDays(dateObj, days)
  }

  static subtractDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return subDays(dateObj, days)
  }

  static daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

    return differenceInDays(d2, d1)
  }

  static isExpired(expiryDate: Date | string): boolean {
    const expiry =
      typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
    return expiry < new Date()
  }

  static isExpiringSoon(
    expiryDate: Date | string,
    daysThreshold: number = 30
  ): boolean {
    const expiry =
      typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
    const daysUntilExpiry = this.daysBetween(new Date(), expiry)

    return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold
  }

  static now(): Date {
    return new Date()
  }

  static today(): Date {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  static startOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    return dateObj
  }

  static endOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    dateObj.setHours(23, 59, 59, 999)
    return dateObj
  }
}
