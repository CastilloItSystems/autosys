"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { useRouter } from "next/navigation";
import * as searchService from "@/app/api/inventory/searchService";
import type { ISearchItem } from "@/app/api/inventory/searchService";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className = "",
  placeholder = "Buscar artículos...",
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ISearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search with debounce
  const handleSearch = async (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchService.globalSearch(searchQuery, 10);
        setSuggestions(results);
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleComplete = (e: AutoCompleteCompleteEvent) => {
    setQuery(e.query);
    handleSearch(e.query);
  };

  const handleSelect = (e: any) => {
    const selected = e.value as ISearchItem;
    router.push(`/empresa/inventario/items/${selected.id}`);
    setQuery("");
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim().length > 0) {
      router.push(
        `/empresa/inventario/busqueda?q=${encodeURIComponent(query)}`,
      );
      setQuery("");
      setSuggestions([]);
    }
  };

  const itemTemplate = (item: ISearchItem) => {
    return (
      <div className="flex align-items-center justify-content-between gap-2 w-full">
        <div className="flex flex-column gap-1" style={{ flex: 1 }}>
          <div className="font-semibold text-sm">{item.name}</div>
          <div className="text-xs text-600">{item.sku}</div>
          {item.categoryName && (
            <div className="text-xs text-500">{item.categoryName}</div>
          )}
        </div>
        <div className="text-right ml-2">
          <div className="font-semibold text-sm">
            ${item.salePrice.toFixed(2)}
          </div>
          {item.score && (
            <div className="text-xs text-600">
              Match: {Math.round(item.score)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AutoComplete
      value={query}
      suggestions={suggestions}
      completeMethod={handleComplete}
      onSelect={handleSelect}
      itemTemplate={itemTemplate}
      placeholder={placeholder}
      className={className}
      inputClassName="w-full"
      field="name"
      loading={loading}
      delay={0}
      onKeyPress={handleKeyPress}
      panelClassName="w-full"
      emptyMessage="Sin resultados"
      forceSelection={false}
    />
  );
};

export default GlobalSearch;
