"use client";
import React, { useEffect, useState } from "react";
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
import { getCompanyRoles, CompanyRole } from "@/app/api/roleService";
import PhoneInput from "../common/PhoneInput";
import { Empresa } from "@/libs/interfaces/empresaInterface";

type FormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  usuario?: any;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

const estatusValues = [
  { label: "Activo", value: "activo" },
  { label: "Pendiente", value: "pendiente" },
  { label: "Suspendido", value: "suspendido" },
];

const accesoValues = ["completo", "limitado", "ninguno"];

const UsuarioForm = ({ usuario, onSave, onCancel, toast }: UsuarioFormProps) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // rolesByEmpresa: { [empresaId]: CompanyRole[] }
  const [rolesByEmpresa, setRolesByEmpresa] = useState<Record<string, CompanyRole[]>>({});
  // empresaRoles: { [empresaId]: roleId } — un rol por empresa
  const [empresaRoles, setEmpresaRoles] = useState<Record<string, string>>({});

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
      rol: "VIEWER",
      acceso: "ninguno",
      estado: "activo",
      departamento: [],
      telefono: "",
      idEmpresas: [],
    },
  });

  const selectedEmpresas: string[] = watch("idEmpresas") ?? [];

  // Cargar roles cuando cambia la selección de empresas
  useEffect(() => {
    const missingEmpresas = selectedEmpresas.filter(
      (id) => !rolesByEmpresa[id]
    );
    if (missingEmpresas.length === 0) return;

    Promise.all(
      missingEmpresas.map((id) =>
        getCompanyRoles(id)
          .then((roles) => ({ id, roles }))
          .catch(() => ({ id, roles: [] }))
      )
    ).then((results) => {
      setRolesByEmpresa((prev) => {
        const next = { ...prev };
        results.forEach(({ id, roles }) => { next[id] = roles; });
        return next;
      });
    });
  }, [selectedEmpresas.join(",")]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const empresasResponse = await getEmpresas();
        const listaEmpresas = empresasResponse.empresas || empresasResponse || [];
        setEmpresas(listaEmpresas);

        if (usuario) {
          // Cargar empresas del usuario
          const empresaIds = usuario.empresas?.map((e: any) => e.id_empresa) ?? [];

          // Precargar roles de todas las empresas del usuario
          if (empresaIds.length > 0) {
            const results = await Promise.all(
              empresaIds.map((id: string) =>
                getCompanyRoles(id)
                  .then((roles) => ({ id, roles }))
                  .catch(() => ({ id, roles: [] as CompanyRole[] }))
              )
            );
            const rolesMap: Record<string, CompanyRole[]> = {};
            results.forEach(({ id, roles }) => { rolesMap[id] = roles; });
            setRolesByEmpresa(rolesMap);
          }

          // Inicializar empresaRoles desde userEmpresaRoles del usuario
          const initialRoles: Record<string, string> = {};
          if (usuario.userEmpresaRoles) {
            for (const uer of usuario.userEmpresaRoles) {
              initialRoles[uer.empresaId] = uer.role.id;
            }
          }
          setEmpresaRoles(initialRoles);

          reset({
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol ?? "VIEWER",
            acceso: usuario.acceso,
            estado: usuario.estado,
            departamento: usuario.departamento || [],
            telefono: usuario.telefono || "",
            idEmpresas: empresaIds,
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
      // Construir empresaRoles array para el backend
      const empresaRolesPayload = Object.entries(empresaRoles)
        .filter(([empresaId]) => data.idEmpresas?.includes(empresaId))
        .map(([empresaId, roleId]) => ({ empresaId, roleId }));

      const payload = { ...data, empresaRoles: empresaRolesPayload };

      if (usuario) {
        await updateUser(usuario.id, payload);
        toast.current?.show({ severity: "success", summary: "Éxito", detail: "Usuario Actualizado", life: 3000 });
      } else {
        await createUser(payload);
        toast.current?.show({ severity: "success", summary: "Éxito", detail: "Usuario Creado", life: 3000 });
      }
      onSave();
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Ocurrió un error al procesar la solicitud", life: 3000 });
      console.error("Error al procesar la solicitud:", error);
    }
  };

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

        {/* Nombre */}
        <div className="field mb-4 col-12">
          <label htmlFor="nombre" className="font-medium text-900">Nombre</label>
          <InputText
            id="nombre"
            className={classNames("w-full", { "p-invalid": errors.nombre })}
            {...register("nombre")}
          />
          {errors.nombre && <small className="p-error">{errors.nombre.message}</small>}
        </div>

        {/* Correo */}
        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="correo" className="font-medium text-900">Correo Electrónico</label>
          <InputText
            id="correo"
            className={classNames("w-full", { "p-invalid": errors.correo })}
            {...register("correo")}
          />
          {errors.correo && <small className="p-error">{errors.correo.message}</small>}
        </div>

        {/* Contraseña (solo crear) */}
        {!usuario && (
          <div className="field mb-4 col-12 md:col-6">
            <label htmlFor="password" className="font-medium text-900">Contraseña</label>
            <InputText
              id="password"
              type="password"
              className={classNames("w-full", { "p-invalid": errors.password })}
              {...register("password")}
            />
            {errors.password && <small className="p-error">{errors.password.message}</small>}
          </div>
        )}

        {/* Teléfono */}
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
          {errors.telefono && <small className="p-error">{errors.telefono.message}</small>}
        </div>

        {/* Acceso */}
        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="acceso" className="font-medium text-900">Acceso</label>
          <Dropdown
            id="acceso"
            value={watch("acceso")}
            onChange={(e) => setValue("acceso", e.value)}
            options={accesoValues}
            placeholder="Seleccionar"
            className={classNames("w-full", { "p-invalid": errors.acceso })}
          />
          {errors.acceso && <small className="p-error">{errors.acceso.message}</small>}
        </div>

        {/* Estado */}
        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="estado" className="font-medium text-900">Estado</label>
          <Dropdown
            id="estado"
            value={watch("estado")}
            onChange={(e) => setValue("estado", e.value)}
            options={estatusValues}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            className={classNames("w-full", { "p-invalid": errors.estado })}
          />
          {errors.estado && <small className="p-error">{errors.estado.message}</small>}
        </div>

        {/* Departamento */}
        <div className="field mb-4 col-12 md:col-6">
          <label htmlFor="departamento" className="font-medium text-900">Departamento</label>
          <MultiSelect
            id="departamento"
            value={watch("departamento")}
            onChange={(e) => setValue("departamento", e.value)}
            options={["Finanzas", "Operaciones", "Logistica", "Laboratorio", "Gerencia"].map((d) => ({ label: d, value: d }))}
            placeholder="Seleccionar Departamentos"
            className={classNames("w-full", { "p-invalid": errors.departamento })}
            selectAllLabel="Seleccionar todos"
            display="chip"
          />
          {errors.departamento && <small className="p-error">{errors.departamento.message}</small>}
        </div>

        {/* ── Empresas y Roles dinámicos ── */}
        <div className="col-12">
          <div className="border-1 border-200 border-round p-3">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-building text-primary" />
              <span className="font-semibold text-900">Empresas y Roles</span>
            </div>

            {/* Selección de empresas */}
            <div className="field mb-3">
              <label className="font-medium text-900 text-sm">Empresas</label>
              <MultiSelect
                value={selectedEmpresas}
                onChange={(e) => {
                  setValue("idEmpresas", e.value);
                  // Limpiar roles de empresas deseleccionadas
                  setEmpresaRoles((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((id) => {
                      if (!e.value.includes(id)) delete next[id];
                    });
                    return next;
                  });
                }}
                options={empresas}
                optionLabel="nombre"
                optionValue="id_empresa"
                placeholder="Seleccionar empresas..."
                className="w-full"
                display="chip"
                filter
              />
            </div>

            {/* Por cada empresa seleccionada, mostrar dropdown de roles */}
            {selectedEmpresas.length > 0 ? (
              <div className="flex flex-column gap-2">
                {selectedEmpresas.map((empresaId) => {
                  const empresa = empresas.find((e) => e.id_empresa === empresaId);
                  const roles = rolesByEmpresa[empresaId] ?? [];
                  const roleOptions = roles.map((r) => ({
                    label: `${r.name}${r.description ? ` — ${r.description}` : ""}`,
                    value: r.id,
                  }));

                  return (
                    <div key={empresaId} className="flex align-items-center gap-2">
                      <span className="text-sm text-600 w-8rem flex-shrink-0">{empresa?.nombre ?? empresaId}</span>
                      <Dropdown
                        value={empresaRoles[empresaId] ?? null}
                        onChange={(e) =>
                          setEmpresaRoles((prev) => ({ ...prev, [empresaId]: e.value }))
                        }
                        options={roleOptions}
                        placeholder={roles.length === 0 ? "Cargando roles..." : "Seleccionar rol..."}
                        className="flex-1"
                        disabled={roles.length === 0}
                        showClear
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-500 text-sm m-0">
                <i className="pi pi-info-circle mr-1" />
                Selecciona al menos una empresa para asignar roles.
              </p>
            )}
          </div>
        </div>

        {/* Botones */}
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
