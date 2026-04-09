import React from "react";
import { Button } from "primereact/button";

interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  isUpdate?: boolean; // Determina si mostrar "Actualizar" o "Crear" automáticamente
  formId?: string; // ID del formulario HTML al que se conectará el botón de submit (útil cuando los botones están fuera del <form>)
}

const FormActionButtons: React.FC<FormActionButtonsProps> = ({
  onCancel,
  isSubmitting = false,
  submitLabel,
  cancelLabel = "Cancelar",
  isUpdate = false,
  formId,
}) => {
  const defaultSubmitLabel = isUpdate ? "Actualizar" : "Crear";

  return (
    <div className="flex w-full gap-2">
      <Button
        label={cancelLabel}
        icon="pi pi-times"
        severity="secondary"
        onClick={onCancel}
        type="button"
        disabled={isSubmitting}
        className="flex-1"
      />
      <Button
        label={submitLabel || defaultSubmitLabel}
        icon="pi pi-check"
        type="submit"
        form={formId}
        loading={isSubmitting}
        className="flex-1"
      />
    </div>
  );
};

export default FormActionButtons;
