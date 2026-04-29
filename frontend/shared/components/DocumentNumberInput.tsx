"use client";

import { InputText } from "primereact/inputtext";
import { forwardRef, useCallback } from "react";

interface DocumentNumberInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Document Number Input Component
 * Only accepts numeric input, 6-10 digits
 */
const DocumentNumberInput = forwardRef<
  HTMLInputElement,
  DocumentNumberInputProps
>(
  (
    {
      value = "",
      onChange,
      onBlur,
      placeholder = "Ej: 12345678",
      className = "",
      disabled = false,
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        // Only numeric
        inputValue = inputValue.replace(/\D/g, "");

        // Max 10 digits
        if (inputValue.length > 10) {
          inputValue = inputValue.slice(0, 10);
        }

        onChange?.(inputValue);
      },
      [onChange],
    );

    return (
      <InputText
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        maxLength={10}
      />
    );
  },
);

DocumentNumberInput.displayName = "DocumentNumberInput";

export default DocumentNumberInput;
