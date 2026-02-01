import { Empresa } from "@/libs/interfaces/empresaInterface";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EmpresasState {
  activeEmpresa: Empresa | null;
  setActiveEmpresa: (empresa: Empresa) => void;
}

export const useEmpresasStore = create<EmpresasState>()(
  persist(
    (set) => ({
      activeEmpresa: null,
      setActiveEmpresa: (empresa) => set({ activeEmpresa: empresa }),
    }),
    {
      name: "empresas-store", // Nombre único para el localStorage
    },
  ),
);
