import { Empresa } from "@/modules/companies/interfaces/empresa.interface";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const EMPRESAS_STORE_KEY = "empresas-store";
const LEGACY_EMPRESAS_STORE_KEY = "companies-store";

interface EmpresasState {
  activeEmpresa: Empresa | null;
  setActiveEmpresa: (empresa: Empresa) => void;
  clearActiveEmpresa: () => void;
}

type PersistedEmpresasState = {
  state?: {
    activeEmpresa?: Empresa | null;
  };
};

const readPersistedEmpresa = (key: string): Empresa | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as PersistedEmpresasState;
    return parsed.state?.activeEmpresa ?? null;
  } catch {
    return null;
  }
};

const removeLegacyEmpresasStore = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_EMPRESAS_STORE_KEY);
};

export const useEmpresasStore = create<EmpresasState>()(
  persist(
    (set) => ({
      activeEmpresa: null,
      setActiveEmpresa: (empresa) => set({ activeEmpresa: empresa }),
      clearActiveEmpresa: () => set({ activeEmpresa: null }),
    }),
    {
      name: EMPRESAS_STORE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state || state.activeEmpresa) {
          removeLegacyEmpresasStore();
          return;
        }

        const legacyEmpresa = readPersistedEmpresa(LEGACY_EMPRESAS_STORE_KEY);
        if (legacyEmpresa) {
          state.setActiveEmpresa(legacyEmpresa);
        }
        removeLegacyEmpresasStore();
      },
    },
  ),
);

export { EMPRESAS_STORE_KEY };
