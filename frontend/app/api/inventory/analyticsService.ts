import apiClient from "../apiClient";

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export enum ABCClassification {
  A = "A",
  B = "B",
  C = "C",
}

export enum TurnoverClassification {
  FAST_MOVING = "FAST_MOVING",
  MODERATE = "MODERATE",
  SLOW_MOVING = "SLOW_MOVING",
  STATIC = "STATIC",
}

export interface TopDiscrepancyItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  occurrenceCount: number;
  totalVarianceAbs: number;
  netVariance: number;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ABCItem {
  itemId: string;
  itemName: string;
  sku: string;
  totalMovementValue: number;
  movementCount: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  classification: ABCClassification;
  trend: "increasing" | "decreasing" | "stable";
  recommendations: string[];
}

export interface ABCAnalysisResponse {
  success: boolean;
  data: ABCItem[];
  summary: {
    totalItems: number;
    classA: number;
    classB: number;
    classC: number;
    totalMovementValue: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TurnoverMetrics {
  itemId: string;
  itemName: string;
  sku: string;
  turnoverRatio: number;
  daysInventoryOutstanding: number; // DIO
  healthScore: number; // 0-100
  classification: TurnoverClassification;
  trend: "improving" | "declining" | "stable";
  recommendations: string[];
  lastMovementAt?: string;
  stockValue: number;
}

export interface TurnoverResponse {
  success: boolean;
  data: TurnoverMetrics[];
  summary: {
    averageTurnover: number;
    fastMovingCount: number;
    moderateCount: number;
    slowMovingCount: number;
    staticCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ForecastData {
  itemId: string;
  itemName: string;
  sku: string;
  currentStock: number;
  estimatedDemand: {
    demand30Days: number;
    demand60Days: number;
    demand90Days: number;
  };
  forecast: {
    daysForecast: Array<{
      date: string;
      forecastedDemand: number;
      confidence: number;
    }>;
  };
  stockoutRisk: "low" | "medium" | "high";
  trendDirection: "increasing" | "decreasing" | "stable";
  recommendations: string[];
}

export interface ForecastResponse {
  success: boolean;
  data: ForecastData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ForecastAccuracy {
  itemId: string;
  itemName: string;
  accuracy: number; // 0-100
  meanAbsolutePercentageError: number;
  daysBack: number;
  lastUpdated: string;
}

export interface ForecastAccuracyResponse {
  success: boolean;
  data: ForecastAccuracy;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get ABC analysis (Pareto classification)
 */
export const getABCAnalysis = async (
  page: number = 1,
  limit: number = 20,
): Promise<ABCAnalysisResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<ABCAnalysisResponse>(
    `/inventory/analytics/abc?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get turnover metrics for all items
 */
export const getAllTurnoverMetrics = async (
  page: number = 1,
  limit: number = 20,
): Promise<TurnoverResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<TurnoverResponse>(
    `/inventory/analytics/turnover?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get turnover metrics for a specific item
 */
export const getTurnoverByItem = async (
  itemId: string,
): Promise<{ data: TurnoverMetrics }> => {
  const response = await apiClient.get<{ data: TurnoverMetrics }>(
    `/inventory/analytics/turnover/${itemId}`,
  );
  return response.data;
};

/**
 * Get items by turnover classification
 */
export const getTurnoverByClassification = async (
  classification: TurnoverClassification,
  page: number = 1,
  limit: number = 20,
): Promise<TurnoverResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<TurnoverResponse>(
    `/inventory/analytics/turnover/classification/${classification}?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get forecasts for all items
 */
export const getAllForecasts = async (
  page: number = 1,
  limit: number = 20,
): Promise<ForecastResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await apiClient.get<ForecastResponse>(
    `/inventory/analytics/forecasting?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get forecast for a specific item
 */
export const getForecastByItem = async (
  itemId: string,
): Promise<{ data: ForecastData }> => {
  const response = await apiClient.get<{ data: ForecastData }>(
    `/inventory/analytics/forecasting/${itemId}`,
  );
  return response.data;
};

/**
 * Get forecast accuracy metrics
 */
export const getForecastAccuracy = async (
  itemId: string,
  daysBack: number = 30,
): Promise<ForecastAccuracyResponse> => {
  const params = new URLSearchParams({
    daysBack: String(daysBack),
  });
  const response = await apiClient.get<ForecastAccuracyResponse>(
    `/inventory/analytics/forecasting/${itemId}/accuracy?${params.toString()}`,
  );
  return response.data;
};

// ============================================================================
// DISCREPANCIES
// ============================================================================

export const getTopDiscrepancies = async (
  limit = 5,
): Promise<{ data: TopDiscrepancyItem[] }> => {
  const response = await apiClient.get(
    `/inventory/analytics/discrepancies/top?limit=${limit}`,
  );
  return response.data;
};

export default {
  getABCAnalysis,
  getAllTurnoverMetrics,
  getTurnoverByItem,
  getTurnoverByClassification,
  getAllForecasts,
  getForecastByItem,
  getForecastAccuracy,
  getTopDiscrepancies,
};
