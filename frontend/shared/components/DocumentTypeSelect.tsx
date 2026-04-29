"use client";

import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { forwardRef } from "react";

interface DocumentTypeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Document Type Select Component
 * Options: V (Venezolano), E (Extranjero), P (Pasaporte)
 */
const DocumentTypeSelect = forwardRef<Dropdown, DocumentTypeSelectProps>(
  ({ value = "", onChange, onBlur, className = "", disabled = false }, ref) => {
    const options = [
      { label: "V - Venezolano", value: "V" },
      { label: "E - Extranjero", value: "E" },
      { label: "P - Pasaporte", value: "P" },
    ];

    return (
      <Dropdown
        ref={ref}
        value={value}
        onChange={(e: DropdownChangeEvent) => onChange?.(e.value)}
        onBlur={onBlur}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder="Seleccionar tipo..."
        className={className}
        disabled={disabled}
      />
    );
  },
);

DocumentTypeSelect.displayName = "DocumentTypeSelect";

export default DocumentTypeSelect;
