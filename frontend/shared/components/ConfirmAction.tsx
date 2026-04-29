"use client";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";

export interface ConfirmActionOptions {
  /** El evento del botón (para posicionar el popup) */
  target: EventTarget & HTMLElement;
  /** Mensaje principal a mostrar */
  message: string;
  /** Ícono PrimeIcons — default: "pi pi-exclamation-triangle" */
  icon?: string;
  /** Color del ícono — default: "text-orange-500" */
  iconClass?: string;
  /** Etiqueta botón aceptar — default: "Sí" */
  acceptLabel?: string;
  /** Etiqueta botón rechazar — default: "No" */
  rejectLabel?: string;
  /** Severity del botón aceptar — default: "warning" */
  acceptSeverity?: "success" | "info" | "warning" | "danger" | "secondary";
  /** Callback al aceptar */
  onAccept: () => void;
  /** Callback al rechazar (opcional) */
  onReject?: () => void;
}

/**
 * Muestra un ConfirmPopup reutilizable en cualquier parte de la app.
 *
 * Uso:
 * ```tsx
 * // 1. Registrar <ConfirmActionPopup /> una vez en el componente (o layout)
 * // 2. Llamar confirmAction({ target: e.currentTarget, message: "...", onAccept: fn })
 * ```
 */
export function confirmAction({
  target,
  message,
  icon = "pi pi-exclamation-triangle",
  iconClass = "text-orange-500",
  acceptLabel = "Sí",
  rejectLabel = "No",
  acceptSeverity = "warning",
  onAccept,
  onReject,
}: ConfirmActionOptions) {
  confirmPopup({
    target,
    message: (
      <div className="flex flex-column align-items-center w-full gap-3 border-bottom-1 surface-border pb-3">
        <i className={`${icon} text-5xl ${iconClass}`} />
        <span className="text-center text-900">{message}</span>
      </div>
    ),
    acceptLabel,
    rejectLabel,
    acceptIcon: "pi pi-check",
    rejectIcon: "pi pi-times",
    acceptClassName: `p-button-sm p-button-${acceptSeverity}`,
    rejectClassName: "p-button-sm p-button-secondary p-button-outlined",
    accept: onAccept,
    reject: onReject,
  });
}

/**
 * Registra el portal del ConfirmPopup.
 * Colócalo una vez en el componente que llame a confirmAction.
 */
export { ConfirmPopup as ConfirmActionPopup };
