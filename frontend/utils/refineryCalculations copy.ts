// import {
//   crudeTypes,
//   defaultProductPrices,
// } from "@/demo/service/simuladorService";
// import {
//   Product,
//   CrudeToProductsResults,
//   ProductsToCrudeResults,
// } from "@/types/simulador";

// // Calcular derivados a partir del crudo con precios y costos personalizados
// export function calculateDerivatives(
//   crudeType: string,
//   crudeAmount: number,
//   customProductPrices?: Record<Product, number>,
//   customCrudeCosts?: {
//     purchasePrice: number;
//     transportCost: number;
//     operationalCost: number;
//   }
// ): CrudeToProductsResults | { error: string } {
//   const crude = crudeTypes[crudeType];
//   if (!crude) return { error: "Tipo de crudo no válido" };

//   // Usar precios personalizados o los predeterminados
//   const productPrices = customProductPrices || defaultProductPrices;

//   // Usar costos personalizados o los del crudo seleccionado
//   const effectiveCosts = customCrudeCosts || {
//     purchasePrice: crude.purchasePrice,
//     transportCost: crude.transportCost,
//     operationalCost: crude.operationalCost,
//   };

//   // Verificar que los rendimientos sumen ~100%
//   const totalYield = Object.values(crude.yields).reduce(
//     (sum, yieldVal) => sum + yieldVal,
//     0
//   );
//   if (Math.abs(totalYield - 1) > 0.01) {
//     console.warn(
//       `Los rendimientos para ${crude.name} no suman 100% (suman ${(
//         totalYield * 100
//       ).toFixed(1)}%)`
//     );
//   }

//   // Calcular producción
//   const production: Record<Product, number> = {
//     gas: crudeAmount * crude.yields.gas,
//     naphtha: crudeAmount * crude.yields.naphtha,
//     kerosene: crudeAmount * crude.yields.kerosene,
//     mgo4: crudeAmount * crude.yields.mgo4,
//     mgo6: crudeAmount * crude.yields.mgo6,
//   };

//   // Calcular ingresos por ventas con los precios personalizados
//   const productRevenues: Record<Product, number> = {
//     gas: production.gas * productPrices.gas,
//     naphtha: production.naphtha * productPrices.naphtha,
//     kerosene: production.kerosene * productPrices.kerosene,
//     mgo4: production.mgo4 * productPrices.mgo4,
//     mgo6: production.mgo6 * productPrices.mgo6,
//   };

//   const totalRevenue = Object.values(productRevenues).reduce(
//     (sum, revenue) => sum + revenue,
//     0
//   );

//   // Calcular costos con los valores personalizados
//   const totalPurchaseCost = crudeAmount * effectiveCosts.purchasePrice;
//   const totalTransportCost = crudeAmount * effectiveCosts.transportCost;
//   const totalOperationalCost = crudeAmount * effectiveCosts.operationalCost;
//   const totalCost =
//     totalPurchaseCost + totalTransportCost + totalOperationalCost;

//   // Calcular margen
//   const grossProfit = totalRevenue - totalCost;
//   const profitMargin =
//     totalRevenue !== 0 ? (grossProfit / totalRevenue) * 100 : 0;

//   return {
//     crudeType: crude.name,
//     crudeAmount,
//     production,
//     financials: {
//       productRevenues,
//       totalRevenue,
//       costs: {
//         purchase: totalPurchaseCost,
//         transport: totalTransportCost,
//         operational: totalOperationalCost,
//         total: totalCost,
//       },
//       grossProfit,
//       profitMargin,
//       costPerBarrel: totalCost / crudeAmount,
//     },
//     crudeDetails: {
//       sulfur: crude.sulfurContent,
//       api: crude.api,
//       purchasePrice: effectiveCosts.purchasePrice,
//       transportCost: effectiveCosts.transportCost,
//       operationalCost: effectiveCosts.operationalCost,
//     },
//   };
// }

// // Calcular crudo necesario para obtener derivados deseados con precios y costos personalizados
// export function calculateRequiredCrude(
//   crudeType: string,
//   desiredProducts: Record<Product, number>,
//   customProductPrices?: Record<Product, number>,
//   customCrudeCosts?: {
//     purchasePrice: number;
//     transportCost: number;
//     operationalCost: number;
//   }
// ): ProductsToCrudeResults | { error: string } {
//   const crude = crudeTypes[crudeType];
//   if (!crude) return { error: "Tipo de crudo no válido" };

//   // Usar precios personalizados o los predeterminados
//   const productPrices = customProductPrices || defaultProductPrices;

//   // Usar costos personalizados o los del crudo seleccionado
//   const effectiveCosts = customCrudeCosts || {
//     purchasePrice: crude.purchasePrice,
//     transportCost: crude.transportCost,
//     operationalCost: crude.operationalCost,
//   };

//   // Calcular crudo necesario
//   let requiredCrude = 0;
//   const impossibleProducts: Product[] = [];
//   const exactProduction: Record<Product, number> = {
//     gas: 0,
//     naphtha: 0,
//     kerosene: 0,
//     mgo4: 0,
//     mgo6: 0,
//   };

//   (Object.keys(desiredProducts) as Product[]).forEach((product) => {
//     const desiredAmount = desiredProducts[product];
//     const yieldRatio = crude.yields[product];

//     if (yieldRatio && desiredAmount > 0) {
//       const crudeNeeded = desiredAmount / yieldRatio;
//       exactProduction[product] = desiredAmount;

//       if (crudeNeeded > requiredCrude) {
//         requiredCrude = crudeNeeded;
//       }
//     } else if (desiredAmount > 0) {
//       impossibleProducts.push(product);
//     }
//   });

//   if (requiredCrude <= 0) {
//     return {
//       error: "No se especificaron productos producibles o cantidades válidas",
//     };
//   }

//   // Calcular otros productos generados
//   const byProducts: Record<Product, number> = {
//     gas: 0,
//     naphtha: 0,
//     kerosene: 0,
//     mgo4: 0,
//     mgo6: 0,
//   };

//   (Object.keys(crude.yields) as Product[]).forEach((product) => {
//     if (!desiredProducts[product] || desiredProducts[product] === 0) {
//       byProducts[product] = requiredCrude * crude.yields[product];
//     }
//   });

//   // Calcular ingresos con precios personalizados
//   const productRevenues: Record<Product, number> = {
//     gas: 0,
//     naphtha: 0,
//     kerosene: 0,
//     mgo4: 0,
//     mgo6: 0,
//   };

//   let totalRevenue = 0;

//   // Ingresos por productos deseados
//   (Object.keys(exactProduction) as Product[]).forEach((product) => {
//     if (exactProduction[product] > 0) {
//       productRevenues[product] =
//         exactProduction[product] * productPrices[product];
//       totalRevenue += productRevenues[product];
//     }
//   });

//   // Ingresos por subproductos
//   (Object.keys(byProducts) as Product[]).forEach((product) => {
//     if (byProducts[product] > 0) {
//       productRevenues[product] = byProducts[product] * productPrices[product];
//       totalRevenue += productRevenues[product];
//     }
//   });

//   // Calcular costos con valores personalizados
//   const totalPurchaseCost = requiredCrude * effectiveCosts.purchasePrice;
//   const totalTransportCost = requiredCrude * effectiveCosts.transportCost;
//   const totalOperationalCost = requiredCrude * effectiveCosts.operationalCost;
//   const totalCost =
//     totalPurchaseCost + totalTransportCost + totalOperationalCost;

//   // Calcular margen
//   const grossProfit = totalRevenue - totalCost;
//   const profitMargin =
//     totalRevenue !== 0 ? (grossProfit / totalRevenue) * 100 : 0;

//   return {
//     crudeType: crude.name,
//     crudeAmount: requiredCrude,
//     requiredCrude,
//     production: {
//       exact: exactProduction,
//       byProducts,
//     },
//     financials: {
//       productRevenues,
//       totalRevenue,
//       costs: {
//         purchase: totalPurchaseCost,
//         transport: totalTransportCost,
//         operational: totalOperationalCost,
//         total: totalCost,
//       },
//       grossProfit,
//       profitMargin,
//       costPerBarrel: totalCost / requiredCrude,
//     },
//     impossibleProducts,
//     crudeDetails: {
//       sulfur: crude.sulfurContent,
//       api: crude.api,
//       purchasePrice: effectiveCosts.purchasePrice,
//       transportCost: effectiveCosts.transportCost,
//       operationalCost: effectiveCosts.operationalCost,
//     },
//   };
// }
