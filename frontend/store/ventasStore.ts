import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Cotizacion {
  id: string;
  fecha: Date;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
    documento: string;
  };
  vehiculo: {
    id: string;
    marca: string;
    modelo: string;
    anio: number;
    precio: number;
    imagen: string;
  };
  financiamiento?: {
    enganche: number;
    plazo: number;
    tasaInteres: number;
    pagoMensual: number;
  };
  estado: "pendiente" | "en_revision" | "aprobada" | "rechazada" | "vendida";
  prioridad: "baja" | "media" | "alta" | "urgente";
  notas: string;
  fechaSeguimiento?: Date;
}

interface VentasState {
  cotizaciones: Cotizacion[];
  agregarCotizacion: (
    cotizacion: Omit<Cotizacion, "id" | "fecha" | "estado">
  ) => void;
  actualizarEstadoCotizacion: (
    id: string,
    estado: Cotizacion["estado"]
  ) => void;
  obtenerCotizacionesPorEstado: (estado: Cotizacion["estado"]) => Cotizacion[];
  obtenerEstadisticas: () => {
    total: number;
    pendientes: number;
    enRevision: number;
    aprobadas: number;
    vendidas: number;
  };
}

export const useVentasStore = create<VentasState>()(
  persist(
    (set, get) => ({
      cotizaciones: [
        {
          id: "COT1731350400000",
          fecha: new Date("2025-11-10"),
          cliente: {
            nombre: "Juan Pérez García",
            email: "juan.perez@email.com",
            telefono: "+52 55 1234 5678",
            documento: "PJG850612HDFRRN01",
          },
          vehiculo: {
            id: "1",
            marca: "Toyota",
            modelo: "Corolla",
            anio: 2023,
            precio: 185000,
            imagen: "/demo/images/placeholder-car.svg",
          },
          financiamiento: {
            enganche: 37000,
            plazo: 36,
            tasaInteres: 12.5,
            pagoMensual: 5432,
          },
          estado: "pendiente",
          prioridad: "alta",
          notas:
            "Cliente interesado en financiamiento. Tiene buen historial crediticio.",
          fechaSeguimiento: new Date("2025-11-12"),
        },
        {
          id: "COT1731264000000",
          fecha: new Date("2025-11-09"),
          cliente: {
            nombre: "María González López",
            email: "maria.gonzalez@email.com",
            telefono: "+52 55 8765 4321",
            documento: "GGL800315MDFRRN02",
          },
          vehiculo: {
            id: "9",
            marca: "BMW",
            modelo: "X3",
            anio: 2024,
            precio: 450000,
            imagen: "/demo/images/placeholder-car.svg",
          },
          estado: "en_revision",
          prioridad: "urgente",
          notas:
            "Cliente VIP. Vehículo bajo pedido - necesita configuración especial.",
          fechaSeguimiento: new Date("2025-11-11"),
        },
      ],

      agregarCotizacion: (cotizacionData) => {
        const nuevaCotizacion: Cotizacion = {
          ...cotizacionData,
          id: `COT${Date.now()}`,
          fecha: new Date(),
          estado: "pendiente",
        };

        set((state) => ({
          cotizaciones: [...state.cotizaciones, nuevaCotizacion],
        }));
      },

      actualizarEstadoCotizacion: (id, estado) => {
        set((state) => ({
          cotizaciones: state.cotizaciones.map((cot) =>
            cot.id === id ? { ...cot, estado } : cot
          ),
        }));
      },

      obtenerCotizacionesPorEstado: (estado) => {
        return get().cotizaciones.filter((cot) => cot.estado === estado);
      },

      obtenerEstadisticas: () => {
        const cotizaciones = get().cotizaciones;
        return {
          total: cotizaciones.length,
          pendientes: cotizaciones.filter((c) => c.estado === "pendiente")
            .length,
          enRevision: cotizaciones.filter((c) => c.estado === "en_revision")
            .length,
          aprobadas: cotizaciones.filter((c) => c.estado === "aprobada").length,
          vendidas: cotizaciones.filter((c) => c.estado === "vendida").length,
        };
      },
    }),
    {
      name: "ventas-storage",
    }
  )
);
