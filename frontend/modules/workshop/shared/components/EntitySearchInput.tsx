"use client";
import React, { useState, useRef, useCallback } from "react";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { ProgressSpinner } from "primereact/progressspinner";

export interface EntityOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface EntitySearchInputProps {
  value?: EntityOption | null;
  onChange?: (value: EntityOption | null) => void;
  onSearch: (query: string) => Promise<EntityOption[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  itemTemplate?: (item: EntityOption) => React.ReactNode;
}

export default function EntitySearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar...",
  disabled = false,
  className,
  itemTemplate,
}: EntitySearchInputProps) {
  const [suggestions, setSuggestions] = useState<EntityOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (e: AutoCompleteCompleteEvent) => {
      const query = e.query;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        if (!query.trim()) {
          setSuggestions([]);
          return;
        }
        setSearching(true);
        try {
          const results = await onSearch(query);
          setSuggestions(results ?? []);
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [onSearch]
  );

  const defaultItemTemplate = (item: EntityOption) => (
    <div className="flex flex-column gap-1 py-1">
      <span className="text-900 font-medium text-sm">{item.label}</span>
      {item.sublabel && (
        <span className="text-500 text-xs">{item.sublabel}</span>
      )}
    </div>
  );

  const selectedItemTemplate = (item: EntityOption) => (
    <div className="flex align-items-center gap-2">
      <span className="text-900 text-sm">{item.label}</span>
      {item.sublabel && (
        <span className="text-400 text-xs">— {item.sublabel}</span>
      )}
    </div>
  );

  return (
    <div className={`relative${className ? ` ${className}` : ""}`}>
      <AutoComplete
        value={value ?? null}
        suggestions={suggestions}
        completeMethod={handleSearch}
        field="label"
        onChange={(e) => {
          // When the user clears the field, e.value becomes string ""
          if (!e.value || typeof e.value === "string") {
            onChange?.(null);
          } else {
            onChange?.(e.value as EntityOption);
          }
        }}
        onSelect={(e) => onChange?.(e.value as EntityOption)}
        onClear={() => onChange?.(null)}
        placeholder={placeholder}
        disabled={disabled}
        forceSelection
        className="w-full"
        inputClassName="w-full"
        itemTemplate={itemTemplate ?? defaultItemTemplate}
        selectedItemTemplate={selectedItemTemplate}
        emptyMessage="Sin resultados"
        delay={0} // debounce handled manually
        minLength={1}
        appendTo="self"
      />
      {searching && (
        <div
          className="absolute flex align-items-center"
          style={{ right: 10, top: "50%", transform: "translateY(-50%)" }}
        >
          <ProgressSpinner style={{ width: 18, height: 18 }} strokeWidth="4" />
        </div>
      )}
    </div>
  );
}
