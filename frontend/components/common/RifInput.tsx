"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

interface RifInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: any;
  placeholder?: string;
  id?: string;
  className?: string;
}

// Tipos de RIF venezolano
const RIF_TYPES = [
  { label: "J", value: "J", description: "Jurídico" },
  { label: "V", value: "V", description: "Venezolano" },
  { label: "G", value: "G", description: "Gubernamental" },
  { label: "E", value: "E", description: "Extranjero" },
  { label: "P", value: "P", description: "Pasaporte" },
  { label: "C", value: "C", description: "Consorcio" },
];

const RifInput: React.FC<RifInputProps> = ({
  value = "",
  onChange,
  error,
  placeholder = "12345678-9",
  id,
  className,
}) => {
  const [rifType, setRifType] = useState<string>("J");
  const [rifNumber, setRifNumber] = useState<string>("");

  // Parse existing value
  useEffect(() => {
    if (value) {
      // Formatos esperados: "J-12345678-9", "J123456789", "J-123456789"
      const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

      if (cleanValue.length > 1) {
        const firstChar = cleanValue.charAt(0);
        const numbers = cleanValue.substring(1);

        if (RIF_TYPES.some((t) => t.value === firstChar)) {
          setRifType(firstChar);
          setRifNumber(formatRifNumber(numbers));
        }
      }
    }
  }, [value]);

  const formatRifNumber = (nums: string) => {
    const clean = nums.replace(/\D/g, "");
    if (clean.length > 8) {
      const mainPart = clean.slice(0, clean.length - 1);
      const verifier = clean.slice(clean.length - 1);
      return `${mainPart}-${verifier}`;
    }
    return clean;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (!inputValue) {
      setRifNumber("");
      if (onChange) onChange(`${rifType}-`);
      return;
    }

    const rawNums = inputValue.replace(/[^0-9]/g, "");
    const limitedNums = rawNums.slice(0, 10);

    let formatted = limitedNums;
    if (limitedNums.length > 8) {
      const main = limitedNums.slice(0, limitedNums.length - 1);
      const last = limitedNums.slice(limitedNums.length - 1);
      formatted = `${main}-${last}`;
    }

    setRifNumber(formatted);
    const fullRif = `${rifType}-${formatted}`;

    if (onChange) {
      onChange(fullRif);
    }
  };

  const handleTypeChange = (e: { value: string }) => {
    const newType = e.value;
    setRifType(newType);
    const fullRif = `${newType}-${rifNumber}`;
    if (onChange) {
      onChange(fullRif);
    }
  };

  return (
    <div className={classNames("flex gap-2", className)}>
      <Dropdown
        value={rifType}
        options={RIF_TYPES}
        onChange={handleTypeChange}
        optionLabel="label"
        optionValue="value"
        className={classNames("w-5rem", { "p-invalid": error })}
        pt={{
          input: { className: "text-center font-bold" },
        }}
      />
      <InputText
        id={id}
        value={rifNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={classNames("w-full", { "p-invalid": error })}
        maxLength={11}
        keyfilter={/[0-9-]/}
      />
    </div>
  );
};

export default RifInput;
