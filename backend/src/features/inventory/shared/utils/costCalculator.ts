// backend/src/features/inventory/shared/utils/costCalculator.ts

export type CostMethod = 'FIFO' | 'LIFO' | 'AVERAGE'

export interface CostLayer {
  quantity: number
  unitCost: number
  date: Date
}

export class CostCalculator {
  /**
   * Calcula el costo usando FIFO (First In, First Out)
   */
  static calculateFIFO(layers: CostLayer[], quantityToUse: number): number {
    let remainingQuantity = quantityToUse
    let totalCost = 0

    // Ordenar por fecha (más antiguo primero)
    const sortedLayers = [...layers].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )

    for (const layer of sortedLayers) {
      if (remainingQuantity <= 0) break

      const quantityFromThisLayer = Math.min(layer.quantity, remainingQuantity)
      totalCost += quantityFromThisLayer * layer.unitCost
      remainingQuantity -= quantityFromThisLayer
    }

    return totalCost / quantityToUse
  }

  /**
   * Calcula el costo usando LIFO (Last In, First Out)
   */
  static calculateLIFO(layers: CostLayer[], quantityToUse: number): number {
    let remainingQuantity = quantityToUse
    let totalCost = 0

    // Ordenar por fecha (más reciente primero)
    const sortedLayers = [...layers].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )

    for (const layer of sortedLayers) {
      if (remainingQuantity <= 0) break

      const quantityFromThisLayer = Math.min(layer.quantity, remainingQuantity)
      totalCost += quantityFromThisLayer * layer.unitCost
      remainingQuantity -= quantityFromThisLayer
    }

    return totalCost / quantityToUse
  }

  /**
   * Calcula el costo promedio ponderado
   */
  static calculateWeightedAverage(layers: CostLayer[]): number {
    const totalQuantity = layers.reduce((sum, layer) => sum + layer.quantity, 0)
    const totalCost = layers.reduce(
      (sum, layer) => sum + layer.quantity * layer.unitCost,
      0
    )

    if (totalQuantity === 0) return 0

    return totalCost / totalQuantity
  }

  /**
   * Actualiza el costo promedio con una nueva entrada
   */
  static updateAverageCost(
    currentQuantity: number,
    currentAverageCost: number,
    newQuantity: number,
    newUnitCost: number
  ): number {
    const totalCost =
      currentQuantity * currentAverageCost + newQuantity * newUnitCost
    const totalQuantity = currentQuantity + newQuantity

    if (totalQuantity === 0) return 0

    return totalCost / totalQuantity
  }

  /**
   * Calcula el costo según el método especificado
   */
  static calculateCost(
    method: CostMethod,
    layers: CostLayer[],
    quantityToUse?: number
  ): number {
    switch (method) {
      case 'FIFO':
        return quantityToUse
          ? this.calculateFIFO(layers, quantityToUse)
          : this.calculateWeightedAverage(layers)
      case 'LIFO':
        return quantityToUse
          ? this.calculateLIFO(layers, quantityToUse)
          : this.calculateWeightedAverage(layers)
      case 'AVERAGE':
        return this.calculateWeightedAverage(layers)
      default:
        return this.calculateWeightedAverage(layers)
    }
  }
}
