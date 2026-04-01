import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import UsuarioChangePasswordForm from "../usuarioComponents/UsuarioChangePasswordForm";
import { Tooltip } from "primereact/tooltip";
import MyprofileForm from "./MyprofileForm";
import FormActionButtons from "@/components/common/FormActionButtons";
import { uploadUserProfilePicture } from "@/app/api/userService";

const MyProfileList: React.FC = () => {
  const { data: session, update } = useSession();
  const profile = session?.user;
  const toast = useRef<Toast>(null);
  const [usuarioFormDialog, setMyprofileFormDialog] = useState(false);
  const [name, setName] = useState(profile?.nombre || "");
  const [avatar, setAvatar] = useState(
    profile?.img ||
      "https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png",
  );
  const [usuarioPasswordFormDialog, setUsuarioPasswordFormDialog] =
    useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const showToast = (
    severity: "success" | "info" | "warn" | "error",
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };
  const hideUsuarioPasswordFormDialog = () => {
    setUsuarioPasswordFormDialog(false);
  };

  const handlePasswordChanged = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Contraseña actualizada correctamente",
      life: 3000,
    });
    setUsuarioPasswordFormDialog(false);
  };
  const handleAvatarUpload = async (e: any) => {
    const file = e.files[0];
    if (file && profile?.id) {
      try {
        // Subir a R2 a través del backend
        const res = await uploadUserProfilePicture(profile.id, file);

        // Actualizar estado local
        setAvatar(res.img || "");

        // Actualizar sesión de NextAuth para que el cambio persista en toda la app
        await update({
          ...session,
          user: {
            ...session?.user,
            img: res.img,
          },
        });

        showToast("success", "Éxito", "Avatar actualizado correctamente");
      } catch (error) {
        console.error("Error uploading avatar:", error);
        showToast("error", "Error", "No se pudo subir la imagen");
      }
    }
  };
  const hideMyprofileFormDialog = () => {
    setMyprofileFormDialog(false);
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Perfil actualizado correctamente",
      life: 3000,
    });
    setMyprofileFormDialog(false);
  };
  useEffect(() => {
    if (profile) {
      setName(profile.nombre || "");
      if (profile.img) {
        setAvatar(profile.img);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (session) {
      const timeout = setTimeout(() => setShowProfile(true), 250);
      return () => clearTimeout(timeout);
    } else {
      setShowProfile(false);
    }
  }, [session]);

  const renderProfileInfo = () => (
    <>
      <div className="flex justify-content-center align-items-center ">
        <div className="surface-card border-round-3xl shadow-6 p-5 fadein animation-duration-700 w-full max-w-4xl">
          <div className="grid grid-nogutter flex-row md:flex-nowrap gap-4">
            {/* Avatar y estado */}
            <div className="col-12 md:col-3 flex flex-column align-items-center justify-content-center gap-3 mb-4 md:mb-0">
              <div
                className="relative flex flex-column align-items-center"
                style={{ width: 180, height: 180 }}
              >
                {/* Estado del usuario sobre el avatar */}
                {avatar && (
                  <span
                    className="absolute"
                    style={{ top: 10, left: -30, zIndex: 3 }}
                  >
                    <Tag
                      severity={
                        profile?.estado === "activo" ? "success" : "danger"
                      }
                      className="px-1 py-1 text-sm flex align-items-center gap-2 border-round-2xl shadow-2"
                    >
                      <i
                        className={
                          profile?.estado === "activo"
                            ? "pi pi-check-circle"
                            : "pi pi-exclamation-triangle"
                        }
                      />
                      {profile?.estado === "activo" ? "Activo" : "Inactivo"}
                    </Tag>
                  </span>
                )}
                <Avatar
                  image={avatar}
                  size="xlarge"
                  shape="circle"
                  className="border-4 border-primary shadow-5 avatar-hover-effect"
                  style={{
                    width: 170,
                    height: 170,
                    fontSize: 72,
                    transition: "transform 0.3s, box-shadow 0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.07)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
                <label
                  htmlFor="avatar-upload"
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    zIndex: 2,
                  }}
                >
                  <span
                    className="p-button p-button-rounded p-button-lg flex align-items-center justify-content-center shadow-4 bg-primary hover:bg-primary-reverse border-none"
                    style={{
                      width: 48,
                      height: 48,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px 0 rgba(0,0,0,0.10)",
                    }}
                  >
                    <i
                      className="pi pi-camera text-white"
                      style={{ fontSize: 22 }}
                    />
                  </span>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        handleAvatarUpload({ files: [e.target.files[0]] });
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-column align-items-center gap-2 mt-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary text-center flex align-items-center gap-2">
                  {name}
                  <span
                    id="edit-user-tooltip"
                    className="ml-2 cursor-pointer"
                    onClick={() => setMyprofileFormDialog(true)}
                  >
                    <i
                      className="pi pi-user-edit text-primary"
                      style={{ fontSize: 22 }}
                    />
                  </span>
                  <Tooltip
                    target="#edit-user-tooltip"
                    content="Editar usuario"
                    position="top"
                  />
                  <span
                    id="change-password-tooltip"
                    className="ml-3 cursor-pointer"
                    onClick={() => setUsuarioPasswordFormDialog(true)}
                  >
                    <i
                      className="pi pi-key text-primary"
                      style={{ fontSize: 22 }}
                    />
                  </span>
                  <Tooltip
                    target="#change-password-tooltip"
                    content="Cambiar contraseña"
                    position="top"
                  />
                </h1>
              </div>
            </div>
            {/* Información de usuario */}
            <div className="col-12 sm:col-12 md:col-8 lg:col-9 xl:col-9">
              <div className="grid">
                {/* Primera fila: Correo y Rol */}
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="correo-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    <i className="pi pi-envelope text-primary text-xl" />
                    <span
                      className="text-900 font-semibold text-sm lg:text-lg overflow-hidden text-overflow-ellipsis white-space-nowrap block"
                      style={{ maxWidth: "100%" }}
                    >
                      {profile?.correo}
                    </span>
                  </div>
                  <Tooltip
                    mouseTrack
                    mouseTrackTop={10}
                    position="top"
                    target="#correo-tooltip"
                    content="Correo electrónico del usuario"
                  />
                </div>
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="rol-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    <i className="pi pi-briefcase text-primary text-xl" />
                    <span className="text-900 font-semibold text-lg">
                      {profile?.empresas?.[0]?.role?.name || "-"}
                    </span>
                  </div>
                  <Tooltip
                    mouseTrack
                    mouseTrackTop={10}
                    position="top"
                    target="#rol-tooltip"
                    content="Rol del usuario"
                  />
                </div>
                {/* Segunda fila: Teléfono y Departamento */}
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="telefono-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    <i className="pi pi-phone text-primary text-xl" />
                    <span className="text-900 font-semibold text-lg">
                      {profile?.telefono || "-"}
                    </span>
                  </div>
                  <Tooltip
                    mouseTrack
                    mouseTrackTop={10}
                    position="top"
                    target="#telefono-tooltip"
                    content="Teléfono del usuario"
                  />
                </div>
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="departamento-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    <i className="pi pi-building text-primary text-xl" />
                    <div className="flex flex-wrap gap-2">
                      {profile?.departamento &&
                      Array.isArray(profile.departamento) &&
                      profile.departamento.length > 0 ? (
                        profile.departamento.map((dep, idx) => (
                          <span
                            key={idx}
                            className="p-tag p-tag-rounded bg-primary text-white border-none px-3 py-1"
                            title={typeof dep === "string" ? dep : dep}
                          >
                            {typeof dep === "string" ? dep : dep}
                          </span>
                        ))
                      ) : (
                        <span className="text-900 font-semibold text-lg">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                  <Tooltip
                    mouseTrack
                    mouseTrackTop={10}
                    position="top"
                    target="#departamento-tooltip"
                    content="Departamentos a los que pertenece el usuario"
                  />
                </div>
                {/* Tercera fila: Acceso y Refinerías */}
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="acceso-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    <i className="pi pi-key text-primary text-xl" />
                    <span className="text-900 font-semibold text-lg">
                      {profile?.acceso || "-"}
                    </span>
                  </div>
                  <Tooltip
                    mouseTrack
                    mouseTrackTop={10}
                    position="top"
                    target="#acceso-tooltip"
                    content="Nivel de acceso del usuario"
                  />
                </div>
                <div className="col-12 sm:col-6 md:col-6 lg:col-6 xl:col-6">
                  <div
                    id="refineria-tooltip"
                    className="flex align-items-center gap-3 bg-white-alpha-80 border-round-lg p-3 shadow-1 h-full"
                  >
                    {/* Icono de refinería: usando pi pi-industry */}
                    <i className="pi pi-list-check text-primary text-xl" />
                    <div className="flex flex-column h-full justify-content-center">
                      {profile?.empresas && profile.empresas.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.empresas.map((empresa, idx) => (
                            <span
                              key={idx}
                              className="p-tag p-tag-rounded bg-primary text-white border-none px-3 py-1"
                              title={empresa.nombre}
                            >
                              {empresa.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-900 font-semibold text-lg">
                          -
                        </span>
                      )}
                    </div>
                    <Tooltip
                      mouseTrack
                      mouseTrackTop={10}
                      position="top"
                      target="#refineria-tooltip"
                      content="Refinerías asociadas al usuario"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!session && !usuarioFormDialog) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto ">
      <Toast ref={toast} position="top-right" />

      <div className="mb-6">
        {showProfile && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 40,
              filter: "blur(8px)",
            }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderProfileInfo()}
          </motion.div>
        )}
      </div>
      {profile && (
        <Dialog
          visible={usuarioFormDialog}
          style={{ minWidth: "400px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-user-edit mr-3 text-primary text-3xl"></i>
                  Editar Perfil
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideMyprofileFormDialog}
          footer={
            <FormActionButtons
              formId="profile-form"
              isUpdate
              isSubmitting={isSubmitting}
              onCancel={hideMyprofileFormDialog}
            />
          }
        >
          <MyprofileForm
            usuario={profile}
            formId="profile-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
          />
        </Dialog>
      )}
      <Dialog
        visible={usuarioPasswordFormDialog}
        style={{ width: "850px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-key mr-3 text-primary text-3xl"></i>
                Cambiar Contraseña
              </h2>
            </div>
          </div>
        }
        modal
        onHide={hideUsuarioPasswordFormDialog}
        footer={
          <FormActionButtons
            formId="password-form"
            isUpdate
            submitLabel="Cambiar Contraseña"
            isSubmitting={isPasswordSubmitting}
            onCancel={hideUsuarioPasswordFormDialog}
          />
        }
      >
        <UsuarioChangePasswordForm
          usuario={profile as any}
          hideUsuarioPasswordFormDialog={hideUsuarioPasswordFormDialog}
          onPasswordChanged={handlePasswordChanged}
          toast={toast}
          formId="password-form"
          onSubmittingChange={setIsPasswordSubmitting}
        />
      </Dialog>
    </div>
  );
};

export default MyProfileList;
