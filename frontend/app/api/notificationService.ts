import apiClient from "./apiClient";

export interface NotificationItem {
  id: string;
  empresaId: string;
  userId: string;
  eventCode: string;
  module: string;
  channel: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  severity: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | string;
  link?: string;
  source?: string;
  dedupKey?: string;
  isMandatory: boolean;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: {
    id?: string;
    nombre?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  read?: boolean;
  eventCode?: string;
  module?: string;
  severity?: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationCatalogItem {
  eventCode: string;
  module: string;
  title: string;
  description: string;
  defaultEnabled: boolean;
  defaultMandatory: boolean;
  defaultPriority: string;
  defaultSeverity: string;
  defaultDedupWindowSec: number;
  requiredPermissionsAny: string[];
  channels: string[];
}

export interface NotificationCompanyPolicyItem {
  eventCode: string;
  module?: string;
  enabled: boolean;
  mandatory: boolean;
  locked?: boolean;
  requiredPermissionsAny: string[];
  dedupWindowSec: number;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationCompanyPolicyUpdateInput {
  eventCode: string;
  enabled?: boolean;
  mandatory?: boolean;
  requiredPermissionsAny?: string[];
  dedupWindowSec?: number;
}

export interface NotificationPreferenceItem {
  eventCode: string;
  module?: string;
  enabled: boolean;
  mandatory: boolean;
  locked?: boolean;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationPreferenceUpdateInput {
  eventCode: string;
  enabled: boolean;
}

const buildQueryString = (params: NotificationListParams = {}): string => {
  const search = new URLSearchParams();

  if (typeof params.page === "number") {
    search.set("page", String(params.page));
  }

  if (typeof params.limit === "number") {
    search.set("limit", String(params.limit));
  }

  if (typeof params.read === "boolean") {
    search.set("read", String(params.read));
  }

  if (params.eventCode) {
    search.set("eventCode", params.eventCode);
  }

  if (params.module) {
    search.set("module", params.module);
  }

  if (params.severity) {
    search.set("severity", params.severity);
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const listNotifications = async (
  params: NotificationListParams = {},
): Promise<NotificationListResponse> => {
  const query = buildQueryString(params);
  const response = await apiClient.get(`/notifications${query}`);
  return { items: response.data.data ?? [], meta: response.data.meta };
};

export const markNotificationAsRead = async (
  id: string,
): Promise<NotificationItem> => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ updated: number }> => {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data.data;
};

export const getNotificationCatalog = async (): Promise<{
  items: NotificationCatalogItem[];
}> => {
  const response = await apiClient.get("/notifications/catalog");
  return response.data.data;
};

export const getCompanyNotificationPolicies = async (): Promise<{
  items: NotificationCompanyPolicyItem[];
}> => {
  const response = await apiClient.get("/notifications/company-policies");
  return response.data.data;
};

export const updateCompanyNotificationPolicies = async (
  policies: NotificationCompanyPolicyUpdateInput[],
): Promise<{ items: NotificationCompanyPolicyItem[] }> => {
  const response = await apiClient.put("/notifications/company-policies", {
    policies,
  });
  return response.data.data;
};

export const getMyNotificationPreferences = async (): Promise<{
  items: NotificationPreferenceItem[];
}> => {
  const response = await apiClient.get("/notifications/me/preferences");
  return response.data.data;
};

export const updateMyNotificationPreferences = async (
  preferences: NotificationPreferenceUpdateInput[],
): Promise<{ items: NotificationPreferenceItem[] }> => {
  const response = await apiClient.put("/notifications/me/preferences", {
    preferences,
  });
  return response.data.data;
};
