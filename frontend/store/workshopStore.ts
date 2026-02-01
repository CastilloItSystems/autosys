import { Workshop } from "@/libs/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkshopState {
  activeWorkshop: Workshop | null;
  setActiveWorkshop: (workshop: Workshop) => void;
}

export const useWorkshopStore = create<WorkshopState>()(
  persist(
    (set) => ({
      activeWorkshop: null,
      setActiveWorkshop: (workshop) => set({ activeWorkshop: workshop }),
    }),
    {
      name: "workshop-store", // Nombre único para el localStorage
    }
  )
);
