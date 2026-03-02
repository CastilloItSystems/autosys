"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import AdvancedSearchPanel from "@/components/inventory/search/AdvancedSearchPanel";
import SearchResults from "@/components/inventory/search/SearchResults";
import type {
  ISearchFilters,
  ISearchAggregations,
} from "@/app/api/inventory/searchService";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const toast = useRef<Toast>(null);

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<ISearchFilters>({});
  const [resultCount, setResultCount] = useState(0);
  const [aggregations, setAggregations] = useState<ISearchAggregations>({
    categories: [],
    brands: [],
    priceRanges: [],
    tags: [],
  });

  const handleSearch = (newFilters: ISearchFilters, searchQuery: string) => {
    setFilters(newFilters);
    setQuery(searchQuery);
  };

  const handleAggregationsLoad = (agg: ISearchAggregations) => {
    setAggregations(agg);
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Header */}
      <div>
        <h2 className="m-0 mb-2">Búsqueda avanzada</h2>
        <p className="text-600 mt-0">
          Busca artículos por nombre, SKU o descripción con filtros avanzados
        </p>
      </div>

      {/* Search Panel */}
      <AdvancedSearchPanel
        onSearch={handleSearch}
        onAggregationsLoad={handleAggregationsLoad}
      />

      <Divider />

      {/* Results */}
      {query && (
        <>
          <div>
            <h3 className="m-0">
              Resultados
              {resultCount > 0 && (
                <span className="text-primary ml-2">({resultCount})</span>
              )}
            </h3>
          </div>

          <SearchResults
            query={query}
            filters={filters}
            onResultsChange={setResultCount}
          />
        </>
      )}

      {/* Initial State */}
      {!query && (
        <div className="text-center p-6 text-600">
          <i className="pi pi-search text-5xl text-gray-300 block mb-3"></i>
          <p className="text-lg mb-2">Comienza tu búsqueda</p>
          <p className="text-sm">
            Escribe un término, selecciona filtros y encuentra exactamente lo
            que necesitas
          </p>
        </div>
      )}
    </div>
  );
}
