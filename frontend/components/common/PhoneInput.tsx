"use client";
import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: any;
  placeholder?: string;
  id?: string;
  className?: string;
}

const AREA_CODES = [
  // Móviles
  { label: "0412", value: "0412" },
  { label: "0414", value: "0414" },
  { label: "0424", value: "0424" },
  { label: "0416", value: "0416" },
  { label: "0426", value: "0426" },
  // Fijos Principales
  { label: "0212", value: "0212" },
  { label: "0239", value: "0239" },
  { label: "0241", value: "0241" },
  { label: "0242", value: "0242" },
  { label: "0243", value: "0243" },
  { label: "0251", value: "0251" },
  { label: "0261", value: "0261" },
  { label: "0274", value: "0274" },
  { label: "0276", value: "0276" },
  { label: "0281", value: "0281" },
  { label: "0285", value: "0285" },
  { label: "0286", value: "0286" },
  { label: "0291", value: "0291" },
  { label: "0295", value: "0295" },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  error,
  placeholder = "1234567",
  id,
  className,
}) => {
  const [areaCode, setAreaCode] = useState<string>("0414");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Parse existing value
  useEffect(() => {
    if (value) {
      // Intentamos extraer el código de área y el número
      // Asumimos formato 0XXX-YYYYYYY o 0XXXYYYYYYY
      const cleanValue = value.replace(/\D/g, "");

      if (cleanValue.length >= 10) {
        // Mínimo 3 código + 7 número
        // Intentar hacer match con códigos conocidos primero
        const matchedCode = AREA_CODES.find((code) =>
          cleanValue.startsWith(code.value),
        );

        if (matchedCode) {
          setAreaCode(matchedCode.value);
          const num = cleanValue.substring(matchedCode.value.length);
          setPhoneNumber(formatPhoneNumber(num));
        } else {
          // Si no coincide, asumimos 4 dígitos de código
          const code = cleanValue.substring(0, 4);
          const num = cleanValue.substring(4);
          // Si el código no está en la lista, lo añadimos temporalmente o forzamos uno default
          // Por simplicidad, si no está en la lista, usamos default y ponemos todo en número?
          // Mejor intentar setearlo si el Dropdown lo permite, si no, fallback
          if (AREA_CODES.some((c) => c.value === code)) {
            setAreaCode(code);
            setPhoneNumber(formatPhoneNumber(num));
          } else {
            // Caso fallback: todo al número o intentar inferir
            // Si permitimos editable en dropdown sería ideal, pero por ahora estricto
          }
        }
      }
    }
  }, [value]);

  const formatPhoneNumber = (nums: string) => {
    // Formato visual: 123-4567
    const clean = nums.replace(/\D/g, "");
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
    }
    return clean;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (!inputValue) {
      setPhoneNumber("");
      if (onChange) onChange(`${areaCode}-`);
      return;
    }

    const rawNums = inputValue.replace(/[^0-9]/g, "");
    const limitedNums = rawNums.slice(0, 7); // Máximo 7 dígitos

    let formatted = limitedNums;
    if (limitedNums.length > 3) {
      formatted = `${limitedNums.slice(0, 3)}-${limitedNums.slice(3)}`;
    }

    setPhoneNumber(formatted);

    // Guardamos limpio: 04141234567 o con guion 0414-1234567?
    // Prefiero con guion para legibilidad: 0414-1234567
    if (onChange) {
      onChange(`${areaCode}-${formatted.replace(/-/g, "")}`);
    }
  };

  const handleAreaChange = (e: { value: string }) => {
    setAreaCode(e.value);
    const cleanNum = phoneNumber.replace(/-/g, "");
    if (onChange) {
      onChange(`${e.value}-${cleanNum}`);
    }
  };

  return (
    <div className={classNames("flex gap-2", className)}>
      <Dropdown
        value={areaCode}
        options={AREA_CODES}
        onChange={handleAreaChange}
        optionLabel="label"
        optionValue="value"
        filter
        className={classNames("w-8rem", { "p-invalid": error })}
        pt={{
          input: { className: "text-center font-bold" },
        }}
      />

      <InputText
        id={id}
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={classNames("w-full", { "p-invalid": error })}
        maxLength={8} // 7 dígitos + 1 guion
        keyfilter="int"
      />
    </div>
  );
};

export default PhoneInput;
