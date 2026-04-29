"use client";

import { InputText } from "primereact/inputtext";
import { forwardRef, useCallback } from "react";

interface VenezuelaPhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Venezuela Phone Input Component
 * Formats input to +58 or 04XX pattern
 * Used in employee forms for phone field
 */
const VenezuelaPhoneInput = forwardRef<
  HTMLInputElement,
  VenezuelaPhoneInputProps
>(
  (
    {
      value = "",
      onChange,
      onBlur,
      placeholder = "+58 o 04XX",
      className = "",
      disabled = false,
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        // Remove non-numeric characters except +
        inputValue = inputValue.replace(/[^\d+]/g, "");

        // Limit length
        if (inputValue.length > 13) {
          inputValue = inputValue.slice(0, 13);
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
        maxLength={13}
      />
    );
  },
);

VenezuelaPhoneInput.displayName = "VenezuelaPhoneInput";

export default VenezuelaPhoneInput;
