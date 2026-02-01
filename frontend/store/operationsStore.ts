import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces importadas
import {
  WorkOrder,
  WorkOrderStatus,
  Invoice,
  Payment,
  Service,
  ServiceBay,
  ServiceCategory,
} from "@/libs/interfaces/workshop";

interface OperationsState {
  // Órdenes de trabajo
  workOrders: WorkOrder[];
  selectedWorkOrder: WorkOrder | null;

  // Facturas
  invoices: Invoice[];
  selectedInvoice: Invoice | null;

  // Pagos
  payments: Payment[];

  // Servicios
  services: Service[];

  // Bahías de servicio
  serviceBays: ServiceBay[];

  // Alertas de stock
  stockAlerts: any[];

  // Métricas de rotación
  rotationMetrics: any[];

  // Loading states
  loading: boolean;

  // Actions para órdenes de trabajo
  agregarWorkOrder: (workOrder: WorkOrder) => void;
  actualizarWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  eliminarWorkOrder: (id: string) => void;
  seleccionarWorkOrder: (workOrder: WorkOrder | null) => void;

  // Actions para facturas
  agregarInvoice: (invoice: Invoice) => void;
  actualizarInvoice: (id: string, updates: Partial<Invoice>) => void;
  eliminarInvoice: (id: string) => void;
  seleccionarInvoice: (invoice: Invoice | null) => void;

  // Actions para pagos
  agregarPayment: (payment: Payment) => void;
  actualizarPayment: (id: string, updates: Partial<Payment>) => void;

  // Actions para servicios
  agregarService: (service: Service) => void;
  actualizarService: (id: string, updates: Partial<Service>) => void;
  eliminarService: (id: string) => void;

  // Actions para bahías
  agregarServiceBay: (serviceBay: ServiceBay) => void;
  actualizarServiceBay: (id: string, updates: Partial<ServiceBay>) => void;
  eliminarServiceBay: (id: string) => void;

  // Actions para alertas de stock
  actualizarStockAlerts: (alerts: any[]) => void;

  // Actions para métricas de rotación
  actualizarRotationMetrics: (metrics: any[]) => void;

  // Actions generales
  setLoading: (loading: boolean) => void;

  // Métodos de cálculo
  obtenerEstadisticas: () => {
    totalWorkOrders: number;
    workOrdersActivas: number;
    workOrdersCompletadas: number;
    ingresosTotales: number;
    ingresosMesActual: number;
    alertasCriticas: number;
    bahiasOcupadas: number;
    bahiasDisponibles: number;
  };
}

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      workOrders: [],
      selectedWorkOrder: null,
      invoices: [],
      selectedInvoice: null,
      payments: [],
      services: [],
      serviceBays: [],
      stockAlerts: [],
      rotationMetrics: [],
      loading: false,

      // Actions para órdenes de trabajo
      agregarWorkOrder: (workOrder: WorkOrder) => {
        set((state) => ({
          workOrders: [...state.workOrders, workOrder],
        }));
      },

      actualizarWorkOrder: (id: string, updates: Partial<WorkOrder>) => {
        set((state) => ({
          workOrders: state.workOrders.map((wo) =>
            wo._id === id ? { ...wo, ...updates } : wo
          ),
        }));
      },

      eliminarWorkOrder: (id: string) => {
        set((state) => ({
          workOrders: state.workOrders.filter((wo) => wo._id !== id),
        }));
      },

      seleccionarWorkOrder: (workOrder: WorkOrder | null) => {
        set({ selectedWorkOrder: workOrder });
      },

      // Actions para facturas
      agregarInvoice: (invoice: Invoice) => {
        set((state) => ({
          invoices: [...state.invoices, invoice],
        }));
      },

      actualizarInvoice: (id: string, updates: Partial<Invoice>) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv._id === id ? { ...inv, ...updates } : inv
          ),
        }));
      },

      eliminarInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv._id !== id),
        }));
      },

      seleccionarInvoice: (invoice: Invoice | null) => {
        set({ selectedInvoice: invoice });
      },

      // Actions para pagos
      agregarPayment: (payment: Payment) => {
        set((state) => ({
          payments: [...state.payments, payment],
        }));
      },

      actualizarPayment: (id: string, updates: Partial<Payment>) => {
        set((state) => ({
          payments: state.payments.map((pay) =>
            pay._id === id ? { ...pay, ...updates } : pay
          ),
        }));
      },

      // Actions para servicios
      agregarService: (service: Service) => {
        set((state) => ({
          services: [...state.services, service],
        }));
      },

      actualizarService: (id: string, updates: Partial<Service>) => {
        set((state) => ({
          services: state.services.map((srv) =>
            srv._id === id ? { ...srv, ...updates } : srv
          ),
        }));
      },

      eliminarService: (id: string) => {
        set((state) => ({
          services: state.services.filter((srv) => srv._id !== id),
        }));
      },

      // Actions para bahías
      agregarServiceBay: (serviceBay: ServiceBay) => {
        set((state) => ({
          serviceBays: [...state.serviceBays, serviceBay],
        }));
      },

      actualizarServiceBay: (id: string, updates: Partial<ServiceBay>) => {
        set((state) => ({
          serviceBays: state.serviceBays.map((bay) =>
            bay._id === id ? { ...bay, ...updates } : bay
          ),
        }));
      },

      eliminarServiceBay: (id: string) => {
        set((state) => ({
          serviceBays: state.serviceBays.filter((bay) => bay._id !== id),
        }));
      },

      // Actions para alertas de stock
      actualizarStockAlerts: (alerts: any[]) => {
        set({ stockAlerts: alerts });
      },

      // Actions para métricas de rotación
      actualizarRotationMetrics: (metrics: any[]) => {
        set({ rotationMetrics: metrics });
      },

      // Actions generales
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      // Método de estadísticas
      obtenerEstadisticas: () => {
        const state = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calcular estadísticas
        const totalWorkOrders = state.workOrders.length;
        const workOrdersActivas = state.workOrders.filter(
          (wo) =>
            (wo.estado as any).nombre !== "Completada" &&
            (wo.estado as any).nombre !== "Cancelada"
        ).length;
        const workOrdersCompletadas = state.workOrders.filter(
          (wo) => (wo.estado as any).nombre === "Completada"
        ).length;

        // Calcular ingresos totales
        const ingresosTotales = state.invoices.reduce(
          (total, inv) => total + inv.total,
          0
        );

        // Calcular ingresos del mes actual
        const ingresosMesActual = state.invoices
          .filter((inv) => {
            const invDate = new Date(inv.issueDate);
            return (
              invDate.getMonth() === currentMonth &&
              invDate.getFullYear() === currentYear
            );
          })
          .reduce((total, inv) => total + inv.total, 0);

        // Contar alertas críticas
        const alertasCriticas = state.stockAlerts.filter(
          (alert) => alert.status === "critical"
        ).length;

        // Contar bahías ocupadas y disponibles
        const bahiasOcupadas = state.serviceBays.filter(
          (bay) => bay.status === "ocupado"
        ).length;
        const bahiasDisponibles = state.serviceBays.filter(
          (bay) => bay.status === "disponible"
        ).length;

        return {
          totalWorkOrders,
          workOrdersActivas,
          workOrdersCompletadas,
          ingresosTotales,
          ingresosMesActual,
          alertasCriticas,
          bahiasOcupadas,
          bahiasDisponibles,
        };
      },
    }),
    {
      name: "operations-storage",
      partialize: (state) => ({
        workOrders: state.workOrders,
        invoices: state.invoices,
        payments: state.payments,
        services: state.services,
        serviceBays: state.serviceBays,
        stockAlerts: state.stockAlerts,
        rotationMetrics: state.rotationMetrics,
      }),
    }
  )
);
