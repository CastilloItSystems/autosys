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
import { useRouter } from "next/navigation";
import { Refineria } from "@/libs/interfaces";
import { getRefinerias } from "@/app/api/refineriaService";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputNumber } from "primereact/inputnumber";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  usuario: any;
  hideUsuarioFormDialog: () => void;
  usuarios: any[];
  setUsuarios: (usuarios: any[]) => void;
}
const UsuarioForm = ({
  usuario,
  hideUsuarioFormDialog,
  usuarios,
  setUsuarios,
}: UsuarioFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const toast = useRef<Toast | null>(null);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [refinerias, setRefinerias] = useState<Refineria[]>([]);
  const filledInput = layoutConfig.inputStyle === "filled";
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(usuarioSchema),
  });
  useEffect(() => {
    if (usuario) {
      const fields: (keyof FormData)[] = [
        "nombre",
        "correo",
        "password",
        "rol",
        "acceso",
        "estado",
        "departamento",
        "telefono",
      ];
      fields.forEach((field) => {
        if (usuario[field] !== undefined) setValue(field, usuario[field]);
      });
      // Manejar idRefineria por separado para asegurar que sea un arreglo de IDs
      setValue(
        "idRefineria",
        usuario.idRefineria
          ? usuario.idRefineria.map((ref: any) =>
              typeof ref === "object" && ref.id ? ref.id : ref
            )
          : []
      );
    }
  }, [usuario, setValue]);
  useEffect(() => {
    const fetchUsers = async () => {
      const refineriasDB = await getRefinerias();
      const { refinerias } = refineriasDB;
      setRefinerias(refinerias);
      setLoading(false);
    };

    fetchUsers();
  }, []);
  const findIndexById = (id: string) => {
    let index = -1;
    for (let i = 0; i < usuarios.length; i++) {
      if (usuarios[i].id === id) {
        index = i;
        break;
      }
    }

    return index;
  };
  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (usuario) {
        // Actualizar el usuario en el backend
        const usuarioActualizado = await updateUser(usuario.id, data);

        // Encontrar el índice del usuario actualizado en el arreglo local
        const index = findIndexById(usuario.id);

        if (index !== -1) {
          // Crear una copia del arreglo de usuarios
          const _usuarios = [...usuarios];

          // Actualizar el usuario en la copia del arreglo
          _usuarios[index] = usuarioActualizado;

          // Actualizar el estado local con el nuevo arreglo
          setUsuarios(_usuarios);

          // Mostrar notificación de éxito
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Usuario Actualizado",
            life: 3000,
          });

          // Cerrar el diálogo del formulario
          hideUsuarioFormDialog();
        } else {
          // Mostrar notificación de error si no se encuentra el usuario
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo encontrar el usuario",
            life: 3000,
          });
        }
      } else {
        // Crear un nuevo usuario
        const usuarioCreado = await createUser(data);

        // Actualizar el estado local con el nuevo usuario
        // setUsuarios([...usuarios, usuarioCreado]);

        // Mostrar notificación de éxito
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario Creado",
          life: 3000,
        });
        reset();

        // router.push("/");
        // Cerrar el diálogo del formulario
        // hideUsuarioFormDialog();
      }
    } catch (error) {
      // Mostrar notificación de error si algo falla
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al procesar la solicitud",
        life: 3000,
      });
      console.error("Error al procesar la solicitud:", error);
    } finally {
      // Redirigir después de que todo esté completo
      router.push("/profile/list");
    }
  };
  const estatusValues = ["true", "false"];

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
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "300px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }
  return (
    <div className="card">
      <Toast ref={toast} />
      {!usuario && (
        <span className="text-900 text-xl font-bold mb-4 block">
          Crear Usuario
        </span>
      )}
      <div className="grid">
        {!usuario && (
          <div className="col-12 lg:col-2">
            <div className="text-900 font-medium text-xl mb-3">Perfil</div>
            <p className="m-0 p-0 text-600 line-height-3 mr-3">
              Todos los campos son obligatorios.
            </p>
          </div>
        )}
        <div className="col-12 lg:col-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid formgrid p-fluid">
              <div className="field mb-4 col-12">
                <label htmlFor="nombre" className="font-medium text-900">
                  Nombre
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
                <label htmlFor="correo" className="font-medium text-900">
                  Correo Electrónico
                </label>
                <InputText
                  id="correo"
                  type="text"
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
              <div className="col-12 md:col-6 lg:col-4 xl:col-3">
                <label className="block font-medium text-900 mb-2 flex align-items-center">
                  Teléfono
                </label>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <InputText
                        id="telefono"
                        placeholder="+584248286102"
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                          "pl-5": filledInput,
                        })}
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Forzar que siempre empiece con +
                          if (value === "") {
                            field.onChange("");
                          } else if (value === "+") {
                            field.onChange("+");
                          } else {
                            // Filtrar solo números y mantener el + inicial
                            const numericValue = value.replace(/[^0-9]/g, "");
                            field.onChange("+" + numericValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          // Prevenir borrado del signo +
                          if (e.key === "Backspace" && field.value === "+") {
                            e.preventDefault();
                          }
                        }}
                      />
                      {fieldState.error && (
                        <small className="p-error block mt-2 flex align-items-center">
                          <i className="pi pi-exclamation-circle mr-2"></i>
                          {fieldState.error.message}
                        </small>
                      )}
                    </>
                  )}
                />
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
                  //   optionLabel="name"
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
                />
                {errors.departamento && (
                  <small className="p-error">
                    {errors.departamento.message}
                  </small>
                )}
              </div>
              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="acceso" className="font-medium text-900">
                  acceso
                </label>
                <Dropdown
                  id="acceso"
                  value={watch("acceso")}
                  onChange={(e) => setValue("acceso", e.value)}
                  options={accesoValues}
                  //   optionLabel="name"
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.acceso,
                  })}
                />
                {errors.rol && (
                  <small className="p-error">{errors.rol.message}</small>
                )}
              </div>
              {/* Campo para seleccionar refinerías cuando el acceso es limitado */}
              {watch("acceso") === "limitado" && (
                <div className="field mb-4 col-12">
                  <label htmlFor="idRefineria" className="font-medium text-900">
                    Refinerías
                  </label>
                  <MultiSelect
                    id="idRefineria"
                    value={watch("idRefineria")}
                    onChange={(e) => setValue("idRefineria", e.value)}
                    options={refinerias.map((refineria) => ({
                      label: refineria.nombre,
                      value: refineria.id,
                    }))}
                    placeholder="Seleccionar Refinerías"
                    className={classNames("w-full", {
                      "p-invalid": errors.idRefineria,
                    })}
                    selectAllLabel="Seleccionar todos"
                  />
                  {errors.idRefineria && (
                    <small className="p-error">
                      {errors.idRefineria.message}
                    </small>
                  )}
                </div>
              )}
              <div className="field mb-4 col-12 md:col-6">
                <label htmlFor="estado" className="font-medium text-900">
                  Estado
                </label>
                <Dropdown
                  id="estado"
                  value={watch("estado")}
                  onChange={(e) => setValue("estado", e.value)}
                  options={estatusValues}
                  //   optionLabel="name"
                  placeholder="Seleccionar"
                  className={classNames("w-full", {
                    "p-invalid": errors.estado,
                  })}
                />
                {errors.estado && (
                  <small className="p-error">{errors.estado.message}</small>
                )}
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  disabled={submitting} // Deshabilitar el botón mientras se envía
                  icon={submitting ? "pi pi-spinner pi-spin" : ""} // Mostrar ícono de carga
                  label={usuario ? "Modificar Usuario" : "Crear Usuario"}
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

export default UsuarioForm;
