import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

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
// ENTITY
// ============================================================================

export interface ABCItem {
  itemId: string;
  itemName: string;
  sku: string;
  code?: string;
  totalMovementValue: number;
  movementCount: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  classification: ABCClassification;
  trend: "increasing" | "decreasing" | "stable";
  recommendations: string[];
}

export interface ABCParetoPoint {
  itemName: string;
  totalMovementValue: number;
  cumulativePercentage: number;
  classification: ABCClassification;
}

export interface ABCSummary {
  totalItems: number;
  classA: number;
  classB: number;
  classC: number;
  totalMovementValue: number;
  paretoData: ABCParetoPoint[];
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

export interface TurnoverSummary {
  averageTurnover: number;
  fastMovingCount: number;
  moderateCount: number;
  slowMovingCount: number;
  staticCount: number;
}

export interface ForecastData {
  itemId: string;
  itemName: string;
  sku: string;
  code?: string;
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

export interface ForecastAccuracy {
  itemId: string;
  itemName: string;
  accuracy: number; // 0-100
  meanAbsolutePercentageError: number;
  daysBack: number;
  lastUpdated: string;
}

// ============================================================================
// REQUEST PARAMS & DTOs
// ============================================================================

export interface GetABCAnalysisParams {
  page?: number;
  limit?: number;
}

export interface GetTurnoverMetricsParams {
  page?: number;
  limit?: number;
}

export interface GetTurnoverByClassificationParams {
  classification: TurnoverClassification;
  page?: number;
  limit?: number;
}

export interface GetForecastsParams {
  page?: number;
  limit?: number;
}

export interface GetForecastAccuracyParams {
  daysBack?: number;
}

export interface GetTopDiscrepanciesParams {
  limit?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

interface ABCAnalysisResponse extends ApiResponse<ABCItem[]> {
  data: ABCItem[];
  summary: ABCSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TurnoverResponse extends ApiResponse<TurnoverMetrics[]> {
  data: TurnoverMetrics[];
  summary: TurnoverSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ForecastResponse extends ApiResponse<ForecastData[]> {
  data: ForecastData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ForecastAccuracyResponseType extends ApiResponse<ForecastAccuracy> {
  data: ForecastAccuracy;
}

// ============================================================================
// SERVICE
// ============================================================================

const analyticsService = {
  // ABC Analysis (Pareto Classification)
  async getABCAnalysis(
    params?: GetABCAnalysisParams,
  ): Promise<ABCAnalysisResponse> {
    const res = await apiClient.get("/inventory/analytics/abc", { params });
    return res.data;
  },

  // Turnover Metrics
  async getAllTurnoverMetrics(
    params?: GetTurnoverMetricsParams,
  ): Promise<TurnoverResponse> {
    const res = await apiClient.get("/inventory/analytics/turnover", {
      params,
    });
    return res.data;
  },

  async getTurnoverByItem(
    itemId: string,
  ): Promise<ApiResponse<TurnoverMetrics>> {
    const res = await apiClient.get(`/inventory/analytics/turnover/${itemId}`);
    return res.data;
  },

  async getTurnoverByClassification(
    params: GetTurnoverByClassificationParams,
  ): Promise<TurnoverResponse> {
    const { classification, page, limit } = params;
    const res = await apiClient.get(
      `/inventory/analytics/turnover/classification/${classification}`,
      {
        params: { page, limit },
      },
    );
    return res.data;
  },

  // Forecasting
  async getAllForecasts(
    params?: GetForecastsParams,
  ): Promise<ForecastResponse> {
    const res = await apiClient.get("/inventory/analytics/forecasting", {
      params,
    });
    return res.data;
  },

  async getForecastByItem(itemId: string): Promise<ApiResponse<ForecastData>> {
    const res = await apiClient.get(
      `/inventory/analytics/forecasting/${itemId}`,
    );
    return res.data;
  },

  async getForecastAccuracy(
    itemId: string,
    params?: GetForecastAccuracyParams,
  ): Promise<ForecastAccuracyResponseType> {
    const res = await apiClient.get(
      `/inventory/analytics/forecasting/${itemId}/accuracy`,
      { params },
    );
    return res.data;
  },

  // Discrepancies
  async getTopDiscrepancies(
    params?: GetTopDiscrepanciesParams,
  ): Promise<ApiResponse<TopDiscrepancyItem[]>> {
    const res = await apiClient.get("/inventory/analytics/discrepancies/top", {
      params,
    });
    return res.data;
  },
};

export default analyticsService;
