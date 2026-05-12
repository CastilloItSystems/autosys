"use client";

import { InputNumber } from "primereact/inputnumber";
import { forwardRef } from "react";

interface SalaryInputProps {
  value?: number;
  onChange?: (value: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  currency?: "VES" | "USD";
}

/**
 * Salary Input Component
 * Decimal format, minimum 0, two decimal places
 */
const SalaryInput = forwardRef<HTMLInputElement, SalaryInputProps>(
  (
    {
      value = 0,
      onChange,
      onBlur,
      placeholder = "0.00",
      className = "",
      disabled = false,
      currency = "VES",
    },
    ref,
  ) => {
    return (
      <InputNumber
        inputRef={ref}
        value={value}
        onValueChange={(e) => onChange?.(e.value ?? null)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        minFractionDigits={2}
        maxFractionDigits={2}
        min={0}
        locale="en-US"
        prefix={currency === "VES" ? "Bs. " : "$ "}
        useGrouping
      />
    );
  },
);

SalaryInput.displayName = "SalaryInput";

export default SalaryInput;
