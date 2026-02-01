import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Refineria {
  id: string;
  estado: string;
  eliminado: boolean;
  ubicacion: string;
  nombre: string;
  nit: string;
  img: string;
  createdAt: string;
  updatedAt: string;
}

interface RefineriaState {
  activeRefineria: Refineria | null;
  setActiveRefineria: (refineria: Refineria) => void;
}

export const useRefineriaStore = create<RefineriaState>()(
  persist(
    (set) => ({
      activeRefineria: null,
      setActiveRefineria: (refineria) => set({ activeRefineria: refineria }),
    }),
    {
      name: "refineria-store", // Nombre único para el localStorage
    }
  )
);
