"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

interface RifInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  placeholder?: string;
}

// Tipos de RIF venezolano
const RIF_TYPES = [
  { label: "V", value: "V", description: "Venezolano" },
  { label: "J", value: "J", description: "Jurídico" },
  { label: "G", value: "G", description: "Gubernamental" },
  { label: "E", value: "E", description: "Extranjero" },
  { label: "P", value: "P", description: "Pasaporte" },
  { label: "C", value: "C", description: "Consorcio" },
];

const RifInput: React.FC<RifInputProps> = ({
  value = "",
  onChange,
  error = false,
  placeholder = "12345678",
}) => {
  const [rifType, setRifType] = useState<string>("V");
  const [rifNumber, setRifNumber] = useState<string>("");

  // Parse existing value
  useEffect(() => {
    if (value && value.length > 0) {
      const firstChar = value.charAt(0).toUpperCase();
      const numbers = value.substring(1);

      // Validar que el primer carácter sea una letra válida
      if (RIF_TYPES.some((t) => t.value === firstChar)) {
        setRifType(firstChar);
        setRifNumber(numbers);
      } else {
        // Si no es válido, resetear a valores por defecto
        setRifType("V");
        setRifNumber("");
      }
    }
  }, [value]);

  // Handle number change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Solo permitir números
    const cleanNumber = inputValue.replace(/\D/g, "");
    // Limitar a 9 dígitos (formato estándar de RIF)
    const limitedNumber = cleanNumber.substring(0, 9);

    setRifNumber(limitedNumber);

    // Construir el RIF completo
    const fullRif = `${rifType}${limitedNumber}`;
    if (onChange) {
      onChange(fullRif);
    }
  };

  // Handle type change
  const handleTypeChange = (e: { value: string }) => {
    setRifType(e.value);

    // Construir el RIF completo
    const fullRif = `${e.value}${rifNumber}`;
    if (onChange) {
      onChange(fullRif);
    }
  };

  // Template para mostrar la descripción del tipo
  const rifTypeTemplate = (option: any) => {
    if (!option) return null;
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-bold">{option.label}</span>
        <span className="text-sm text-500">({option.description})</span>
      </div>
    );
  };

  // Template para el valor seleccionado
  const selectedRifTypeTemplate = (option: any) => {
    if (!option) return null;
    return <span className="font-bold">{option.label}</span>;
  };

  return (
    <div className="flex gap-2 align-items-center">
      {/* Dropdown para tipo de RIF */}
      <Dropdown
        value={rifType}
        options={RIF_TYPES}
        onChange={handleTypeChange}
        optionLabel="label"
        optionValue="value"
        itemTemplate={rifTypeTemplate}
        valueTemplate={selectedRifTypeTemplate}
        className={classNames({ "p-invalid": error })}
        style={{ width: "80px" }}
      />

      {/* Input para número de RIF con contador interno */}
      <div className="flex-1 p-inputgroup">
        <InputText
          value={rifNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className={classNames({ "p-invalid": error })}
          maxLength={9}
        />
        <span className="p-inputgroup-addon" style={{ minWidth: "50px" }}>
          <small className="text-500">{rifNumber.length}/9</small>
        </span>
      </div>
    </div>
  );
};

export default RifInput;
