import React from "react";
import { Calendar } from "primereact/calendar";
import { classNames } from "primereact/utils";
import { Button } from "primereact/button";
import { Control, UseFormSetValue } from "react-hook-form";

interface CustomCalendarProps {
  name: string;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  calendarRef?: React.RefObject<Calendar>;
  isFieldEnabled?: boolean;
  locale?: string;
  value?: Date | null;
  onChange?: (value: Date | null) => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  name,
  control,
  setValue,
  calendarRef,
  isFieldEnabled = true,
  locale = "es",
  value,
  onChange,
}) => {
  const FooterTemplate = () => (
    <div className="flex justify-content-between p-2">
      <Button
        label="Hoy"
        icon="pi pi-clock"
        onClick={() => {
          setValue(name, new Date());
          calendarRef?.current?.hide();
        }}
        className="p-button-text p-button-sm"
      />
      <div>
        <Button
          label="Limpiar"
          icon="pi pi-eraser"
          onClick={() => {
            setValue(name, null);
            calendarRef?.current?.hide();
          }}
          className="p-button-text p-button-sm mr-2"
        />
        <Button
          label="Aceptar"
          icon="pi pi-check"
          onClick={() => calendarRef?.current?.hide()}
          className="p-button-text p-button-sm"
        />
      </div>
    </div>
  );

  return (
    <Calendar
      id={name}
      value={value || null}
      onChange={(e) => onChange?.(e.value as Date)}
      showTime
      hourFormat="24"
      className={classNames("w-full", {
        "p-invalid": false, // Se maneja desde el Controller padre
        "opacity-60 cursor-not-allowed": !isFieldEnabled,
      })}
      inputClassName="w-full"
      locale={locale}
      footerTemplate={FooterTemplate}
      ref={calendarRef}
      disabled={isFieldEnabled}
      dateFormat="dd/mm/yy"
      showIcon
      icon="pi pi-calendar"
    />
  );
};

export default CustomCalendar;
