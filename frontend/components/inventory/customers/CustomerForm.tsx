"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { customerSchema } from "@/libs/zods/inventory/customerZod";
import {
  createCustomer,
  updateCustomer,
} from "@/app/api/inventory/customerService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import PhoneInput from "@/components/common/PhoneInput";
import RifInput from "@/components/common/RifInput";

type FormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer: any;
  hideFormDialog: () => void;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  setCustomer: (customer: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
  onCustomerCreated?: (customer: any) => void;
}

const tipoOptions = [
  { label: "Persona", value: "persona" },
  { label: "Empresa", value: "empresa" },
];

const estadoOptions = [
  { label: "Activo", value: "activo" },
  { label: "Inactivo", value: "inactivo" },
];

const CustomerForm = ({
  customer,
  toast,
  hideFormDialog,
  customers,
  setCustomers,
  showToast,
  onCustomerCreated,
}: CustomerFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      tipo: "persona",
      estado: "activo",
    },
  });

  const tipoValue = watch("tipo");

  useEffect(() => {
    if (customer) {
      // Set form values
      Object.keys(customer).forEach((key) => {
        const k = key as keyof FormData;
        const val = (customer as any)[key];
        setValue(k, val as any);
      });
    }
  }, [customer, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = { ...data };

      if (customer) {
        const updatedCustomer = await updateCustomer(customer.id, payload);
        console.log(updatedCustomer.customer.id);
        const updatedCustomers = customers.map((c) =>
          c.id === updatedCustomer.customer.id ? updatedCustomer.customer : c
        );
        setCustomers(updatedCustomers);
        showToast("success", "Éxito", "Cliente actualizado");
      } else {
        const newCustomer = await createCustomer(payload);
        console.log(newCustomer);
        setCustomers([newCustomer.customer, ...customers]);
        showToast("success", "Éxito", "Cliente creado");
        // Llamar al callback si existe
        if (onCustomerCreated) {
          onCustomerCreated(newCustomer.customer);
        }
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const getFormErrorMessage = (name: string) => {
    return (
      errors[name as keyof FormData] && (
        <small className="p-error">
          {errors[name as keyof FormData]?.message}
        </small>
      )
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="card p-fluid surface-50 p-3 border-round shadow-2">
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-bookmark mr-3 text-primary text-3xl"></i>
              {customer ? "Modificar Cliente" : "Crear Cliente"}
            </h2>
          </div>
        </div>
        <div className="grid">
          {/* Nombre */}
          <div className="col-12 md:col-6">
            <label htmlFor="nombre" className="block text-900 font-medium mb-2">
              Nombre *
            </label>
            <InputText
              id="nombre"
              {...register("nombre")}
              className={classNames(
                { "p-invalid": errors.nombre },
                { "p-filled": filledInput }
              )}
              placeholder="Ingrese el nombre"
            />
            {getFormErrorMessage("nombre")}
          </div>

          {/* Tipo */}
          <div className="col-12 md:col-6">
            <label htmlFor="tipo" className="block text-900 font-medium mb-2">
              Tipo *
            </label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="tipo"
                  {...field}
                  options={tipoOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione el tipo"
                  className={classNames(
                    { "p-invalid": errors.tipo },
                    { "p-filled": filledInput }
                  )}
                />
              )}
            />
            {getFormErrorMessage("tipo")}
          </div>

          {/* Teléfono */}
          <div className="col-12 md:col-6">
            <label
              htmlFor="telefono"
              className="block text-900 font-medium mb-2"
            >
              Teléfono
            </label>
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.telefono}
                  placeholder="1234567"
                />
              )}
            />
            {getFormErrorMessage("telefono")}
          </div>

          {/* Correo */}
          <div className="col-12 md:col-6">
            <label htmlFor="correo" className="block text-900 font-medium mb-2">
              Correo
            </label>
            <InputText
              id="correo"
              {...register("correo")}
              className={classNames(
                { "p-invalid": errors.correo },
                { "p-filled": filledInput }
              )}
              placeholder="Ingrese el correo"
            />
            {getFormErrorMessage("correo")}
          </div>

          {/* Dirección */}
          <div className="col-12">
            <label
              htmlFor="direccion"
              className="block text-900 font-medium mb-2"
            >
              Dirección
            </label>
            <InputText
              id="direccion"
              {...register("direccion")}
              className={classNames(
                { "p-invalid": errors.direccion },
                { "p-filled": filledInput }
              )}
              placeholder="Ingrese la dirección"
            />
            {getFormErrorMessage("direccion")}
          </div>

          {/* RIF - Solo para empresas */}
          {tipoValue === "empresa" && (
            <div className="col-12 md:col-6">
              <label htmlFor="rif" className="block text-900 font-medium mb-2">
                RIF
              </label>
              <Controller
                name="rif"
                control={control}
                render={({ field }) => (
                  <RifInput
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.rif}
                    placeholder="12345678"
                  />
                )}
              />
              {getFormErrorMessage("rif")}
            </div>
          )}

          {/* Razón Social - Solo para empresas */}
          {tipoValue === "empresa" && (
            <div className="col-12 md:col-6">
              <label
                htmlFor="razonSocial"
                className="block text-900 font-medium mb-2"
              >
                Razón Social
              </label>
              <InputText
                id="razonSocial"
                {...register("razonSocial")}
                className={classNames(
                  { "p-invalid": errors.razonSocial },
                  { "p-filled": filledInput }
                )}
                placeholder="Ingrese la razón social"
              />
              {getFormErrorMessage("razonSocial")}
            </div>
          )}

          {/* Notas */}
          <div className="col-12">
            <label htmlFor="notas" className="block text-900 font-medium mb-2">
              Notas
            </label>
            <Controller
              name="notas"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="notas"
                  {...field}
                  rows={3}
                  className={classNames(
                    { "p-invalid": errors.notas },
                    { "p-filled": filledInput }
                  )}
                  placeholder="Ingrese notas adicionales"
                />
              )}
            />
            {getFormErrorMessage("notas")}
          </div>

          {/* Estado - Solo visible al modificar */}
          {customer && (
            <div className="col-12 md:col-6">
              <label
                htmlFor="estado"
                className="block text-900 font-medium mb-2"
              >
                Estado *
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    {...field}
                    options={estadoOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione el estado"
                    className={classNames(
                      { "p-invalid": errors.estado },
                      { "p-filled": filledInput }
                    )}
                  />
                )}
              />
              {getFormErrorMessage("estado")}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={hideFormDialog}
            type="button"
            disabled={submitting}
          />
          <Button
            type="submit"
            label={customer ? "Actualizar" : "Crear"}
            icon="pi pi-check"
            loading={submitting}
            disabled={submitting}
          />
        </div>
      </div>
    </form>
  );
};

export default CustomerForm;
