"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { BayWithDetails } from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import { exitBay, type ExitBayData } from "@/app/api/serviceBayService";

interface ReleaseBayDialogProps {
  visible: boolean;
  bay: BayWithDetails | null;
  onHide: () => void;
  // onSuccess can accept an optional updated bay payload returned by the API
  // or a second options argument: onSuccess(updatedBay?, { optimisticClearedId?: string })
  onSuccess: (
    updatedBay?: any,
    options?: { optimisticClearedId?: string }
  ) => void | Promise<void>;
}

export default function ReleaseBayDialog({
  visible,
  bay,
  onHide,
  onSuccess,
}: ReleaseBayDialogProps) {
  const toast = useRef<Toast>(null);

  // Estado del formulario
  const [notes, setNotes] = useState("");
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (visible && bay?.currentAssignment) {
      // Preseleccionar todos los técnicos
      const allTechIds = bay.currentAssignment.technicians.map(
        (t) => t.technician
      );
      console.log("Setting selected technicians:", allTechIds);
      console.log(
        "Current assignment technicians:",
        bay.currentAssignment.technicians
      );
      setSelectedTechnicians(allTechIds);
      setNotes("");
    }
  }, [visible, bay]);

  if (!bay || !bay.currentAssignment) return null;

  // Calcular tiempo trabajado
  const getWorkedTime = () => {
    if (!bay.currentAssignment?.entryTime)
      return { hours: 0, minutes: 0, display: "0h 0m" };

    const entry = new Date(bay.currentAssignment.entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      display: `${hours}h ${minutes}m`,
      totalHours: (hours + minutes / 60).toFixed(2),
    };
  };

  const workedTime = getWorkedTime();

  // Toggle selección de técnico
  const toggleTechnician = (techId: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(techId)
        ? prev.filter((id) => id !== techId)
        : [...prev, techId]
    );
  };

  // Seleccionar/deseleccionar todos
  const toggleAll = () => {
    const allTechIds = bay.currentAssignment!.technicians.map(
      (t) => t.technician
    );
    if (selectedTechnicians.length === allTechIds.length) {
      setSelectedTechnicians([]);
    } else {
      setSelectedTechnicians(allTechIds);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (selectedTechnicians.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Selecciona al menos un técnico para liberar",
        life: 3000,
      });
      return;
    }

    setSubmitting(true);

    try {
      // Preparar datos según la API
      const exitData: ExitBayData = {};

      // Agregar notas solo si no están vacías
      if (notes.trim()) {
        exitData.notes = notes.trim();
      }

      if (selectedTechnicians.length === 1) {
        // Un solo técnico
        exitData.technician = selectedTechnicians[0];
      } else {
        // Múltiples técnicos
        exitData.technicians = selectedTechnicians;
      }

      console.log("Exit data being sent:", exitData);
      console.log("Selected technicians:", selectedTechnicians);

      // Validar existencia de orden de trabajo
      if (!bay?.currentAssignment?.workOrder) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró la orden de trabajo para liberar.",
          life: 3000,
        });
        setSubmitting(false);
        return;
      }
      // Llamar al endpoint
      const response = await exitBay(bay.currentAssignment.workOrder, exitData);

      if (response.ok) {
        const releasedCount = selectedTechnicians.length;
        const totalCount = bay.currentAssignment!.technicians.length;
        const allReleased = releasedCount === totalCount;

        toast.current?.show({
          severity: "success",
          summary: allReleased ? "Bahía Liberada" : "Técnico(s) Liberado(s)",
          detail: allReleased
            ? `${bay.name} ha sido liberada. Tiempo trabajado: ${workedTime.totalHours} hrs`
            : `${releasedCount} técnico(s) liberado(s). ${
                totalCount - releasedCount
              } permanecen asignados.`,
          life: 4000,
        });

        // Resetear formulario
        resetForm();

        // Notificar éxito, pasar la bahía actualizada si el backend la devuelve
        setTimeout(async () => {
          try {
            // Si el backend indica que la bahía fue liberada y devuelve la bahía actualizada
            if ((response as any).bayReleased && (response as any).bay) {
              await onSuccess((response as any).bay);
            } else if ((response as any).bay) {
              // Fallback: si devuelve bay pero no bayReleased, aún así actualizar
              await onSuccess((response as any).bay);
            } else {
              // Notify caller that we optimistically cleared this bay locally
              await onSuccess(undefined, { optimisticClearedId: bay._id });
            }
          } catch (e) {
            // Ignorar errores de refresco aquí; ya mostramos toast
            console.error("Error in onSuccess refresh:", e);
          }
          onHide();
        }, 1000);
      } else {
        throw new Error(response.msg || "Error al liberar");
      }
    } catch (error: any) {
      console.error("Error releasing bay:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.msg ||
          error.message ||
          "No se pudo liberar la bahía",
        life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNotes("");
    setSelectedTechnicians([]);
  };

  const handleCancel = () => {
    resetForm();
    onHide();
  };

  const allTechnicians = bay.currentAssignment.technicians;
  const allSelected = selectedTechnicians.length === allTechnicians.length;

  const footer = (
    <div className="flex justify-content-between align-items-center">
      <div className="text-sm text-600">
        {selectedTechnicians.length} de {allTechnicians.length} técnico(s)
        seleccionado(s)
      </div>
      <div className="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          onClick={handleCancel}
          disabled={submitting}
        />
        <Button
          label="Liberar"
          icon="pi pi-sign-out"
          severity="danger"
          onClick={handleSubmit}
          loading={submitting}
          disabled={selectedTechnicians.length === 0}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-sign-out text-orange-500" />
            <span>Liberar Bahía</span>
          </div>
        }
        visible={visible}
        style={{ width: "600px" }}
        onHide={handleCancel}
        footer={footer}
        modal
        draggable={false}
        resizable={false}
      >
        {/* Información de la bahía */}
        <div className="p-3 surface-100 border-round mb-4">
          <div className="flex justify-content-between align-items-center">
            <div>
              <div className="text-sm text-600 mb-1">Bahía</div>
              <div className="font-bold text-900">{bay.name}</div>
              <div className="text-sm text-600">{bay.code}</div>
            </div>
            <div>
              <div className="text-sm text-600 mb-1">Orden de Trabajo</div>
              <Tag value={bay.currentAssignment.workOrder} severity="info" />
            </div>
          </div>
        </div>

        {/* Resumen de tiempo */}
        <div className="grid mb-4">
          <div className="col-12 md:col-6">
            <div className="p-3 border-round surface-50">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-clock text-primary" />
                <span className="text-sm text-600">Entrada</span>
              </div>
              <div className="font-semibold text-900">
                {new Date(bay.currentAssignment.entryTime).toLocaleString(
                  "es-MX",
                  {
                    dateStyle: "short",
                    timeStyle: "short",
                  }
                )}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="p-3 border-round surface-50">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-hourglass text-orange-500" />
                <span className="text-sm text-600">Tiempo Trabajado</span>
              </div>
              <div className="font-bold text-2xl text-orange-500">
                {workedTime.display}
              </div>
              <small className="text-xs text-500">
                Aprox. {workedTime.totalHours} hrs
              </small>
            </div>
          </div>
        </div>

        <Divider />

        {/* Selección de técnicos */}
        <div className="mb-4">
          <div className="flex justify-content-between align-items-center mb-3">
            <h3 className="text-base font-semibold m-0">Técnicos a Liberar</h3>
            <Button
              label={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              icon={`pi ${allSelected ? "pi-times" : "pi-check"}`}
              size="small"
              text
              onClick={toggleAll}
            />
          </div>

          {allTechnicians.length === 0 ? (
            <Message
              severity="warn"
              text="No hay técnicos asignados"
              className="w-full"
            />
          ) : (
            <div className="flex flex-column gap-2">
              {allTechnicians.map((tech) => {
                const isSelected = selectedTechnicians.includes(
                  tech.technician
                );
                return (
                  <div
                    key={tech.technician}
                    className={`p-3 border-round cursor-pointer transition-colors ${
                      isSelected
                        ? "surface-100 border-2 border-primary"
                        : "surface-50 border-2 border-transparent"
                    }`}
                    onClick={() => toggleTechnician(tech.technician)}
                  >
                    <div className="flex align-items-center justify-content-between">
                      <div className="flex align-items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleTechnician(tech.technician)}
                        />
                        <div>
                          <div className="font-semibold text-900">
                            {tech.name}
                          </div>
                          <div className="text-sm text-600">
                            Asignado:{" "}
                            {new Date(tech.assignedAt).toLocaleString("es-MX", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </div>
                      <Tag
                        value={
                          tech.role === "principal" ? "Principal" : "Asistente"
                        }
                        severity={
                          tech.role === "principal" ? "success" : "secondary"
                        }
                        icon={
                          tech.role === "principal"
                            ? "pi pi-star-fill"
                            : "pi pi-star"
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Divider />

        {/* Notas de salida */}
        <div>
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Notas de Salida (opcional)
          </label>
          <InputTextarea
            id="notes"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNotes(e.target.value)
            }
            rows={3}
            placeholder="Trabajo completado, observaciones, pendientes..."
            className="w-full"
            maxLength={500}
          />
          <small className="text-600">{notes.length}/500 caracteres</small>
        </div>

        {/* Advertencia si liberan todos */}
        {selectedTechnicians.length === allTechnicians.length && (
          <Message
            severity="info"
            className="mt-3"
            content={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle" />
                <span>
                  Al liberar todos los técnicos, la bahía quedará disponible
                  para nuevas asignaciones.
                </span>
              </div>
            }
          />
        )}
      </Dialog>
    </>
  );
}
