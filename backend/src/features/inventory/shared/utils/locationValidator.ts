// backend/src/features/inventory/shared/utils/locationValidator.ts

export interface LocationParts {
  module: string
  rack: string
  division: string
}

export class LocationValidator {
  // Patrón: tres segmentos alfanuméricos separados por guion (ej: M1-R01-D03, 01-02-03, M01-01-C04)
  static readonly LOCATION_PATTERN = /^([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)$/i

  /**
   * Valida formato de ubicación
   */
  static isValid(location: string): boolean {
    return this.LOCATION_PATTERN.test(location)
  }

  /**
   * Parsea una ubicación
   */
  static parse(location: string): LocationParts | null {
    const match = location.toUpperCase().match(this.LOCATION_PATTERN)

    if (!match) return null

    return {
      module: match[1],
      rack: match[2],
      division: match[3],
    }
  }

  /**
   * Formatea una ubicación
   */
  static format(module: string, rack: string, division: string): string {
    return `${module}-${rack}-${division}`.toUpperCase()
  }

  /**
   * Genera sugerencias de ubicaciones cercanas
   */
  static getNearbyLocations(location: string, radius: number = 1): string[] {
    const parts = this.parse(location)
    if (!parts) return []

    const extractNum = (s: string) => {
      const m = s.match(/(\d+)$/)
      return m ? parseInt(m[1]) : null
    }
    const prefix = (s: string) => s.replace(/\d+$/, '')
    const pad = (n: number, ref: string) =>
      String(n).padStart(ref.match(/\d+$/)?.[0].length ?? 1, '0')

    const mNum = extractNum(parts.module)
    const rNum = extractNum(parts.rack)
    const dNum = extractNum(parts.division)

    if (mNum === null || rNum === null || dNum === null) return []

    const nearby: string[] = []
    const upper = location.toUpperCase()

    for (let m = Math.max(1, mNum - radius); m <= mNum + radius; m++) {
      for (let r = Math.max(1, rNum - radius); r <= rNum + radius; r++) {
        for (let d = Math.max(1, dNum - radius); d <= dNum + radius; d++) {
          const loc = this.format(
            `${prefix(parts.module)}${pad(m, parts.module)}`,
            `${prefix(parts.rack)}${pad(r, parts.rack)}`,
            `${prefix(parts.division)}${pad(d, parts.division)}`
          )
          if (loc !== upper) nearby.push(loc)
        }
      }
    }

    return nearby
  }

  /**
   * Valida y sanitiza una ubicación
   */
  static sanitize(location: string): string | null {
    const cleaned = location.trim().toUpperCase()

    if (!this.isValid(cleaned)) {
      return null
    }

    return cleaned
  }
}
