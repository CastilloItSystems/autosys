import { AutoSys } from "@/libs/interfaces/autoSysInterface";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AutoSysState {
  activeAutoSys: AutoSys | null;
  setActiveAutoSys: (autoSys: AutoSys) => void;
}

export const useAutoSysStore = create<AutoSysState>()(
  persist(
    (set) => ({
      activeAutoSys: null,
      setActiveAutoSys: (autoSys) => set({ activeAutoSys: autoSys }),
    }),
    {
      name: "autoSys-store", // Nombre único para el localStorage
    }
  )
);
