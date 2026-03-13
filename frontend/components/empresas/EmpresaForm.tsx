import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { InputSwitch } from "primereact/inputswitch";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { empresaSchema, EmpresaFormData } from "@/libs/zods/empresaZod";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import { createEmpresa, updateEmpresa } from "@/app/api/empresaService";
import RifInput from "../common/RifInput";
import PhoneInput from "../common/PhoneInput";

interface EmpresaFormProps {
  empresa?: Empresa | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const EmpresaForm = ({
  empresa,
  onSave,
  onCancel,
  toast,
  formId = "empresa-form",
  onSubmittingChange,
}: EmpresaFormProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    reset,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    mode: "onBlur",
    defaultValues: {
      nombre: "",
      direccion: "",
      telefonos: "",
      fax: "",
      numerorif: "",
      numeronit: "",
      website: "",
      email: "",
      contacto: "",
      predeter: false,
      soporte1: "",
      soporte2: "",
      soporte3: "",
      data_usaweb: false,
      data_servidor: "",
      data_usuario: "",
      data_password: "",
      data_port: "",
      licencia: "",
      historizada: false,
      masinfo: "",
      usa_prefijo: false,
      name_prefijo: "",
      dprefijobd: "",
      dprefijosrv: "",
      dprefijousr: "",
    },
  });

  // Simular loading inicial o setear valores
  useEffect(() => {
    if (empresa) {
      reset({
        nombre: empresa.nombre,
        direccion: empresa.direccion || "",
        telefonos: empresa.telefonos || "",
        fax: empresa.fax || "",
        numerorif: empresa.numerorif || "",
        numeronit: empresa.numeronit || "",
        website: empresa.website || "",
        email: empresa.email || "",
        contacto: empresa.contacto || "",
        predeter: empresa.predeter,
        soporte1: empresa.soporte1 || "",
        soporte2: empresa.soporte2 || "",
        soporte3: empresa.soporte3 || "",
        data_usaweb: empresa.data_usaweb,
        data_servidor: empresa.data_servidor || "",
        data_usuario: empresa.data_usuario || "",
        data_password: empresa.data_password || "",
        data_port: empresa.data_port || "",
        licencia: empresa.licencia || "",
        historizada: empresa.historizada,
        masinfo: empresa.masinfo || "",
        usa_prefijo: empresa.usa_prefijo,
        name_prefijo: empresa.name_prefijo || "",
        dprefijobd: empresa.dprefijobd || "",
        dprefijosrv: empresa.dprefijosrv || "",
        dprefijousr: empresa.dprefijousr || "",
      });
    } else {
      reset({
        nombre: "",
        direccion: "",
        telefonos: "",
        fax: "",
        numerorif: "",
        numeronit: "",
        website: "",
        email: "",
        contacto: "",
        predeter: false,
        soporte1: "",
        soporte2: "",
        soporte3: "",
        data_usaweb: false,
        data_servidor: "",
        data_usuario: "",
        data_password: "",
        data_port: "",
        licencia: "",
        historizada: false,
        masinfo: "",
        usa_prefijo: false,
        name_prefijo: "",
        dprefijobd: "",
        dprefijosrv: "",
        dprefijousr: "",
      });
    }
    setIsLoading(false);
  }, [empresa, reset]);

  const onSubmit = async (data: EmpresaFormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (empresa) {
        await updateEmpresa(empresa.id_empresa, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa Actualizada",
          life: 3000,
        });
      } else {
        await createEmpresa(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa Creada",
          life: 3000,
        });
      }
      onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {isLoading ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Cargando formulario...</p>
        </div>
      ) : (
        <>
          <div className="grid formgrid">
            {/* Información Básica */}
            <div className="col-12">
              <h5 className="text-900 font-medium mb-4">Información Básica</h5>
            </div>

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="nombre"
                className="block text-900 font-medium mb-2"
              >
                Nombre de la Empresa <span className="text-red-500">*</span>
              </label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="nombre"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": errors.nombre,
                    })}
                  />
                )}
              />
              {errors.nombre && (
                <small className="p-error block mt-1">
                  {errors.nombre.message}
                </small>
              )}
            </div>

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="numerorif"
                className="block text-900 font-medium mb-2"
              >
                Número RIF <span className="text-red-500">*</span>
              </label>
              <Controller
                name="numerorif"
                control={control}
                render={({ field }) => (
                  <RifInput
                    id="numerorif"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.numerorif}
                  />
                )}
              />
              {errors.numerorif && (
                <small className="p-error block mt-1">
                  {errors.numerorif.message}
                </small>
              )}
            </div>

            <div className="field mb-4 col-12">
              <label
                htmlFor="direccion"
                className="block text-900 font-medium mb-2"
              >
                Dirección <span className="text-red-500">*</span>
              </label>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="direccion"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": errors.direccion,
                    })}
                  />
                )}
              />
              {errors.direccion && (
                <small className="p-error block mt-1">
                  {errors.direccion.message}
                </small>
              )}
            </div>

            {/* Información de Contacto */}
            <div className="col-12">
              <h5 className="text-900 font-medium mb-4 mt-4">
                Información de Contacto
              </h5>
            </div>

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="telefonos"
                className="block text-900 font-medium mb-2"
              >
                Teléfonos
              </label>
              <Controller
                name="telefonos"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="telefonos"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telefonos}
                  />
                )}
              />
              {errors.telefonos && (
                <small className="p-error block mt-1">
                  {errors.telefonos.message}
                </small>
              )}
            </div>

            {/* <div className="field mb-4 col-12 md:col-6">
              <label htmlFor="fax" className="font-medium text-900">
                Fax
              </label>
              <Controller
                name="fax"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="fax"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.fax}
                  />
                )}
              />
              {errors.fax && (
                <small className="p-error">{errors.fax.message}</small>
              )}
            </div> */}

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="email"
                className="block text-900 font-medium mb-2"
              >
                Email
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="email"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": errors.email,
                    })}
                  />
                )}
              />
              {errors.email && (
                <small className="p-error block mt-1">
                  {errors.email.message}
                </small>
              )}
            </div>

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="website"
                className="block text-900 font-medium mb-2"
              >
                Sitio Web
              </label>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="website"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": errors.website,
                    })}
                  />
                )}
              />
              {errors.website && (
                <small className="p-error block mt-1">
                  {errors.website.message}
                </small>
              )}
            </div>

            <div className="field mb-4 col-12 md:col-6">
              <label
                htmlFor="contacto"
                className="block text-900 font-medium mb-2"
              >
                Persona de Contacto
              </label>
              <Controller
                name="contacto"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="contacto"
                    {...field}
                    className={classNames("w-full", {
                      "p-invalid": errors.contacto,
                    })}
                  />
                )}
              />
              {errors.contacto && (
                <small className="p-error block mt-1">
                  {errors.contacto.message}
                </small>
              )}
            </div>

            {/* <div className="field mb-4 col-12 md:col-6">
              <label htmlFor="numeronit" className="font-medium text-900">
                Número NIT
              </label>
              <InputText
                id="numeronit"
                className={classNames("w-full", {
                  "p-invalid": errors.numeronit,
                })}
                {...register("numeronit")}
              />
              {errors.numeronit && (
                <small className="p-error">{errors.numeronit.message}</small>
              )}
            </div> */}

            {/* Soporte Técnico */}
            {/* <div className="col-12">
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
                className={classNames("w-full", {
                  "p-invalid": errors.soporte3,
                })}
                {...register("soporte3")}
              />
              {errors.soporte3 && (
                <small className="p-error">{errors.soporte3.message}</small>
              )}
            </div> */}

            {/* Configuración de Base de Datos */}
            {/* <div className="col-12">
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
                className={classNames("w-full", {
                  "p-invalid": errors.data_usuario,
                })}
                {...register("data_usuario")}
              />
              {errors.data_usuario && (
                <small className="p-error">{errors.data_usuario.message}</small>
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
                className={classNames("w-full", {
                  "p-invalid": errors.licencia,
                })}
                {...register("licencia")}
              />
              {errors.licencia && (
                <small className="p-error">{errors.licencia.message}</small>
              )}
            </div> */}

            {/* Configuración General */}
            {/* <div className="col-12">
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
                className={classNames("w-full", {
                  "p-invalid": errors.name_prefijo,
                })}
                {...register("name_prefijo")}
              />
              {errors.name_prefijo && (
                <small className="p-error">{errors.name_prefijo.message}</small>
              )}
            </div>

            <div className="field mb-4 col-12 md:col-4">
              <label htmlFor="dprefijobd" className="font-medium text-900">
                Prefijo Base de Datos
              </label>
              <InputText
                id="dprefijobd"
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
                className={classNames("w-full", {
                  "p-invalid": errors.dprefijosrv,
                })}
                {...register("dprefijosrv")}
              />
              {errors.dprefijosrv && (
                <small className="p-error">{errors.dprefijosrv.message}</small>
              )}
            </div>

            <div className="field mb-4 col-12 md:col-4">
              <label htmlFor="dprefijousr" className="font-medium text-900">
                Prefijo Usuario
              </label>
              <InputText
                id="dprefijousr"
                className={classNames("w-full", {
                  "p-invalid": errors.dprefijousr,
                })}
                {...register("dprefijousr")}
              />
              {errors.dprefijousr && (
                <small className="p-error">{errors.dprefijousr.message}</small>
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
            </div> */}

            {/* El Action Buttons estático se ha removido a favor del footer de FormActionButtons en el componente padre */}
          </div>
        </>
      )}
    </form>
  );
};

export default EmpresaForm;
