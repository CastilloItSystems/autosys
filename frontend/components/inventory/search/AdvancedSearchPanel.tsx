"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { Slider } from "primereact/slider";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import searchService from "@/app/api/inventory/searchService";
import type {
  ISearchFilters,
  ISearchAggregations,
  ISearchAggregation,
} from "@/app/api/inventory/searchService";

interface AdvancedSearchPanelProps {
  onSearch: (filters: ISearchFilters, query: string) => void;
  onAggregationsLoad?: (agg: ISearchAggregations) => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  onSearch,
  onAggregationsLoad,
}) => {
  const toast = useRef<Toast>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  // Aggregations
  const [aggregations, setAggregations] = useState<ISearchAggregations>({
    categories: [],
    brands: [],
    priceRanges: [],
    tags: [],
  });

  // Load aggregations on mount
  useEffect(() => {
    loadAggregations();
  }, []);

  // Reload aggregations when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAggregations();
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const loadAggregations = async () => {
    try {
      const agg = await searchService.getAggregations(query || undefined);
      setAggregations(agg);
      onAggregationsLoad?.(agg);
    } catch (error) {
      console.error("Error loading aggregations:", error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Ingresa un término de búsqueda",
      });
      return;
    }

    setLoading(true);

    const filters: ISearchFilters = {
      categoryId:
        selectedCategories.length === 1 ? selectedCategories[0] : undefined,
      brandId: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
      inStock: inStockOnly || undefined,
      isActive: activeOnly || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };

    try {
      onSearch(filters, query);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedTags([]);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setActiveOnly(true);
  };

  const categoryOptions = (aggregations.categories || []).map((cat) => ({
    label: `${cat.name} (${cat.count})`,
    value: cat.value,
  }));

  const brandOptions = (aggregations.brands || []).map((brand) => ({
    label: `${brand.name} (${brand.count})`,
    value: brand.value,
  }));

  const tagOptions = (aggregations.tags || []).map((tag) => ({
    label: `${tag.name} (${tag.count})`,
    value: tag.value,
  }));

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Main Search Box */}
      <Card>
        <div className="flex gap-2">
          <InputText
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué buscas?"
            className="flex-grow-1"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            label="Buscar"
            icon="pi pi-search"
            onClick={handleSearch}
            loading={loading}
          />
        </div>
      </Card>

      {/* Filters */}
      <Card title="Filtros">
        <div className="grid gap-4">
          {/* Categories */}
          {categoryOptions.length > 0 && (
            <div className="col-12 md:col-6">
              <label className="block mb-2 font-semibold text-sm">
                Categorías
              </label>
              <MultiSelect
                value={selectedCategories}
                onChange={(e: MultiSelectChangeEvent) =>
                  setSelectedCategories(e.value)
                }
                options={categoryOptions}
                placeholder="Selecciona categorías"
                className="w-full"
                maxSelectedLabels={2}
              />
            </div>
          )}

          {/* Brands */}
          {brandOptions.length > 0 && (
            <div className="col-12 md:col-6">
              <label className="block mb-2 font-semibold text-sm">Marcas</label>
              <MultiSelect
                value={selectedBrands}
                onChange={(e: MultiSelectChangeEvent) =>
                  setSelectedBrands(e.value)
                }
                options={brandOptions}
                placeholder="Selecciona marcas"
                className="w-full"
                maxSelectedLabels={2}
              />
            </div>
          )}

          {/* Price Range */}
          <div className="col-12">
            <label className="block mb-2 font-semibold text-sm">
              Rango de precio: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <Slider
              value={priceRange}
              onChange={(e: any) => setPriceRange(e.value)}
              range
              min={0}
              max={10000}
              step={50}
              className="w-full"
            />
          </div>

          {/* Tags */}
          {tagOptions.length > 0 && (
            <div className="col-12">
              <label className="block mb-2 font-semibold text-sm">
                Etiquetas
              </label>
              <MultiSelect
                value={selectedTags}
                onChange={(e: MultiSelectChangeEvent) =>
                  setSelectedTags(e.value)
                }
                options={tagOptions}
                placeholder="Selecciona etiquetas"
                className="w-full"
                maxSelectedLabels={3}
              />
            </div>
          )}

          {/* Toggles */}
          <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="inStock"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.checked || false)}
              />
              <label htmlFor="inStock" className="text-sm">
                Solo en stock
              </label>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="active"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.checked || false)}
              />
              <label htmlFor="active" className="text-sm">
                Solo activos
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-12">
            <div className="flex gap-2">
              <Button
                label="Buscar"
                icon="pi pi-search"
                onClick={handleSearch}
                loading={loading}
              />
              <Button
                label="Limpiar filtros"
                icon="pi pi-trash"
                severity="secondary"
                onClick={handleReset}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Active Filters Summary */}
      {(selectedCategories.length > 0 ||
        selectedBrands.length > 0 ||
        selectedTags.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 10000 ||
        inStockOnly ||
        !activeOnly) && (
        <Card className="bg-blue-50 border-left-4 border-blue-500">
          <div>
            <strong>Filtros activos:</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCategories.length > 0 && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  Categoría: {selectedCategories.length}
                </span>
              )}
              {selectedBrands.length > 0 && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  Marca: {selectedBrands.length}
                </span>
              )}
              {selectedTags.length > 0 && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  Etiqueta: {selectedTags.length}
                </span>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  ${priceRange[0]} - ${priceRange[1]}
                </span>
              )}
              {inStockOnly && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  En stock
                </span>
              )}
              {!activeOnly && (
                <span className="bg-blue-200 text-blue-800 px-3 py-1 border-round text-sm">
                  Producto inactivo
                </span>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearchPanel;
