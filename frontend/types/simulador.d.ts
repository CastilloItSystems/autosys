// Tipos para los productos y sus rendimientos
export type Product = "gas" | "naphtha" | "kerosene" | "mgo4" | "mgo6";

export type ProductYields = Record<Product, number>;

// Tipo para la información financiera de un producto
export interface ProductFinancials {
  amount: number;
  revenue: number;
}

// Tipo para los costos
export interface CostBreakdown {
  purchase: number;
  transport: number;
  operational: number;
  total: number;
}

// Tipo para los detalles del crudo
export interface CrudeDetails {
  sulfur: number;
  api: number;
  purchasePrice: number;
  transportCost: number;
  operationalCost: number;
}

// Tipo para los resultados financieros
export interface FinancialResults {
  productRevenues: Record<Product, number>;
  productTransportCosts: Record<Product, number>;
  productBunkerCosts: Record<Product, number>;
  totalRevenue: number;
  totalTransportCosts: number;
  totalBunkerCosts: number;
  totalIngresos: number;
  costs: CostBreakdown;
  grossProfit: number;
  profitMargin: number;
  costPerBarrel: number;
}

// Tipo para los resultados de producción
export interface ProductionResults {
  exact: Record<Product, number>;
  byProducts: Record<Product, number>;
}

// Tipo para los resultados del simulador
export type SimulationMode = "crudeToProducts" | "productsToCrude";

export interface SimulationResults {
  crudeAmount: number;
  crudeType: string;
  crudeDetails: CrudeDetails;
  financials: FinancialResults;
  impossibleProducts?: Product[];
  error?: string;
}

export interface CrudeToProductsResults extends SimulationResults {
  crudeAmount: number;
  crudeAmountDays: number;
  production: Record<Product, number>;
  warning: string | undefined;
}

export interface ProductsToCrudeResults extends SimulationResults {
  requiredCrude: number;
  production: ProductionResults;
}

export type SimulationResponse =
  | CrudeToProductsResults
  | ProductsToCrudeResults
  | { error: string };

// Tipo para las opciones de crudo
export interface CrudeOption {
  value: string;
  label: string;
  api: number;
  sulfur: number;
  purchasePrice: number;
  transportCost: number;
  operationalCost: number;
  gravedadAPI: number;
  azufre: number;
}
