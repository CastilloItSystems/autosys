"use client";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { profileSchema } from "@/libs/zods";
import { Toast } from "primereact/toast";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { Usuario } from "@/libs/interfaces";
import { handleFormError } from "@/utils/errorHandlers";
import { updateUser, uploadUserProfilePicture } from "@/app/api/userService";
import { useSession } from "next-auth/react";
import PhoneInput from "@/components/common/PhoneInput";

type FormData = z.infer<typeof profileSchema>;

interface MyprofileFormProps {
  usuario: Usuario;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast>;
}

const MyprofileForm = ({
  usuario,
  formId = "profile-form",
  onSave,
  onSubmittingChange,
  toast,
}: MyprofileFormProps) => {
  const { update } = useSession();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    usuario.img || null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (usuario) {
      if (usuario.nombre !== undefined) setValue("nombre", usuario.nombre);
      if (usuario.telefono !== undefined && usuario.telefono !== null)
        setValue("telefono", usuario.telefono);
      setPreviewUrl(usuario.img || null);
    }
  }, [usuario, setValue]);

  const onFileSelect = (e: FileUploadSelectEvent) => {
    const file = e.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(usuario.img || null);
  };

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const usuarioActualizado = await updateUser(usuario.id, data);

      let finalImg = usuarioActualizado.img;

      // Subir imagen si hay una seleccionada
      if (selectedFile) {
        try {
          const res = await uploadUserProfilePicture(usuario.id, selectedFile);
          finalImg = res.img;
        } catch (uploadError) {
          toast.current?.show({
            severity: "warn",
            summary: "Imagen no subida",
            detail: "El perfil se actualizó pero hubo un error con la imagen.",
            life: 5000,
          });
        }
      }

      await update({
        updatedUsuario: {
          nombre: usuarioActualizado.nombre,
          telefono: usuarioActualizado.telefono,
          img: finalImg,
        },
      });
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid formgrid p-fluid p-3">
        {/* Foto de Perfil */}
        <div className="col-12 flex flex-column align-items-center mb-4">
          <div className="relative">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile Preview"
                width="120"
                height="120"
                className="border-circle shadow-2 overflow-hidden"
                preview
              />
            ) : (
              <div
                className="flex align-items-center justify-content-center border-circle surface-200 text-400"
                style={{ width: "120px", height: "120px" }}
              >
                <i className="pi pi-user text-5xl"></i>
              </div>
            )}
            {selectedFile && (
              <Button
                type="button"
                icon="pi pi-times"
                className="p-button-rounded p-button-danger p-button-sm absolute -top-1 -right-1"
                onClick={clearImage}
                tooltip="Quitar imagen seleccionada"
              />
            )}
          </div>
          <FileUpload
            mode="basic"
            name="image"
            accept="image/*"
            maxFileSize={5000000}
            onSelect={onFileSelect}
            chooseLabel={previewUrl ? "Cambiar Foto" : "Subir Foto"}
            className="p-button-text p-button-sm mt-2"
          />
        </div>

        <div className="field mb-4 col-12 md:col-8">
          <label htmlFor="nombre" className="font-medium text-900">
            Nombre
          </label>
          <InputText
            id="nombre"
            type="text"
            className={classNames("w-full", { "p-invalid": errors.nombre })}
            {...register("nombre")}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        <div className="field mb-4 col-12 md:col-4">
          <label className="block font-medium text-900 mb-2">Teléfono</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <PhoneInput
                  id="telefono"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error}
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
      </div>
    </form>
  );
};

export default MyprofileForm;
