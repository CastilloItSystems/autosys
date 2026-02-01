"use client";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { number, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { classNames } from "primereact/utils";
import { useContext } from "react";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Page } from "@/types";
import { signIn } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressBar } from "primereact/progressbar";
import { Checkbox } from "primereact/checkbox";
import { createUser, registerUser } from "@/app/api/userService";

// Nuevo esquema de validación para registro
const registerSchema = z
  .object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    correo: z.string().email("Correo electrónico inválido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres") // 6 en vez de 8
      .regex(/[A-Za-z]/, "Debe contener al menos una letra") // letra
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string().nonempty("Debes confirmar tu contraseña"),
    telefono: z
      .string()
      .nonempty("El teléfono es obligatorio")
      .min(8, "El teléfono debe tener al menos 8 dígitos")
      .max(15, "El teléfono no puede exceder los 15 dígitos")
      .regex(/^\+[1-9]\d+$/, {
        message:
          "Formato inválido. Use: +[código país][número]. Ej: +584248286102",
      }),
    terminos: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos y condiciones" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof registerSchema>;

const RegisterForm: Page = () => {
  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const filledInput = layoutConfig.inputStyle === "filled";
  const { conectarSocket } = useSocket();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit", // validar sólo al enviar o al llamar manualmente trigger
    reValidateMode: "onSubmit", // no revalidar al cambiar
    defaultValues: {
      nombre: "",
      correo: "",
      password: "",
      confirmPassword: "",
      telefono: "",
    },
  });

  // Calcular fortaleza de la contraseña
  const password = watch("password", "");
  React.useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 50;
    if (/[0-9]/.test(password) && /[A-Za-z]/.test(password)) strength += 50;
    setProgress(strength);
  }, [password]);

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await trigger(["nombre", "correo", "telefono"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      // Validar campos de contraseña
      const fieldsValid = await trigger(["password", "confirmPassword"]);
      if (!fieldsValid) return;
      const { password, confirmPassword } = getValues();
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
      // limpiar error y avanzar
      setError("");
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Eliminar confirmPassword antes de enviar
      const { confirmPassword, terminos, ...userData } = data;

      const usuarioCreado = await registerUser(userData);
      if (!usuarioCreado.token) {
        throw new Error(usuarioCreado.message || "Error en el registro");
      }
      if (usuarioCreado) {
        // Autenticar automáticamente después del registro
        const resAuth = await signIn("credentials", {
          redirect: false,
          correo: data.correo,
          password: data.password,
        });

        if (resAuth?.error) {
          setError(resAuth.error as string);
          return;
        }

        if (resAuth?.ok) {
          setSuccess("¡Registro exitoso! Redirigiendo...");
          conectarSocket();
          setTimeout(() => router.push("/"), 2000);
        }
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Manejo de error de Axios
      if (
        err.isAxiosError &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setError(err.response.data.message);
      } else {
        setError(
          err.message || "Ocurrió un error inesperado. Inténtalo de nuevo."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        conectarSocket();
        window.location.href = result.url!;
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Error al iniciar con Google");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={classNames(
              "w-2rem h-2rem rounded-full flex align-items-center justify-content-center border-1",
              {
                "bg-primary text-white border-primary": step === num,
                "border-300": step !== num,
              }
            )}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="surface-ground h-screen w-screen flex align-items-center justify-content-center p-3">
      <div className="surface-card py-2 px-5 sm:px-5 shadow-5 flex flex-column w-full sm:w-30rem border-round-xl">
        <div className="text-center mb-5">
          <div className="mb-2">
            <i
              className="pi pi-fw pi-oil text-primary"
              style={{ fontSize: "3.5rem" }}
            />
          </div>
          <h1 className="font-bold text-3xl text-900 m-0">AutoSys</h1>
          <p className="text-color-secondary mt-2">
            Crea tu cuenta en la{" "}
            <strong className="text-primary">AutoSys</strong>
          </p>
        </div>

        {renderStepIndicator()}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-column gap-4"
        >
          {error && (
            <div className="p-3 bg-red-100 text-red-700 border-round-md border-1 border-red-300 flex align-items-center gap-2">
              <i className="pi pi-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-700 border-round-md border-1 border-green-300 flex align-items-center gap-2">
              <i className="pi pi-check-circle"></i>
              <span>{success}</span>
            </div>
          )}

          {/* Paso 1: Información personal */}
          {step === 1 && (
            <div className="grid gap-1">
              <div className="col-12  flex flex-column gap-2">
                <label htmlFor="nombre" className="font-medium text-900">
                  Nombre *
                </label>
                <span className="p-input-icon-left">
                  <i className="pi pi-user text-color-secondary" />
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        id="nombre"
                        placeholder="Tu nombre"
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                          "pl-5": filledInput,
                        })}
                        {...field}
                      />
                    )}
                  />
                </span>
                {errors.nombre && (
                  <small className="p-error text-xs">
                    {errors.nombre.message}
                  </small>
                )}
              </div>

              <div className="col-12 flex flex-column gap-2">
                <label htmlFor="correo" className="font-medium text-900">
                  Correo electrónico *
                </label>
                <span className="p-input-icon-left">
                  <i className="pi pi-envelope text-color-secondary" />
                  <Controller
                    name="correo"
                    control={control}
                    render={({ field, fieldState }) => (
                      <InputText
                        id="correo"
                        type="email"
                        placeholder="usuario@AutoSys.com"
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                          "pl-5": filledInput,
                        })}
                        {...field}
                      />
                    )}
                  />
                </span>
                {errors.correo && (
                  <small className="p-error text-xs">
                    {errors.correo.message}
                  </small>
                )}
              </div>

              <div className="col-12 flex flex-column gap-2">
                <label htmlFor="telefono" className="font-medium text-900">
                  Teléfono *
                </label>
                <span className="p-input-icon-left">
                  <i className="pi pi-phone text-color-secondary" />
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field, fieldState }) => (
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
                    )}
                  />
                </span>
                {errors.telefono && (
                  <small className="p-error text-xs">
                    {errors.telefono.message}
                  </small>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Credenciales */}
          {step === 2 && (
            <div className="grid gap-4">
              <div className="col-12 flex flex-column gap-2">
                <label htmlFor="password" className="font-medium text-900">
                  Contraseña *
                </label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Password
                        inputId="password"
                        placeholder="Crea tu contraseña"
                        toggleMask
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                          "p-input-filled": filledInput,
                        })}
                        inputClassName="w-full"
                        feedback={false}
                        style={{ width: "100%" }}
                        {...field}
                      />
                      <div className="mt-2">
                        <ProgressBar
                          value={progress}
                          showValue={false}
                          className="h-1rem"
                          color={
                            progress < 34
                              ? "#e24c4c"
                              : progress < 67
                              ? "#f1c40f"
                              : "#4caf50"
                          }
                        />
                        <div className="flex justify-content-between mt-1">
                          <small
                            className={
                              password.length >= 6
                                ? "text-green-500"
                                : "text-color-secondary"
                            }
                          >
                            6+ caracteres
                          </small>
                          <small
                            className={
                              /[A-Za-z]/.test(password)
                                ? "text-green-500"
                                : "text-color-secondary"
                            }
                          >
                            Letra
                          </small>
                          <small
                            className={
                              /[0-9]/.test(password)
                                ? "text-green-500"
                                : "text-color-secondary"
                            }
                          >
                            Número
                          </small>
                        </div>
                      </div>
                    </>
                  )}
                />
                {errors.password && (
                  <small className="p-error text-xs">
                    {errors.password.message}
                  </small>
                )}
              </div>

              <div className="col-12 flex flex-column gap-2">
                <label
                  htmlFor="confirmPassword"
                  className="font-medium text-900"
                >
                  Confirmar Contraseña *
                </label>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Password
                        inputId="confirmPassword"
                        placeholder="Confirma tu contraseña"
                        toggleMask
                        className={classNames("w-full", {
                          "p-invalid": fieldState.error,
                          "p-input-filled": filledInput,
                        })}
                        inputClassName="w-full"
                        feedback={false}
                        style={{ width: "100%" }}
                        {...field}
                      />
                      {fieldState.error && (
                        <small className="p-error text-xs">
                          {fieldState.error.message}
                        </small>
                      )}
                    </>
                  )}
                />
                {/* {errors.confirmPassword && (
                  <small className="p-error text-xs">
                    {errors.confirmPassword.message}
                  </small>
                )} */}
              </div>
            </div>
          )}

          {/* Paso 3: Términos y condiciones */}
          {step === 3 && (
            <div className="flex flex-column gap-4">
              <div className="flex flex-column gap-2">
                <h3 className="text-center">Términos y Condiciones</h3>
                <div
                  className="border-1 surface-border border-round p-4"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  <p className="text-sm">
                    Al registrarte en AutoSys, aceptas nuestros términos y
                    condiciones. Asegúrate de leer detenidamente toda la
                    información antes de continuar.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>1. Uso de la plataforma:</strong> La plataforma está
                    destinada exclusivamente para uso interno de empleados y
                    colaboradores autorizados de AutoSys.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>2. Confidencialidad:</strong> Te comprometes a
                    mantener la confidencialidad de toda la información a la que
                    accedas a través de esta plataforma.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>3. Responsabilidades:</strong> Eres responsable de
                    todas las actividades que ocurran bajo tu cuenta.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>4. Protección de datos:</strong> Respetamos tu
                    privacidad y protegemos tus datos según nuestra política de
                    privacidad.
                  </p>
                </div>
              </div>

              <div className="flex align-items-center">
                <Controller
                  name="terminos"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      inputId="terminos"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.checked)}
                      className={classNames({
                        "p-invalid": errors.terminos,
                      })}
                    />
                  )}
                />
                <label htmlFor="terminos" className="ml-2 text-sm">
                  Acepto los términos y condiciones
                </label>
              </div>
              {errors.terminos && (
                <small className="p-error text-xs">
                  {errors.terminos.message}
                </small>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-3">
            {step > 1 && (
              <Button
                label="Atrás"
                icon="pi pi-arrow-left"
                className="flex-1"
                type="button"
                outlined
                onClick={handlePrevStep}
                disabled={submitting}
              />
            )}

            {step < 3 ? (
              <Button
                label="Siguiente"
                icon="pi pi-arrow-right"
                iconPos="right"
                className="flex-1"
                type="button"
                onClick={handleNextStep}
                disabled={submitting}
              />
            ) : (
              <Button
                label="Registrarse"
                icon="pi pi-check"
                className="flex-1"
                type="submit"
                loading={submitting}
                disabled={submitting || !isValid}
              />
            )}
          </div>
        </form>

        <Divider align="center" className="my-4">
          <span className="text-color-secondary">o regístrate con</span>
        </Divider>

        <div className="flex justify-content-center gap-3">
          <Button
            outlined
            severity="secondary"
            className="flex-1"
            onClick={handleGoogleLogin}
            disabled={submitting}
          >
            <i className="pi pi-google mr-2"></i>
            Google
          </Button>
          <Button
            outlined
            severity="secondary"
            className="flex-1"
            onClick={() => signIn("azure-ad")}
            disabled={submitting}
          >
            <i className="pi pi-microsoft mr-2"></i>
            Microsoft
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm">
            ¿Ya tienes una cuenta?{" "}
            <a
              href="/auth/login"
              className="text-primary font-medium no-underline hover:underline"
              onClick={(e) => {
                e.preventDefault();
                router.push("/auth/login");
              }}
            >
              Inicia sesión
            </a>
          </p>
        </div>

        <div className="text-center text-color-secondary mt-5">
          <p className="text-sm">
            © {new Date().getFullYear()} AutoSys
            <br />
            <span className="text-xs">Todos los derechos reservados</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
