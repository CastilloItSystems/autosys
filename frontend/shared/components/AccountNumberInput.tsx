"use client";

import { InputText } from "primereact/inputtext";
import { forwardRef, useCallback } from "react";

interface AccountNumberInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Account Number Input Component
 * Venezuelan bank accounts: exactly 20 digits
 */
const AccountNumberInput = forwardRef<
  HTMLInputElement,
  AccountNumberInputProps
>(
  (
    {
      value = "",
      onChange,
      onBlur,
      placeholder = "20 dígitos",
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

        // Exactly 20 digits
        if (inputValue.length > 20) {
          inputValue = inputValue.slice(0, 20);
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
        maxLength={20}
      />
    );
  },
);

AccountNumberInput.displayName = "AccountNumberInput";

export default AccountNumberInput;
