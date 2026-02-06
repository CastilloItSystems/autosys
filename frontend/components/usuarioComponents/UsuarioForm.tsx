"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { usuarioSchema } from "@/libs/zods";
import { createUser, updateUser } from "@/app/api/userService";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { getEmpresas } from "@/app/api/empresaService";
import PhoneInput from "../common/PhoneInput";
import { Empresa } from "@/libs/interfaces/empresaInterface";

type FormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  usuario?: any;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

const UsuarioForm = ({
  usuario,
  onSave,
  onCancel,
  toast,
}: UsuarioFormProps) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      password: "",
      rol: "lectura",
      acceso: "ninguno",
      estado: "activo",
      departamento: [],
      telefono: "",
      // idRefineria: [], // Cambiar a empresas si es necesario, o mantener ambos
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const empresasResponse = await getEmpresas();
        // Ajustar según la estructura de respuesta { empresas: [...] } o [...]
        const listaEmpresas =
          empresasResponse.empresas || empresasResponse || [];
        setEmpresas(listaEmpresas);

        if (usuario) {
          reset({
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            acceso: usuario.acceso,
            estado: usuario.estado,
            departamento: usuario.departamento || [],
            telefono: usuario.telefono || "",
            idEmpresas: usuario.empresas?.map((e: any) => e.id_empresa) || [],
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [usuario, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (usuario) {
        await updateUser(usuario.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario Actualizado",
          life: 3000,
        });
      } else {
        await createUser(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario Creado",
          life: 3000,
        });
      }
      onSave();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al procesar la solicitud",
        life: 3000,
      });
      console.error("Error al procesar la solicitud:", error);
    }
  };

  const estatusValues = [
    { label: "Activo", value: "activo" },
    { label: "Pendiente", value: "pendiente" },
    { label: "Suspendido", value: "suspendido" },
  ];

  const rolValues = ["superAdmin", "admin", "operador", "user", "lectura"];

  const departamentoValues = [
    "Finanzas",
    "Operaciones",
    "Logistica",
    "Laboratorio",
    "Gerencia",
  ];

  const accesoValues = ["completo", "limitado", "ninguno"];

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-6">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid">
        <div className="field mb-4 col-12">
          <label htmlFor="nombre" className="font-medium text-900">
            Nombre
          </label>
          <InputText
            id="nombre"
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
          <label htmlFor="correo" className="font-medium text-900">
            Correo Electrónico
          </label>
          <InputText
            id="correo"
            className={classNames("w-full", {
              "p-invalid": errors.correo,
            })}
            {...register("correo")}
          />
          {errors.correo && (
            <small className="p-error">{errors.correo.message}</small>
          )}
        </div>

        {!usuario && (
          <div className="field mb-4 col-12 md:col-6">
            <label htmlFor="password" className="font-medium text-900">
              Contraseña
            </label>
            <InputText
              id="password"
              type="password"
              className={classNames("w-full", {
                "p-invalid": errors.password,
              })}
              {...register("password")}
            />
            {errors.password && (
              <small className="p-error">{errors.password.message}</small>
            )}
          </div>
        )}

        {/* Campo: Teléfono */}
        <div className="field mb-4 col-12 md:col-6">
          <label className="block font-medium text-900 mb-2">Teléfono</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.telefono}
                placeholder="1234567"
              />
            )}
          />
          {errors.telefono && (
            <small className="p-error">{errors.telefono.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="rol" className="font-medium text-900">
            Rol
          </label>
          <Dropdown
            id="rol"
            value={watch("rol")}
            onChange={(e) => setValue("rol", e.value)}
            options={rolValues}
            placeholder="Seleccionar"
            className={classNames("w-full", {
              "p-invalid": errors.rol,
            })}
          />
          {errors.rol && (
            <small className="p-error">{errors.rol.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="departamento" className="font-medium text-900">
            Departamento
          </label>
          <MultiSelect
            id="departamento"
            value={watch("departamento")}
            onChange={(e) => setValue("departamento", e.value)}
            options={departamentoValues.map((dep) => ({
              label: dep,
              value: dep,
            }))}
            placeholder="Seleccionar Departamentos"
            className={classNames("w-full", {
              "p-invalid": errors.departamento,
            })}
            selectAllLabel="Seleccionar todos"
            display="chip"
          />
          {errors.departamento && (
            <small className="p-error">{errors.departamento.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="acceso" className="font-medium text-900">
            Acceso
          </label>
          <Dropdown
            id="acceso"
            value={watch("acceso")}
            onChange={(e) => setValue("acceso", e.value)}
            options={accesoValues}
            placeholder="Seleccionar"
            className={classNames("w-full", {
              "p-invalid": errors.acceso,
            })}
          />
          {errors.acceso && (
            <small className="p-error">{errors.acceso.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="estado" className="font-medium text-900">
            Estado
          </label>
          <Dropdown
            id="estado"
            value={watch("estado")}
            onChange={(e) => setValue("estado", e.value)}
            options={estatusValues}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            className={classNames("w-full", {
              "p-invalid": errors.estado,
            })}
          />
          {errors.estado && (
            <small className="p-error">{errors.estado.message}</small>
          )}
        </div>

        {/* Campo para seleccionar empresas cuando el acceso es limitado */}
        {watch("acceso") === "limitado" && (
          <div className="field mb-4 col-12">
            <label htmlFor="idEmpresas" className="font-medium text-900">
              Empresas Permitidas
            </label>
            <MultiSelect
              id="idEmpresas"
              value={watch("idEmpresas")}
              onChange={(e) => setValue("idEmpresas", e.value)}
              options={empresas}
              optionLabel="nombre"
              optionValue="id_empresa"
              placeholder="Seleccionar Empresas"
              className={classNames("w-full")}
              display="chip"
              filter
            />
            {errors.idEmpresas && (
              <small className="p-error">{errors.idEmpresas.message}</small>
            )}
            <small className="text-500">
              Seleccione las empresas a las que este usuario tendrá acceso.
            </small>
          </div>
        )}

        <div className="col-12 flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
          />
          <Button
            label={usuario ? "Actualizar" : "Crear"}
            icon="pi pi-check"
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </div>
    </form>
  );
};

export default UsuarioForm;
