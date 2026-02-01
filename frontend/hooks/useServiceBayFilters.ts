"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BayArea, BayStatus } from "@/libs/interfaces/workshop";

const STORAGE_KEY = "serviceBayFilters";
const SEARCH_HISTORY_KEY = "serviceBaySearchHistory";
const MAX_HISTORY_ITEMS = 10;

export interface FilterState {
  area: BayArea | null;
  status: BayStatus | null;
  search: string;
  viewMode: "grid" | "list";
}

export interface SearchHistoryItem {
  term: string;
  timestamp: number;
}

export function useServiceBayFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado de filtros
  const [filters, setFilters] = useState<FilterState>({
    area: null,
    status: null,
    search: "",
    viewMode: "grid",
  });

  // Historial de búsqueda
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Cargar filtros desde localStorage y URL al montar
  useEffect(() => {
    loadFiltersFromStorage();
    loadSearchHistory();
    syncFiltersFromURL();
  }, []);

  // Sincronizar filtros desde URL
  const syncFiltersFromURL = useCallback(() => {
    const urlArea = searchParams.get("area") as BayArea | null;
    const urlStatus = searchParams.get("status") as BayStatus | null;
    const urlSearch = searchParams.get("search") || "";
    const urlViewMode = (searchParams.get("view") || "grid") as "grid" | "list";

    if (urlArea || urlStatus || urlSearch || urlViewMode !== "grid") {
      setFilters({
        area: urlArea,
        status: urlStatus,
        search: urlSearch,
        viewMode: urlViewMode,
      });
    }
  }, [searchParams]);

  // Cargar filtros desde localStorage
  const loadFiltersFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Solo cargar si no hay parámetros en la URL
        if (!searchParams.toString()) {
          setFilters(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading filters from storage:", error);
    }
  }, [searchParams]);

  // Guardar filtros en localStorage
  const saveFiltersToStorage = useCallback((newFilters: FilterState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    } catch (error) {
      console.error("Error saving filters to storage:", error);
    }
  }, []);

  // Actualizar URL con filtros
  const updateURL = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams();

      if (newFilters.area) params.set("area", newFilters.area);
      if (newFilters.status) params.set("status", newFilters.status);
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.viewMode !== "grid")
        params.set("view", newFilters.viewMode);

      const queryString = params.toString();
      const newURL = queryString ? `?${queryString}` : window.location.pathname;

      // Usar replaceState para no agregar al historial del navegador
      window.history.replaceState({}, "", newURL);
    },
    [router]
  );

  // Cargar historial de búsqueda
  const loadSearchHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed: SearchHistoryItem[] = JSON.parse(stored);
        setSearchHistory(parsed);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Agregar término al historial
  const addToSearchHistory = useCallback((term: string) => {
    if (!term.trim()) return;

    setSearchHistory((prev) => {
      // Filtrar términos duplicados
      const filtered = prev.filter(
        (item) => item.term.toLowerCase() !== term.toLowerCase()
      );

      // Agregar nuevo término al principio
      const updated = [{ term, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY_ITEMS
      );

      // Guardar en localStorage
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving search history:", error);
      }

      return updated;
    });
  }, []);

  // Limpiar historial de búsqueda
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  }, []);

  // Actualizar filtros
  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...updates };

        // Guardar en localStorage
        saveFiltersToStorage(newFilters);

        // Actualizar URL
        updateURL(newFilters);

        // Si se actualizó el término de búsqueda y no está vacío, agregarlo al historial
        if (updates.search && updates.search.trim()) {
          addToSearchHistory(updates.search);
        }

        return newFilters;
      });
    },
    [saveFiltersToStorage, updateURL, addToSearchHistory]
  );

  // Resetear filtros
  const resetFilters = useCallback(() => {
    const defaultFilters: FilterState = {
      area: null,
      status: null,
      search: "",
      viewMode: "grid",
    };

    setFilters(defaultFilters);
    saveFiltersToStorage(defaultFilters);
    updateURL(defaultFilters);
  }, [saveFiltersToStorage, updateURL]);

  // Aplicar filtro de área
  const setArea = useCallback(
    (area: BayArea | null) => {
      updateFilters({ area });
    },
    [updateFilters]
  );

  // Aplicar filtro de estado
  const setStatus = useCallback(
    (status: BayStatus | null) => {
      updateFilters({ status });
    },
    [updateFilters]
  );

  // Aplicar búsqueda
  const setSearch = useCallback(
    (search: string) => {
      updateFilters({ search });
    },
    [updateFilters]
  );

  // Cambiar modo de vista
  const setViewMode = useCallback(
    (viewMode: "grid" | "list") => {
      updateFilters({ viewMode });
    },
    [updateFilters]
  );

  // Verificar si hay filtros activos
  const hasActiveFilters = useCallback(() => {
    return !!(filters.area || filters.status || filters.search);
  }, [filters]);

  return {
    // Estado
    filters,
    searchHistory,

    // Acciones
    setArea,
    setStatus,
    setSearch,
    setViewMode,
    updateFilters,
    resetFilters,

    // Historial
    addToSearchHistory,
    clearSearchHistory,

    // Utilidades
    hasActiveFilters,
  };
}
