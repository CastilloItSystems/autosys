"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

// Interfaces and schemas
import { WorkOrderStatus } from "@/libs/interfaces/workshop";
import {
  workOrderStatusSchema,
  WorkOrderStatusFormData,
} from "@/libs/zods/workshop";

// API functions
import {
  createStatus,
  updateStatusById,
} from "@/app/api/workshop/workOrderStatusService";

interface WorkOrderStatusFormProps {
  visible: boolean;
  onHide: () => void;
  status: WorkOrderStatus | null;
  onSuccess: () => void;
}

const WorkOrderStatusForm: React.FC<WorkOrderStatusFormProps> = ({
  visible,
  onHide,
  status,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = React.useRef<Toast>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderStatusFormData>({
    resolver: zodResolver(workOrderStatusSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      color: "",
      icono: "",
      orden: 0,
      tipo: undefined,
      transicionesPermitidas: [],
      requiereAprobacion: false,
      requiereDocumentacion: false,
      notificarCliente: false,
      notificarTecnico: false,
      activo: true,
      collapsed: false,
    },
  });

  // Reset form when dialog opens/closes or status changes
  useEffect(() => {
    if (visible) {
      if (status) {
        // Edit mode - populate form with existing data
        reset({
          codigo: status.codigo || "",
          nombre: status.nombre || "",
          descripcion: status.descripcion || "",
          color: status.color || "",
          icono: status.icono || "",
          orden: status.orden || 0,
          tipo: status.tipo,
          transicionesPermitidas: status.transicionesPermitidas || [],
          requiereAprobacion: status.requiereAprobacion || false,
          requiereDocumentacion: status.requiereDocumentacion || false,
          notificarCliente: status.notificarCliente || false,
          notificarTecnico: status.notificarTecnico || false,
          activo: status.activo !== undefined ? status.activo : true,
          collapsed: status.collapsed || false,
        });
      } else {
        // Create mode - reset to defaults
        reset({
          codigo: "",
          nombre: "",
          descripcion: "",
          color: "",
          icono: "",
          orden: 0,
          tipo: undefined,
          transicionesPermitidas: [],
          requiereAprobacion: false,
          requiereDocumentacion: false,
          notificarCliente: false,
          notificarTecnico: false,
          activo: true,
          collapsed: false,
        });
      }
    }
  }, [visible, status, reset]);

  const onSubmit = async (data: WorkOrderStatusFormData) => {
    console.log("data", data);
    try {
      setIsLoading(true);

      if (status?._id) {
        // Update existing status
        await updateStatusById(status._id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Estado de orden de trabajo actualizado correctamente",
        });
      } else {
        // Create new status
        await createStatus(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Estado de orden de trabajo creado correctamente",
        });
      }

      onSuccess();
      onHide();
    } catch (error) {
      console.error("Error saving work order status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el estado de orden de trabajo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onHide();
  };

  const typeOptions = [
    { label: "Inicial", value: "inicial" },
    { label: "Intermedio", value: "intermedio" },
    { label: "Final", value: "final" },
    { label: "Cancelado", value: "cancelado" },
  ];

  const dialogFooter = (
    // <div className="flex justify-content-end gap-2">
    //   {/* <Button
    //     label="Cancelar"
    //     icon="pi pi-times"
    //     outlined
    //     onClick={handleCancel}
    //     disabled={isSubmitting || isLoading}
    //   />
    //   <Button
    //     label={status ? "Actualizar" : "Crear"}
    //     icon={
    //       isSubmitting || isLoading ? "pi pi-spin pi-spinner" : "pi pi-check"
    //     }
    //     onClick={handleSubmit(onSubmit)}
    //     disabled={isSubmitting || isLoading}
    //   />
    // </div> */}
    <div className="flex gap-2 my-4 w-full">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={handleCancel}
        type="button"
        className="flex-1"
        disabled={isSubmitting || isLoading}
        // disabled={submitting}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSubmit(onSubmit)}
        className="flex-1"
        disabled={isSubmitting || isLoading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={handleCancel}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
                {status ? "Editar Estado" : "Crear Estado de Orden de Trabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        style={{ width: "600px" }}
        footer={dialogFooter}
        closable={!isSubmitting && !isLoading}
      >
        {isLoading && !status ? (
          <div className="flex justify-content-center align-items-center p-4">
            <ProgressSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
            <div className="grid">
              {/* Código */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="codigo"
                  className="block text-900 font-medium mb-2"
                >
                  Código *
                </label>
                <Controller
                  name="codigo"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="codigo"
                      {...field}
                      placeholder="Ej: PENDIENTE"
                      className={errors.codigo ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                    />
                  )}
                />
                {errors.codigo && (
                  <small className="p-error">{errors.codigo.message}</small>
                )}
              </div>

              {/* Nombre */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="nombre"
                  className="block text-900 font-medium mb-2"
                >
                  Nombre *
                </label>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="nombre"
                      {...field}
                      placeholder="Ej: Pendiente"
                      className={errors.nombre ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                    />
                  )}
                />
                {errors.nombre && (
                  <small className="p-error">{errors.nombre.message}</small>
                )}
              </div>

              {/* Tipo */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="tipo"
                  className="block text-900 font-medium mb-2"
                >
                  Tipo
                </label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      id="tipo"
                      {...field}
                      options={typeOptions}
                      placeholder="Seleccionar tipo"
                      className={errors.tipo ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                      showClear
                    />
                  )}
                />
                {errors.tipo && (
                  <small className="p-error">{errors.tipo.message}</small>
                )}
              </div>

              {/* Orden */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="orden"
                  className="block text-900 font-medium mb-2"
                >
                  Orden
                </label>
                <Controller
                  name="orden"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="orden"
                      {...field}
                      placeholder="0"
                      min={0}
                      className={errors.orden ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                    />
                  )}
                />
                {errors.orden && (
                  <small className="p-error">{errors.orden.message}</small>
                )}
              </div>

              {/* Color */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="color"
                  className="block text-900 font-medium mb-2"
                >
                  Color
                </label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <div className="flex align-items-center gap-2">
                      <ColorPicker
                        {...field}
                        disabled={isSubmitting || isLoading}
                      />
                      <InputText
                        {...field}
                        placeholder="#000000"
                        className={errors.color ? "p-invalid" : ""}
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  )}
                />
                {errors.color && (
                  <small className="p-error">{errors.color.message}</small>
                )}
              </div>

              {/* Ícono */}
              <div className="col-12 md:col-6">
                <label
                  htmlFor="icono"
                  className="block text-900 font-medium mb-2"
                >
                  Ícono
                </label>
                <Controller
                  name="icono"
                  control={control}
                  render={({ field }) => (
                    <InputText
                      id="icono"
                      {...field}
                      placeholder="pi pi-clock"
                      className={errors.icono ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                    />
                  )}
                />
                {errors.icono && (
                  <small className="p-error">{errors.icono.message}</small>
                )}
              </div>

              {/* Descripción */}
              <div className="col-12">
                <label
                  htmlFor="descripcion"
                  className="block text-900 font-medium mb-2"
                >
                  Descripción
                </label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <InputTextarea
                      id="descripcion"
                      {...field}
                      rows={3}
                      placeholder="Descripción del estado..."
                      className={errors.descripcion ? "p-invalid" : ""}
                      disabled={isSubmitting || isLoading}
                    />
                  )}
                />
                {errors.descripcion && (
                  <small className="p-error">
                    {errors.descripcion.message}
                  </small>
                )}
              </div>

              {/* Checkboxes */}
              <div className="col-12">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <Controller
                      name="requiereAprobacion"
                      control={control}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            id="requiereAprobacion"
                            {...field}
                            checked={field.value || false}
                            disabled={isSubmitting || isLoading}
                          />
                          <label htmlFor="requiereAprobacion" className="ml-2">
                            Requiere aprobación
                          </label>
                        </div>
                      )}
                    />
                  </div>

                  <Controller
                    name="requiereDocumentacion"
                    control={control}
                    render={({ field }) => (
                      <div className="flex align-items-center">
                        <Checkbox
                          id="requiereDocumentacion"
                          {...field}
                          checked={field.value || false}
                          disabled={isSubmitting || isLoading}
                        />
                        <label htmlFor="requiereDocumentacion" className="ml-2">
                          Requiere documentación
                        </label>
                      </div>
                    )}
                  />

                  <div className="col-12 md:col-6">
                    <Controller
                      name="notificarCliente"
                      control={control}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            id="notificarCliente"
                            {...field}
                            checked={field.value || false}
                            disabled={isSubmitting || isLoading}
                          />
                          <label htmlFor="notificarCliente" className="ml-2">
                            Notificar cliente
                          </label>
                        </div>
                      )}
                    />
                  </div>

                  <div className="col-12 md:col-6">
                    <Controller
                      name="notificarTecnico"
                      control={control}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            id="notificarTecnico"
                            {...field}
                            checked={field.value || false}
                            disabled={isSubmitting || isLoading}
                          />
                          <label htmlFor="notificarTecnico" className="ml-2">
                            Notificar técnico
                          </label>
                        </div>
                      )}
                    />
                  </div>

                  <div className="col-12 md:col-6">
                    <Controller
                      name="activo"
                      control={control}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            id="activo"
                            {...field}
                            checked={field.value || false}
                            disabled={isSubmitting || isLoading}
                          />
                          <label htmlFor="activo" className="ml-2">
                            Activo
                          </label>
                        </div>
                      )}
                    />
                  </div>

                  <div className="col-12 md:col-6">
                    <Controller
                      name="collapsed"
                      control={control}
                      render={({ field }) => (
                        <div className="flex align-items-center">
                          <Checkbox
                            id="collapsed"
                            {...field}
                            checked={field.value || false}
                            disabled={isSubmitting || isLoading}
                          />
                          <label htmlFor="collapsed" className="ml-2">
                            Colapsado por defecto
                          </label>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
};

export default WorkOrderStatusForm;
