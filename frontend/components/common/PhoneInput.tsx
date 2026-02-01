"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const VENEZUELA_CODES = [
  { label: "+58 416", value: "+58416", operator: "Movistar" },
  { label: "+58 426", value: "+58426", operator: "Movistar" },
  { label: "+58 424", value: "+58424", operator: "Digitel" },
  { label: "+58 422", value: "+58422", operator: "Digitel" },
  { label: "+58 414", value: "+58414", operator: "Movilnet" },
  { label: "+58 412", value: "+58412", operator: "Movilnet" },
];

export default function PhoneInput({
  value = "",
  onChange,
  error = false,
  disabled = false,
  className = "",
  placeholder = "Ingrese número",
}: PhoneInputProps) {
  const [prefix, setPrefix] = useState<string>("+58416");
  const [number, setNumber] = useState<string>("");

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Try to match with one of our prefixes
      const matchedCode = VENEZUELA_CODES.find((code) =>
        value.startsWith(code.value)
      );

      if (matchedCode) {
        setPrefix(matchedCode.value);
        setNumber(value.substring(matchedCode.value.length));
      } else {
        // If no match, just set the full value as number
        setNumber(value);
      }
    }
  }, [value]);

  // Update parent when prefix or number changes
  const handleChange = (newPrefix: string, newNumber: string) => {
    // Only keep digits in the number part
    const cleanNumber = newNumber.replace(/\D/g, "");

    // Limit to 7 digits
    const limitedNumber = cleanNumber.substring(0, 7);

    setNumber(limitedNumber);

    // Build the complete phone number
    const completePhone = limitedNumber ? `${newPrefix}${limitedNumber}` : "";
    onChange(completePhone);
  };

  const handlePrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
    handleChange(newPrefix, number);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(prefix, e.target.value);
  };

  // Format number for display (adds space after 3 digits)
  const formatNumberDisplay = (num: string) => {
    if (num.length <= 3) return num;
    return `${num.substring(0, 3)} ${num.substring(3)}`;
  };

  // Custom dropdown template to show operator
  const prefixTemplate = (option: any) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-bold">{option.label}</span>
        <span className="text-sm text-500">({option.operator})</span>
      </div>
    );
  };

  const selectedPrefixTemplate = (option: any) => {
    if (!option) return <span>Código</span>;
    return <span className="font-bold">{option.label}</span>;
  };

  return (
    <div className={classNames("flex gap-2 align-items-center", className)}>
      {/* Prefix Dropdown */}
      <Dropdown
        value={prefix}
        options={VENEZUELA_CODES}
        onChange={(e) => handlePrefixChange(e.value)}
        optionLabel="label"
        optionValue="value"
        itemTemplate={prefixTemplate}
        valueTemplate={selectedPrefixTemplate}
        disabled={disabled}
        className={classNames("phone-input-prefix", { "p-invalid": error })}
        style={{ width: "140px" }}
        placeholder="Código"
      />

      {/* Number Input with counter inside */}
      <div className="flex-1 p-inputgroup">
        <InputText
          value={formatNumberDisplay(number)}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className={classNames({ "p-invalid": error })}
          maxLength={8} // 7 digits + 1 space
          keyfilter="pint" // Only positive integers
        />
        <span className="p-inputgroup-addon" style={{ minWidth: "50px" }}>
          <small className="text-500">{number.length}/7</small>
        </span>
      </div>
    </div>
  );
}
