"use client";

import React from "react";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";

interface BackdateFieldProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  label?: string;
  placeholder?: string;
  warningText?: string;
  disabled?: boolean;
}

const BackdateField = ({
  value,
  onChange,
  label = "Fecha efectiva",
  placeholder = "Dejar vacío para usar fecha actual",
  warningText = "Está registrando una fecha pasada. La fecha de creación del sistema (auditoría) queda intacta.",
  disabled = false,
}: BackdateFieldProps) => {
  const now = new Date();
  const isPast = value ? value.getTime() < now.getTime() - 60_000 : false;

  return (
    <div className="field mb-2">
      <label className="font-bold text-900 text-sm block mb-1">{label}</label>
      <Calendar
        value={value}
        onChange={(e) => onChange((e.value as Date | null) ?? null)}
        showTime
        showIcon
        showButtonBar
        maxDate={now}
        dateFormat="dd/mm/yy"
        hourFormat="24"
        placeholder={placeholder}
        className="w-full"
        disabled={disabled}
      />
      {isPast && (
        <div className="mt-2">
          <Message severity="warn" text={warningText} />
        </div>
      )}
    </div>
  );
};

export default BackdateField;
