import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces importadas
import {
  Item,
  Movement,
  PurchaseOrder,
  SalesOrder,
  Supplier,
  Warehouse,
  Reservation,
} from "@/libs/interfaces/inventory";

interface InventoryState {
  // Artículos
  items: Item[];
  selectedItem: Item | null;

  // Movimientos
  movements: Movement[];

  // Órdenes de compra
  purchaseOrders: PurchaseOrder[];
  selectedPurchaseOrder: PurchaseOrder | null;

  // Órdenes de venta
  salesOrders: SalesOrder[];
  selectedSalesOrder: SalesOrder | null;

  // Proveedores
  suppliers: Supplier[];

  // Almacenes
  warehouses: Warehouse[];

  // Reservas
  reservations: Reservation[];

  // Loading states
  loading: boolean;

  // Actions para artículos
  agregarItem: (item: Item) => void;
  actualizarItem: (id: string, updates: Partial<Item>) => void;
  eliminarItem: (id: string) => void;
  seleccionarItem: (item: Item | null) => void;

  // Actions para movimientos
  agregarMovement: (movement: Movement) => void;
  actualizarMovement: (id: string, updates: Partial<Movement>) => void;
  eliminarMovement: (id: string) => void;

  // Actions para órdenes de compra
  agregarPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  actualizarPurchaseOrder: (
    id: string,
    updates: Partial<PurchaseOrder>
  ) => void;
  eliminarPurchaseOrder: (id: string) => void;
  seleccionarPurchaseOrder: (purchaseOrder: PurchaseOrder | null) => void;

  // Actions para órdenes de venta
  agregarSalesOrder: (salesOrder: SalesOrder) => void;
  actualizarSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
  eliminarSalesOrder: (id: string) => void;
  seleccionarSalesOrder: (salesOrder: SalesOrder | null) => void;

  // Actions para proveedores
  agregarSupplier: (supplier: Supplier) => void;
  actualizarSupplier: (id: string, updates: Partial<Supplier>) => void;
  eliminarSupplier: (id: string) => void;

  // Actions para almacenes
  agregarWarehouse: (warehouse: Warehouse) => void;
  actualizarWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  eliminarWarehouse: (id: string) => void;

  // Actions para reservas
  agregarReservation: (reservation: Reservation) => void;
  actualizarReservation: (id: string, updates: Partial<Reservation>) => void;
  eliminarReservation: (id: string) => void;

  // Set loading
  setLoading: (loading: boolean) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      selectedItem: null,
      movements: [],
      purchaseOrders: [],
      selectedPurchaseOrder: null,
      salesOrders: [],
      selectedSalesOrder: null,
      suppliers: [],
      warehouses: [],
      reservations: [],
      loading: false,

      // Actions para artículos
      agregarItem: (item: Item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      actualizarItem: (id: string, updates: Partial<Item>) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      eliminarItem: (id: string) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      seleccionarItem: (item: Item | null) => set({ selectedItem: item }),

      // Actions para movimientos
      agregarMovement: (movement: Movement) =>
        set((state) => ({
          movements: [...state.movements, movement],
        })),

      actualizarMovement: (id: string, updates: Partial<Movement>) =>
        set((state) => ({
          movements: state.movements.map((movement) =>
            movement.id === id ? { ...movement, ...updates } : movement
          ),
        })),

      eliminarMovement: (id: string) =>
        set((state) => ({
          movements: state.movements.filter((movement) => movement.id !== id),
        })),

      // Actions para órdenes de compra
      agregarPurchaseOrder: (purchaseOrder: PurchaseOrder) =>
        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, purchaseOrder],
        })),

      actualizarPurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id ? { ...po, ...updates } : po
          ),
        })),

      eliminarPurchaseOrder: (id: string) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        })),

      seleccionarPurchaseOrder: (purchaseOrder: PurchaseOrder | null) =>
        set({ selectedPurchaseOrder: purchaseOrder }),

      // Actions para órdenes de venta
      agregarSalesOrder: (salesOrder: SalesOrder) =>
        set((state) => ({
          salesOrders: [...state.salesOrders, salesOrder],
        })),

      actualizarSalesOrder: (id: string, updates: Partial<SalesOrder>) =>
        set((state) => ({
          salesOrders: state.salesOrders.map((so) =>
            so.id === id ? { ...so, ...updates } : so
          ),
        })),

      eliminarSalesOrder: (id: string) =>
        set((state) => ({
          salesOrders: state.salesOrders.filter((so) => so.id !== id),
        })),

      seleccionarSalesOrder: (salesOrder: SalesOrder | null) =>
        set({ selectedSalesOrder: salesOrder }),

      // Actions para proveedores
      agregarSupplier: (supplier: Supplier) =>
        set((state) => ({
          suppliers: [...state.suppliers, supplier],
        })),

      actualizarSupplier: (id: string, updates: Partial<Supplier>) =>
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === id ? { ...supplier, ...updates } : supplier
          ),
        })),

      eliminarSupplier: (id: string) =>
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        })),

      // Actions para almacenes
      agregarWarehouse: (warehouse: Warehouse) =>
        set((state) => ({
          warehouses: [...state.warehouses, warehouse],
        })),

      actualizarWarehouse: (id: string, updates: Partial<Warehouse>) =>
        set((state) => ({
          warehouses: state.warehouses.map((warehouse) =>
            warehouse.id === id ? { ...warehouse, ...updates } : warehouse
          ),
        })),

      eliminarWarehouse: (id: string) =>
        set((state) => ({
          warehouses: state.warehouses.filter(
            (warehouse) => warehouse.id !== id
          ),
        })),

      // Actions para reservas
      agregarReservation: (reservation: Reservation) =>
        set((state) => ({
          reservations: [...state.reservations, reservation],
        })),

      actualizarReservation: (id: string, updates: Partial<Reservation>) =>
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, ...updates } : reservation
          ),
        })),

      eliminarReservation: (id: string) =>
        set((state) => ({
          reservations: state.reservations.filter(
            (reservation) => reservation.id !== id
          ),
        })),

      // Set loading
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: "inventory-storage",
    }
  )
);
