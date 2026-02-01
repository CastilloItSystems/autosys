import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import "primereact/resources/themes/lara-light-blue/theme.css";
import { motion } from "framer-motion";

import { classNames } from "primereact/utils";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import UsuarioChangePasswordForm from "../usuarioComponents/UsuarioChangePasswordForm";
import { Tooltip } from "primereact/tooltip";
import MyprofileForm from "./MyprofileForm";

const MyProfileList: React.FC = () => {
  const { data: session, update } = useSession();
  const profile = session?.user;
  const toast = useRef<Toast>(null);
  const [usuarioFormDialog, setMyprofileFormDialog] = useState(false);
  const [name, setName] = useState(profile?.usuario?.nombre || "");
  const [email, setEmail] = useState(profile?.usuario?.correo || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState(
    profile?.usuario?.img ||
      "https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
  );
  const [usuarioPasswordFormDialog, setUsuarioPasswordFormDialog] =
    useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const showToast = (
    severity: "success" | "info" | "warn" | "error",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };
  const hideUsuarioPasswordFormDialog = () => {
    setUsuarioPasswordFormDialog(false);
  };
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simular actualización de perfil en el backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Actualizar sesión
      await update({
        ...session,
        user: {
          ...session?.user,
          usuario: {
            ...session?.user?.usuario,
            nombre: name,
            correo: email,
          },
        },
      });

      showToast("success", "Éxito", "Perfil actualizado correctamente");
      setMyprofileFormDialog(false);
    } catch (error) {
      showToast("error", "Error", "No se pudo actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: any) => {
    const file = e.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
        showToast("success", "Éxito", "Avatar actualizado correctamente");
      };
      reader.readAsDataURL(file);
    }
  };
  const hideMyprofileFormDialog = () => {
    setMyprofileFormDialog(false);
  };
  useEffect(() => {
    if (profile?.usuario) {
      setName(profile.usuario.nombre || "");
      setEmail(profile.usuario.correo || "");
      if (profile.usuario.img) {
        setAvatar(profile.usuario.img);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && session) {
      // Pequeño retardo para que el efecto de animación se aprecie
      const timeout = setTimeout(() => setShowProfile(true), 250);
      return () => clearTimeout(timeout);
    } else {
      setShowProfile(false);
    }
  }, [isLoading, session]);

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
                        profile?.usuario?.estado === "true"
                          ? "success"
                          : "danger"
                      }
                      className="px-1 py-1 text-sm flex align-items-center gap-2 border-round-2xl shadow-2"
                    >
                      <i
                        className={
                          profile?.usuario?.estado === "true"
                            ? "pi pi-check-circle"
                            : "pi pi-exclamation-triangle"
                        }
                      />
                      {profile?.usuario?.estado === "true"
                        ? "Activo"
                        : "Inactivo"}
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
                      {profile?.usuario?.correo}
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
                      {profile?.usuario?.rol || "-"}
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
                      {profile?.usuario?.telefono || "-"}
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
                      {profile?.usuario?.departamento &&
                      Array.isArray(profile.usuario.departamento) &&
                      profile.usuario.departamento.length > 0 ? (
                        profile.usuario.departamento.map((dep, idx) => (
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
                      {profile?.usuario?.acceso || "-"}
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
                      {profile?.usuario?.idRefineria &&
                      Array.isArray(profile.usuario.idRefineria) &&
                      profile.usuario.idRefineria.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.usuario.idRefineria.map((refineria, idx) => (
                            <span
                              key={idx}
                              className="p-tag p-tag-rounded bg-primary text-white border-none px-3 py-1"
                              title={
                                typeof refineria === "string"
                                  ? refineria
                                  : refineria.nombre
                              }
                            >
                              {typeof refineria === "string"
                                ? refineria
                                : refineria.nombre}
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

  if (isLoading || (!session && !usuarioFormDialog)) {
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
        {!isLoading && (
          <>
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
          </>
        )}
      </div>
      {profile?.usuario && (
        <Dialog
          visible={usuarioFormDialog}
          style={{ minWidth: "300px" }}
          header="Editar Perfil"
          modal
          // footer={deleteProductDialogFooter}
          onHide={hideMyprofileFormDialog}
          content={() => (
            <MyprofileForm
              usuario={profile.usuario!}
              hideMyprofileFormDialog={hideMyprofileFormDialog}
              // usuarios={usuarios}
              // setUsuarios={setUsuarios}
            />
          )}
        ></Dialog>
      )}
      <Dialog
        visible={usuarioPasswordFormDialog}
        style={{ width: "850px" }}
        header="Editar Usuario"
        modal
        // footer={deleteProductDialogFooter}
        onHide={hideUsuarioPasswordFormDialog}
        content={() => (
          <UsuarioChangePasswordForm
            usuario={profile?.usuario}
            hideUsuarioPasswordFormDialog={hideUsuarioPasswordFormDialog}
            showToast={showToast}
          />
        )}
      ></Dialog>
    </div>
  );
};

export default MyProfileList;
