// backend/src/features/inventory/shared/utils/locationValidator.ts

export interface LocationParts {
  module: string
  rack: string
  division: string
}

export class LocationValidator {
  // Patrón: M1-R01-D03 (Módulo-Rack-División)
  static readonly LOCATION_PATTERN = /^([A-Z])(\d+)-([A-Z])(\d+)-([A-Z])(\d+)$/

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
    const match = location.match(this.LOCATION_PATTERN)

    if (!match) return null

    return {
      module: `${match[1]}${match[2]}`,
      rack: `${match[3]}${match[4]}`,
      division: `${match[5]}${match[6]}`,
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

    const nearby: string[] = []

    const moduleNum = parseInt(parts.module.substring(1))
    const rackNum = parseInt(parts.rack.substring(1))
    const divisionNum = parseInt(parts.division.substring(1))

    for (
      let m = Math.max(1, moduleNum - radius);
      m <= moduleNum + radius;
      m++
    ) {
      for (let r = Math.max(1, rackNum - radius); r <= rackNum + radius; r++) {
        for (
          let d = Math.max(1, divisionNum - radius);
          d <= divisionNum + radius;
          d++
        ) {
          const loc = this.format(
            `M${m}`,
            `R${String(r).padStart(2, '0')}`,
            `D${String(d).padStart(2, '0')}`
          )

          if (loc !== location) {
            nearby.push(loc)
          }
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
