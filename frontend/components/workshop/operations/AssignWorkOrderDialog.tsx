"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { BayWithDetails } from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import { getWorkOrders } from "@/app/api/workshop/workOrderService";
import { getUsers } from "@/app/api/userService";
import { enterBay, type EnterBayData } from "@/app/api/serviceBayService";
import { Usuario } from "@/libs/interfaces/authInterface";

interface AssignWorkOrderDialogProps {
  visible: boolean;
  bay: BayWithDetails | null;
  onHide: () => void;
  onSuccess: () => void;
}

interface TechnicianAssignment {
  technician: string;
  role: "principal" | "asistente";
}

export default function AssignWorkOrderDialog({
  visible,
  bay,
  onHide,
  onSuccess,
}: AssignWorkOrderDialogProps) {
  const toast = useRef<Toast>(null);

  // Estado del formulario
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(
    null
  );
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [technicianRoles, setTechnicianRoles] = useState<
    Record<string, "principal" | "asistente">
  >({});
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");

  // Estado de carga
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos al abrir el diálogo
  useEffect(() => {
    if (visible && bay) {
      loadData();
    }
  }, [visible, bay]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Cargar órdenes de trabajo pendientes o en proceso
      const workOrdersResponse = await getWorkOrders();

      // Filtrar OTs que no están asignadas a una bahía y están pendientes o en proceso
      const availableOrders =
        workOrdersResponse.data?.filter(
          (wo: any) => !wo.currentServiceBay
          //  &&
          //   (wo.status === "pendiente" || wo.status === "en_proceso")
        ) || [];

      setWorkOrders(availableOrders);

      // Cargar técnicos activos
      const usersResponse = await getUsers();
      const activeTechnicians =
        usersResponse.users?.filter(
          (user: any) => user.estado === "true" && !user.eliminado
        ) || [];

      setTechnicians(activeTechnicians);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos",
        life: 3000,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleTechnicianChange = (techIds: string[]) => {
    setSelectedTechnicians(techIds);

    // Asignar roles automáticamente
    const newRoles: Record<string, "principal" | "asistente"> = {};
    techIds.forEach((techId, index) => {
      // El primer técnico es principal, los demás asistentes
      newRoles[techId] = index === 0 ? "principal" : "asistente";
    });
    setTechnicianRoles(newRoles);
  };

  const toggleTechnicianRole = (techId: string) => {
    setTechnicianRoles((prev) => ({
      ...prev,
      [techId]: prev[techId] === "principal" ? "asistente" : "principal",
    }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedWorkOrder) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Selecciona una orden de trabajo",
        life: 3000,
      });
      return;
    }

    if (selectedTechnicians.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Selecciona al menos un técnico",
        life: 3000,
      });
      return;
    }

    if (!bay || !bay._id) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Bahía no válida",
        life: 3000,
      });
      return;
    }

    // Validar capacidad máxima
    if (selectedTechnicians.length > bay.maxTechnicians) {
      toast.current?.show({
        severity: "warn",
        summary: "Capacidad excedida",
        detail: `La bahía solo acepta ${bay.maxTechnicians} técnico(s)`,
        life: 3000,
      });
      return;
    }

    // Validar que haya al menos un técnico principal
    const hasPrincipal = Object.values(technicianRoles).some(
      (role) => role === "principal"
    );
    if (!hasPrincipal) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe haber al menos un técnico principal",
        life: 3000,
      });
      return;
    }

    setSubmitting(true);

    try {
      // Preparar datos según la API
      const assignmentData: EnterBayData = {
        serviceBay: bay._id,
        notes: notes.trim() || undefined,
      };

      if (selectedTechnicians.length === 1) {
        // Un solo técnico
        assignmentData.technician = selectedTechnicians[0];
        assignmentData.role = technicianRoles[selectedTechnicians[0]];
        assignmentData.estimatedHours = estimatedHours;
      } else {
        // Múltiples técnicos
        assignmentData.technicians = selectedTechnicians.map((techId) => ({
          technician: techId,
          role: technicianRoles[techId],
          estimatedHours: estimatedHours,
        }));
      }

      // Llamar al endpoint
      const response = await enterBay(selectedWorkOrder, assignmentData);

      if (response.ok) {
        toast.current?.show({
          severity: "success",
          summary: "Asignación exitosa",
          detail: `OT asignada a ${bay.name}`,
          life: 3000,
        });

        // Resetear formulario
        resetForm();

        // Notificar éxito y cerrar
        setTimeout(() => {
          onSuccess();
          onHide();
        }, 1000);
      } else {
        throw new Error(response.msg || "Error al asignar");
      }
    } catch (error: any) {
      console.error("Error assigning work order:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.msg ||
          error.message ||
          "No se pudo asignar la orden de trabajo",
        life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedWorkOrder(null);
    setSelectedTechnicians([]);
    setTechnicianRoles({});
    setEstimatedHours(2);
    setNotes("");
  };

  const handleCancel = () => {
    resetForm();
    onHide();
  };

  if (!bay) return null;

  const workOrderOptions = workOrders.map((wo) => ({
    label: `${wo.numeroOrden} - ${wo.customer?.nombre || "Sin cliente"}`,
    value: wo._id,
  }));

  const technicianOptions = technicians.map((tech) => ({
    label: tech.nombre,
    value: tech._id || tech.id,
  }));

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={handleCancel}
        disabled={submitting}
      />
      <Button
        label="Asignar"
        icon="pi pi-check"
        severity="success"
        onClick={handleSubmit}
        loading={submitting}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-plus-circle text-primary" />
            <span>Asignar Orden de Trabajo</span>
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
          <div className="flex align-items-center justify-content-between">
            <div>
              <div className="text-sm text-600 mb-1">Bahía seleccionada</div>
              <div className="font-bold text-900">{bay.name}</div>
              <div className="text-sm text-600">{bay.code}</div>
            </div>
            <Tag
              value={`Capacidad: ${bay.maxTechnicians} técnico(s)`}
              severity="info"
              icon="pi pi-users"
            />
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-content-center align-items-center p-5">
            <i className="pi pi-spin pi-spinner text-4xl text-primary" />
          </div>
        ) : (
          <div className="flex flex-column gap-4">
            {/* Selector de Orden de Trabajo */}
            <div>
              <label
                htmlFor="workOrder"
                className="block text-900 font-medium mb-2"
              >
                Orden de Trabajo <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="workOrder"
                value={selectedWorkOrder}
                options={workOrderOptions}
                onChange={(e) => setSelectedWorkOrder(e.value)}
                placeholder="Selecciona una orden de trabajo"
                filter
                showClear
                className="w-full"
                emptyFilterMessage="No se encontraron órdenes"
                emptyMessage="No hay órdenes disponibles"
              />
              {workOrders.length === 0 && (
                <Message
                  severity="info"
                  text="No hay órdenes de trabajo disponibles"
                  className="mt-2 w-full"
                />
              )}
            </div>

            <Divider />

            {/* Selector de Técnicos */}
            <div>
              <label
                htmlFor="technicians"
                className="block text-900 font-medium mb-2"
              >
                Técnicos <span className="text-red-500">*</span>
              </label>
              <MultiSelect
                id="technicians"
                value={selectedTechnicians}
                options={technicianOptions}
                onChange={(e) => handleTechnicianChange(e.value)}
                placeholder="Selecciona técnico(s)"
                maxSelectedLabels={3}
                className="w-full"
                filter
                showSelectAll={false}
                emptyFilterMessage="No se encontraron técnicos"
              />
              {technicians.length === 0 && (
                <Message
                  severity="warn"
                  text="No hay técnicos disponibles"
                  className="mt-2 w-full"
                />
              )}
            </div>

            {/* Roles de técnicos seleccionados */}
            {selectedTechnicians.length > 0 && (
              <div className="border-1 surface-border border-round p-3">
                <div className="text-sm font-medium text-900 mb-2">
                  Roles asignados:
                </div>
                <div className="flex flex-column gap-2">
                  {selectedTechnicians.map((techId) => {
                    const tech = technicians.find((t) => t._id === techId);
                    const role = technicianRoles[techId];
                    return (
                      <div
                        key={techId}
                        className="flex align-items-center justify-content-between p-2 surface-50 border-round"
                      >
                        <span className="text-900">{tech?.nombre}</span>
                        <Button
                          label={
                            role === "principal" ? "Principal" : "Asistente"
                          }
                          icon={
                            role === "principal"
                              ? "pi pi-star-fill"
                              : "pi pi-star"
                          }
                          severity={
                            role === "principal" ? "success" : "secondary"
                          }
                          size="small"
                          outlined
                          onClick={() => toggleTechnicianRole(techId)}
                          tooltip="Click para cambiar rol"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Divider />

            {/* Horas estimadas */}
            <div>
              <label
                htmlFor="estimatedHours"
                className="block text-900 font-medium mb-2"
              >
                Horas estimadas
              </label>
              <InputNumber
                id="estimatedHours"
                value={estimatedHours}
                onValueChange={(e) => setEstimatedHours(e.value || 0)}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={1}
                min={0.5}
                max={24}
                step={0.5}
                suffix=" hrs"
                className="w-full"
                showButtons
                buttonLayout="horizontal"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
              />
            </div>

            {/* Notas */}
            <div>
              <label
                htmlFor="notes"
                className="block text-900 font-medium mb-2"
              >
                Notas (opcional)
              </label>
              <InputTextarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                rows={3}
                placeholder="Agrega notas sobre la asignación..."
                className="w-full"
                maxLength={500}
              />
              <small className="text-600">{notes.length}/500 caracteres</small>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
