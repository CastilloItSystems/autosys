import apiClient from "../apiClient";
import { ReportFormat } from "../inventory/reportService";

// ============================================================================
// TYPES
// ============================================================================

export interface SalesDashboard {
  today: { invoices: number; revenue: number; payments: number; paymentsAmount: number };
  week: { invoices: number; revenue: number };
  month: { invoices: number; revenue: number };
  pending: { ordersAwaitingApproval: number; preInvoicesAwaitingPayment: number };
  byCurrency: { USD: number; VES: number; EUR: number };
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    currency: string;
    invoiceDate: string;
  }[];
}

export interface SalesByPeriodItem {
  period: string;
  invoiceCount: number;
  subtotal: number;
  taxAmount: number;
  igtfAmount: number;
  total: number;
}

export interface SalesByPeriodSummary {
  totalPeriods: number;
  totalInvoices: number;
  totalRevenue: number;
  avgRevenuePerPeriod: number;
}

export interface SalesByCustomerItem {
  customerId: string;
  customerName: string;
  taxId: string;
  customerType: string;
  invoiceCount: number;
  totalRevenue: number;
  avgTicket: number;
  lastInvoiceDate: string;
  totalDiscount: number;
}

export interface SalesByProductItem {
  itemId: string;
  itemName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  avgUnitPrice: number;
  invoiceCount: number;
  totalDiscount: number;
}

export interface OrderPipelineStatus {
  status: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

export interface OrderPipelineReport {
  byStatus: OrderPipelineStatus[];
  avgApprovalHours: number;
  pendingOldestDays: number;
  summary: {
    totalOrders: number;
    totalValue: number;
    approvedRate: number;
    cancelledRate: number;
  };
}

export interface PaymentMethodItem {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
  igtfAmount: number;
  avgAmount: number;
}

export interface PaymentMethodsReport {
  data: PaymentMethodItem[];
  byCurrency: { currency: string; count: number; totalAmount: number }[];
  summary: { totalPayments: number; totalAmount: number; totalIgtf: number };
}

export interface PendingInvoiceItem {
  id: string;
  preInvoiceNumber: string;
  customerName: string;
  taxId: string;
  warehouseName: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  daysWaiting: number;
}

// ============================================================================
// SERVICE
// ============================================================================

const salesReportService = {
  async getDashboard(): Promise<SalesDashboard> {
    const res = await apiClient.get("/sales/reports/dashboard");
    return res.data.data;
  },

  async getByPeriod(params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    granularity?: "day" | "week" | "month";
    customerId?: string;
    currency?: string;
  }): Promise<{ data: SalesByPeriodItem[]; summary: SalesByPeriodSummary; meta: any }> {
    const res = await apiClient.get("/sales/reports/by-period", { params });
    return res.data;
  },

  async getByCustomer(params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ data: SalesByCustomerItem[]; meta: any }> {
    const res = await apiClient.get("/sales/reports/by-customer", { params });
    return res.data;
  },

  async getByProduct(params: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ data: SalesByProductItem[]; meta: any }> {
    const res = await apiClient.get("/sales/reports/by-product", { params });
    return res.data;
  },

  async getOrderPipeline(): Promise<{ data: OrderPipelineReport }> {
    const res = await apiClient.get("/sales/reports/order-pipeline");
    return res.data;
  },

  async getPaymentMethods(params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaymentMethodsReport> {
    const res = await apiClient.get("/sales/reports/payment-methods", { params });
    return res.data;
  },

  async getPendingInvoices(params: {
    page?: number;
    limit?: number;
  }): Promise<{ data: PendingInvoiceItem[]; summary: any; meta: any }> {
    const res = await apiClient.get("/sales/reports/pending-invoices", { params });
    return res.data;
  },

  /**
   * Export a sales report as a Blob (used internally by download())
   */
  async export(
    reportType:
      | "by-period"
      | "by-customer"
      | "by-product"
      | "order-pipeline"
      | "payment-methods"
      | "pending-invoices",
    format: ReportFormat,
    filters?: Record<string, any>
  ): Promise<Blob> {
    const params: Record<string, any> = { format };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") params[key] = value;
      });
    }
    const response = await apiClient.get(`/sales/reports/export/${reportType}`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Download a sales report — triggers browser file download
   */
  async download(
    reportType:
      | "by-period"
      | "by-customer"
      | "by-product"
      | "order-pipeline"
      | "payment-methods"
      | "pending-invoices",
    format: ReportFormat,
    filters?: Record<string, any>
  ): Promise<void> {
    try {
      const blob = await this.export(reportType, format, filters);
      let extension = "csv";
      let mimeType = "text/csv";
      if (format === ReportFormat.EXCEL) {
        extension = "xlsx";
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (format === ReportFormat.PDF) {
        extension = "pdf";
        mimeType = "application/pdf";
      }
      const typedBlob = new Blob([blob], { type: mimeType });
      const url = window.URL.createObjectURL(typedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${reportType}_${new Date().getTime()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sales report:", error);
      throw error;
    }
  },
};

export default salesReportService;
