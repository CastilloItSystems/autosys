"use client";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRouter } from "next/navigation";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { InputSwitch } from "primereact/inputswitch";
import { InputTextarea } from "primereact/inputtextarea";
import { AxiosError } from "axios";
import { handleFormError } from "@/utils/errorHandlers";
import { empresaSchema, EmpresaFormData } from "@/libs/zods/empresaZod";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import { createEmpresa, updateEmpresa } from "@/app/api/empresaService";

interface EmpresaFormProps {
  empresa: Empresa | null;
  hideEmpresaFormDialog: () => void;
  empresas: Empresa[];
  setEmpresas: (empresas: Empresa[]) => void;
}

const EmpresaForm = ({
  empresa,
  hideEmpresaFormDialog,
  empresas,
  setEmpresas,
}: EmpresaFormProps) => {
  const toast = useRef<Toast | null>(null);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
  });

  useEffect(() => {
    if (empresa) {
      setValue("nombre", empresa.nombre);
      setValue("direccion", empresa.direccion || "");
      setValue("telefonos", empresa.telefonos || "");
      setValue("fax", empresa.fax || "");
      setValue("numerorif", empresa.numerorif || "");
      setValue("numeronit", empresa.numeronit || "");
      setValue("website", empresa.website || "");
      setValue("email", empresa.email || "");
      setValue("contacto", empresa.contacto || "");
      setValue("predeter", empresa.predeter);
      setValue("soporte1", empresa.soporte1 || "");
      setValue("soporte2", empresa.soporte2 || "");
      setValue("soporte3", empresa.soporte3 || "");
      setValue("data_usaweb", empresa.data_usaweb);
      setValue("data_servidor", empresa.data_servidor || "");
      setValue("data_usuario", empresa.data_usuario || "");
      setValue("data_password", empresa.data_password || "");
      setValue("data_port", empresa.data_port || "");
      setValue("licencia", empresa.licencia || "");
      setValue("historizada", empresa.historizada);
      setValue("masinfo", empresa.masinfo || "");
      setValue("usa_prefijo", empresa.usa_prefijo);
      setValue("name_prefijo", empresa.name_prefijo || "");
      setValue("dprefijobd", empresa.dprefijobd || "");
      setValue("dprefijosrv", empresa.dprefijosrv || "");
      setValue("dprefijousr", empresa.dprefijousr || "");
    }
  }, [empresa, setValue]);

  const findIndexById = (id: string) => {
    let index = -1;
    for (let i = 0; i < empresas.length; i++) {
      if (empresas[i].id_empresa === id) {
        index = i;
        break;
      }
    }
    return index;
  };

  const onSubmit = async (data: EmpresaFormData) => {
    setSubmitting(true);
    try {
      if (empresa) {
        // Actualizar la empresa en el backend
        const empresaActualizada = await updateEmpresa(
          empresa.id_empresa,
          data,
        );

        // Encontrar el índice de la empresa actualizada en el arreglo local
        const index = findIndexById(empresa.id_empresa);

        if (index !== -1) {
          // Crear una copia del arreglo de empresas
          const empresasActualizadas = [...empresas];

          // Actualizar la empresa en la copia del arreglo
          empresasActualizadas[index] = empresaActualizada;

          // Actualizar el estado local con el nuevo arreglo
          setEmpresas(empresasActualizadas);

          // Mostrar notificación de éxito
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Empresa Actualizada",
            life: 3000,
          });

          // Cerrar el diálogo del formulario
          hideEmpresaFormDialog();
        } else {
          // Mostrar notificación de error si no se encuentra la empresa
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo encontrar la empresa",
            life: 3000,
          });
        }
      } else {
        // Crear una nueva empresa
        const empresaCreada = await createEmpresa(data);

        // Mostrar notificación de éxito
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa Creada",
          life: 3000,
        });

        // Redirigir a la lista de empresas
        router.push("/empresas/list");
      }
    } catch (error) {
      handleFormError(error, toast); // Pasamos la referencia del toast
    } finally {
      // Redirigir después de que todo esté completo
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      {!empresa && (
        <span className="text-900 text-xl font-bold mb-4 block">
          Crear Empresa
        </span>
      )}
      <div className="grid">
        {!empresa && (
          <div className="col-12 lg:col-2">
            <div className="text-900 font-medium text-xl mb-3">Empresa</div>
            <p className="m-0 p-0 text-600 line-height-3 mr-3">
              Complete la información de la empresa.
            </p>
          </div>
        )}
        <div className="col-12 lg:col-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid formgrid p-fluid">
              {/* Información Básica */}
              <div className="col-12">
                <h5 className="text-900 font-medium mb-4">
                  Información Básica
                </h5>
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="nombre" className="font-medium text-900">
                  Nombre de la Empresa *
                </label>
                <InputText
                  id="nombre"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.nombre,
                  })}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <small className="p-error">{errors.nombre.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="numerorif" className="font-medium text-900">
                  Número RIF *
                </label>
                <InputText
                  id="numerorif"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.numerorif,
                  })}
                  {...register("numerorif")}
                />
                {errors.numerorif && (
                  <small className="p-error">{errors.numerorif.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12">
                <label htmlFor="direccion" className="font-medium text-900">
                  Dirección *
                </label>
                <InputText
                  id="direccion"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.direccion,
                  })}
                  {...register("direccion")}
                />
                {errors.direccion && (
                  <small className="p-error">{errors.direccion.message}</small>
                )}
              </div>

              {/* Información de Contacto */}
              <div className="col-12">
                <h5 className="text-900 font-medium mb-4 mt-4">
                  Información de Contacto
                </h5>
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="telefonos" className="font-medium text-900">
                  Teléfonos
                </label>
                <InputText
                  id="telefonos"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.telefonos,
                  })}
                  {...register("telefonos")}
                />
                {errors.telefonos && (
                  <small className="p-error">{errors.telefonos.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="fax" className="font-medium text-900">
                  Fax
                </label>
                <InputText
                  id="fax"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.fax,
                  })}
                  {...register("fax")}
                />
                {errors.fax && (
                  <small className="p-error">{errors.fax.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="email" className="font-medium text-900">
                  Email
                </label>
                <InputText
                  id="email"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.email,
                  })}
                  {...register("email")}
                />
                {errors.email && (
                  <small className="p-error">{errors.email.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="website" className="font-medium text-900">
                  Sitio Web
                </label>
                <InputText
                  id="website"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.website,
                  })}
                  {...register("website")}
                />
                {errors.website && (
                  <small className="p-error">{errors.website.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="contacto" className="font-medium text-900">
                  Persona de Contacto
                </label>
                <InputText
                  id="contacto"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.contacto,
                  })}
                  {...register("contacto")}
                />
                {errors.contacto && (
                  <small className="p-error">{errors.contacto.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="numeronit" className="font-medium text-900">
                  Número NIT
                </label>
                <InputText
                  id="numeronit"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.numeronit,
                  })}
                  {...register("numeronit")}
                />
                {errors.numeronit && (
                  <small className="p-error">{errors.numeronit.message}</small>
                )}
              </div>

              {/* Soporte Técnico */}
              <div className="col-12">
                <h5 className="text-900 font-medium mb-4 mt-4">
                  Soporte Técnico
                </h5>
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="soporte1" className="font-medium text-900">
                  Soporte 1
                </label>
                <InputText
                  id="soporte1"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.soporte1,
                  })}
                  {...register("soporte1")}
                />
                {errors.soporte1 && (
                  <small className="p-error">{errors.soporte1.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="soporte2" className="font-medium text-900">
                  Soporte 2
                </label>
                <InputText
                  id="soporte2"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.soporte2,
                  })}
                  {...register("soporte2")}
                />
                {errors.soporte2 && (
                  <small className="p-error">{errors.soporte2.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="soporte3" className="font-medium text-900">
                  Soporte 3
                </label>
                <InputText
                  id="soporte3"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.soporte3,
                  })}
                  {...register("soporte3")}
                />
                {errors.soporte3 && (
                  <small className="p-error">{errors.soporte3.message}</small>
                )}
              </div>

              {/* Configuración de Base de Datos */}
              <div className="col-12">
                <h5 className="text-900 font-medium mb-4 mt-4">
                  Configuración de Base de Datos
                </h5>
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label className="block font-medium text-900 mb-2">
                  Usar Web Service
                </label>
                <Controller
                  name="data_usaweb"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSwitch
                      id="data_usaweb"
                      checked={field.value}
                      onChange={(e: any) => field.onChange(e.value)}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.data_usaweb && (
                  <small className="p-error block mt-2">
                    {errors.data_usaweb.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="data_servidor" className="font-medium text-900">
                  Servidor
                </label>
                <InputText
                  id="data_servidor"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.data_servidor,
                  })}
                  {...register("data_servidor")}
                />
                {errors.data_servidor && (
                  <small className="p-error">
                    {errors.data_servidor.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="data_usuario" className="font-medium text-900">
                  Usuario BD
                </label>
                <InputText
                  id="data_usuario"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.data_usuario,
                  })}
                  {...register("data_usuario")}
                />
                {errors.data_usuario && (
                  <small className="p-error">
                    {errors.data_usuario.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="data_password" className="font-medium text-900">
                  Contraseña BD
                </label>
                <InputText
                  id="data_password"
                  type="password"
                  className={classNames("w-full", {
                    "p-invalid": errors.data_password,
                  })}
                  {...register("data_password")}
                />
                {errors.data_password && (
                  <small className="p-error">
                    {errors.data_password.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="data_port" className="font-medium text-900">
                  Puerto
                </label>
                <InputText
                  id="data_port"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.data_port,
                  })}
                  {...register("data_port")}
                />
                {errors.data_port && (
                  <small className="p-error">{errors.data_port.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="licencia" className="font-medium text-900">
                  Licencia
                </label>
                <InputText
                  id="licencia"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.licencia,
                  })}
                  {...register("licencia")}
                />
                {errors.licencia && (
                  <small className="p-error">{errors.licencia.message}</small>
                )}
              </div>

              {/* Configuración General */}
              <div className="col-12">
                <h5 className="text-900 font-medium mb-4 mt-4">
                  Configuración General
                </h5>
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label className="block font-medium text-900 mb-2">
                  Empresa Predeterminada
                </label>
                <Controller
                  name="predeter"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSwitch
                      id="predeter"
                      checked={field.value}
                      onChange={(e: any) => field.onChange(e.value)}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.predeter && (
                  <small className="p-error block mt-2">
                    {errors.predeter.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label className="block font-medium text-900 mb-2">
                  Sistema Historizado
                </label>
                <Controller
                  name="historizada"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSwitch
                      id="historizada"
                      checked={field.value}
                      onChange={(e: any) => field.onChange(e.value)}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.historizada && (
                  <small className="p-error block mt-2">
                    {errors.historizada.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label className="block font-medium text-900 mb-2">
                  Usar Prefijos
                </label>
                <Controller
                  name="usa_prefijo"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputSwitch
                      id="usa_prefijo"
                      checked={field.value}
                      onChange={(e: any) => field.onChange(e.value)}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                  )}
                />
                {errors.usa_prefijo && (
                  <small className="p-error block mt-2">
                    {errors.usa_prefijo.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="name_prefijo" className="font-medium text-900">
                  Nombre del Prefijo
                </label>
                <InputText
                  id="name_prefijo"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.name_prefijo,
                  })}
                  {...register("name_prefijo")}
                />
                {errors.name_prefijo && (
                  <small className="p-error">
                    {errors.name_prefijo.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="dprefijobd" className="font-medium text-900">
                  Prefijo Base de Datos
                </label>
                <InputText
                  id="dprefijobd"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.dprefijobd,
                  })}
                  {...register("dprefijobd")}
                />
                {errors.dprefijobd && (
                  <small className="p-error">{errors.dprefijobd.message}</small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="dprefijosrv" className="font-medium text-900">
                  Prefijo Servidor
                </label>
                <InputText
                  id="dprefijosrv"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.dprefijosrv,
                  })}
                  {...register("dprefijosrv")}
                />
                {errors.dprefijosrv && (
                  <small className="p-error">
                    {errors.dprefijosrv.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12 md:col-4">
                <label htmlFor="dprefijousr" className="font-medium text-900">
                  Prefijo Usuario
                </label>
                <InputText
                  id="dprefijousr"
                  type="text"
                  className={classNames("w-full", {
                    "p-invalid": errors.dprefijousr,
                  })}
                  {...register("dprefijousr")}
                />
                {errors.dprefijousr && (
                  <small className="p-error">
                    {errors.dprefijousr.message}
                  </small>
                )}
              </div>

              <div className="field mb-4 col-12">
                <label htmlFor="masinfo" className="font-medium text-900">
                  Información Adicional
                </label>
                <InputTextarea
                  id="masinfo"
                  rows={3}
                  className={classNames("w-full", {
                    "p-invalid": errors.masinfo,
                  })}
                  {...register("masinfo")}
                />
                {errors.masinfo && (
                  <small className="p-error">{errors.masinfo.message}</small>
                )}
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  disabled={submitting}
                  icon={submitting ? "pi pi-spinner pi-spin" : ""}
                  label={empresa ? "Actualizar Empresa" : "Crear Empresa"}
                  className="w-auto mt-3"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmpresaForm;
