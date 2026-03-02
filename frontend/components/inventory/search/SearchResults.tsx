"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { DataViewLayoutType } from "primereact/dataview";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import * as searchService from "@/app/api/inventory/searchService";
import type {
  ISearchItem,
  ISearchFilters,
} from "@/app/api/inventory/searchService";
import Link from "next/link";

interface SearchResultsProps {
  query: string;
  filters?: ISearchFilters;
  onResultsChange?: (count: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  filters = {},
  onResultsChange,
}) => {
  const toast = useRef<Toast>(null);

  const [items, setItems] = useState<ISearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<DataViewLayoutType>("grid");

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);

  // Load results whenever query or filters change
  useEffect(() => {
    if (query.trim().length > 0) {
      loadResults(0);
    } else {
      setItems([]);
      setTotalRecords(0);
      onResultsChange?.(0);
    }
  }, [query, filters]);

  const loadResults = async (pageNum = 0) => {
    setLoading(true);
    try {
      const response = await searchService.advancedSearch({
        query,
        filters,
        sortBy: "relevance",
        page: pageNum + 1,
        limit: rows,
      });

      setItems(response.data);
      setTotalRecords(response.total);
      setPage(pageNum);
      onResultsChange?.(response.total);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al buscar",
      });
      setItems([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (e: PaginatorPageChangeEvent) => {
    setRows(e.rows);
    loadResults(e.page);
  };

  const gridTemplate = (item: ISearchItem) => {
    return (
      <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
        <Card className="h-full flex flex-column">
          {/* Product Image or Placeholder */}
          <div
            className="bg-gray-100 border-round p-4 text-center mb-3"
            style={{ height: "150px" }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                style={{ maxHeight: "100%", maxWidth: "100%" }}
              />
            ) : (
              <div className="flex align-items-center justify-content-center h-full">
                <i className="pi pi-box text-4xl text-gray-400"></i>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mb-3">
            <h4 className="mt-0 mb-2 line-clamp-2">{item.name}</h4>
            <p className="text-sm text-600 mb-2 line-clamp-2">
              {item.description || "-"}
            </p>

            {/* SKU and Category */}
            <div className="mb-2">
              <div className="text-xs text-500">
                <strong>SKU:</strong> {item.sku}
              </div>
              <div className="text-xs text-500">
                <strong>Categoría:</strong> {item.categoryName}
              </div>
            </div>

            {/* Price */}
            <div className="mb-3">
              <div className="text-xl font-bold text-primary">
                ${item.salePrice.toFixed(2)}
              </div>
            </div>

            {/* Status Tags */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {item.isActive ? (
                <Tag value="Activo" severity="success" />
              ) : (
                <Tag value="Inactivo" severity="danger" />
              )}
              {item.score && item.score > 80 && (
                <Tag value="Alto match" severity="info" />
              )}
            </div>
          </div>

          {/* View Button */}
          <div className="mt-auto">
            <Link
              href={`/empresa/inventario/items/${item.id}`}
              className="w-full"
            >
              <Button
                label="Ver detalles"
                icon="pi pi-arrow-right"
                className="w-full"
                size="small"
              />
            </Link>
          </div>
        </Card>
      </div>
    );
  };

  const listTemplate = (item: ISearchItem) => {
    return (
      <div className="col-12 mb-3">
        <Card>
          <div className="grid gap-4 align-items-center">
            {/* Image */}
            <div className="col-12 md:col-2">
              <div
                className="bg-gray-100 border-round p-2 text-center"
                style={{ height: "80px" }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ maxHeight: "100%", maxWidth: "100%" }}
                  />
                ) : (
                  <div className="flex align-items-center justify-content-center h-full">
                    <i className="pi pi-box text-3xl text-gray-400"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="col-12 md:col-6">
              <h4 className="mt-0 mb-2">{item.name}</h4>
              <p className="text-sm text-600 mb-2">{item.description}</p>
              <div className="flex gap-3 text-sm">
                <span>
                  <strong>SKU:</strong> {item.sku}
                </span>
                <span>
                  <strong>Categoría:</strong> {item.categoryName}
                </span>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="col-12 md:col-4 text-right">
              <div className="text-2xl font-bold text-primary mb-3">
                ${item.salePrice.toFixed(2)}
              </div>
              <div className="flex gap-2 justify-content-end">
                {!item.isActive && <Tag value="Inactivo" severity="danger" />}
                <Link href={`/empresa/inventario/items/${item.id}`}>
                  <Button label="Ver" icon="pi pi-arrow-right" size="small" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Empty state
  if (!loading && items.length === 0 && query.trim().length > 0) {
    return (
      <Card className="text-center p-6">
        <div className="text-center">
          <i className="pi pi-search text-5xl text-gray-300 mb-3"></i>
          <h4 className="mt-3 mb-2">Sin resultados</h4>
          <p className="text-600">
            No encontramos artículos que coincidan con "{query}"
          </p>
          <p className="text-sm text-500">
            Intenta con otros términos o filtros
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Header with Results Count and Layout Switcher */}
      {items.length > 0 && (
        <Card>
          <div className="flex align-items-center justify-content-between">
            <div>
              <span className="font-bold">
                {totalRecords} resultado{totalRecords !== 1 ? "s" : ""}{" "}
                encontrado
                {totalRecords !== 1 ? "s" : ""}
              </span>
            </div>
            <DataViewLayoutOptions
              layout={layout}
              onChange={(e) => setLayout(e.value)}
            />
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-content-center align-items-center p-6">
          <ProgressSpinner />
        </div>
      ) : (
        <>
          {/* Results */}
          <DataView
            value={items}
            layout={layout}
            paginator={false}
            rows={rows}
            itemTemplate={layout === "grid" ? gridTemplate : listTemplate}
            className="w-full"
            emptyMessage="Sin resultados"
          />

          {/* Pagination */}
          {totalRecords > rows && (
            <Paginator
              first={page * rows}
              rows={rows}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
              rowsPerPageOptions={[6, 12, 24]}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
