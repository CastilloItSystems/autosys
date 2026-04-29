// modules/crm/dashboard/utils/crmDashboard.utils.ts

export const formatDashboardCurrency = (value: number): string =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(value);

export const isDashboardDateOverdue = (date: string | null | undefined): boolean =>
  !!date && new Date(date) < new Date();

export const formatDashboardDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
