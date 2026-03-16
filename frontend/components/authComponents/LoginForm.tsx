"use client";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { classNames } from "primereact/utils";
import { useContext } from "react";
import { loginSchema } from "@/libs/zods";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Page } from "@/types";
import { signIn } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";

type FormData = z.infer<typeof loginSchema>;

const LoginForm: Page = () => {
  const router = useRouter();
  const { layoutConfig } = useContext(LayoutContext);
  const [error, setError] = useState("");
  const filledInput = layoutConfig.inputStyle === "filled";
  const { conectarSocket } = useSocket();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError("");
    try {
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
        router.push("/");
        conectarSocket();
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.");
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
        // Conectar socket y redirigir
        conectarSocket();
        // router.push("/");
        window.location.href = result.url!;
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Error al iniciar con Google");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="surface-ground h-screen w-screen flex align-items-center justify-content-center p-3">
      <div className="surface-card py-7 px-5 sm:px-7 shadow-5 flex flex-column w-full sm:w-30rem border-round-xl">
        <div className="text-center mb-5">
          <div className="mb-4">
            <i
              className="pi pi-fw pi-oil text-primary"
              style={{ fontSize: "3.5rem" }}
            />
          </div>
          <h1 className="font-bold text-3xl text-900 m-0">AutoSys</h1>
          <p className="text-color-secondary mt-2">Bienvenido a AutoSys</p>
        </div>

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

          <div className="flex flex-column gap-2">
            <label htmlFor="correo" className="font-medium text-900">
              Correo electrónico
            </label>
            <span className="p-input-icon-left">
              <i className="pi pi-envelope text-color-secondary" />
              <InputText
                id="correo"
                type="email"
                placeholder="usuario@AutoSys.com"
                className={classNames("w-full", {
                  "p-invalid": errors.correo,
                  "pl-5": filledInput,
                })}
                {...register("correo")}
              />
            </span>
            {errors.correo && (
              <small className="p-error text-xs">{errors.correo.message}</small>
            )}
          </div>

          <div className="flex flex-column gap-2">
            <div className="flex justify-content-between align-items-center">
              <label htmlFor="password" className="font-medium text-900">
                Contraseña
              </label>
              <a
                href="#"
                className="text-sm text-primary font-medium no-underline hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Lógica para recuperar contraseña
                }}
              >
                ¿Olvidó su contraseña?
              </a>
            </div>

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Password
                  inputId="password"
                  placeholder="Ingrese su contraseña"
                  toggleMask
                  className={classNames("w-full", {
                    "p-invalid": errors.password,
                    "p-input-filled": filledInput,
                  })}
                  inputClassName="w-full"
                  feedback={false}
                  style={{ width: "100%" }}
                  {...field}
                />
              )}
            />
            {errors.password && (
              <small className="p-error text-xs">
                {errors.password.message}
              </small>
            )}
          </div>

          <Button
            label="Iniciar Sesión"
            loading={submitting}
            icon={submitting ? undefined : "pi pi-sign-in"}
            className="w-full mt-2"
            type="submit"
            size="large"
          ></Button>
        </form>

        <div className="flex align-items-center my-4">
          <div className="flex-grow-1 border-top-1 surface-border"></div>
          <span className="mx-3 text-color-secondary">o continúe con</span>
          <div className="flex-grow-1 border-top-1 surface-border"></div>
        </div>

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
          >
            <i className="pi pi-microsoft mr-2"></i>
            Microsoft
          </Button>
        </div>
        <div className="text-center mt-4">
          <p className="text-sm">
            ¿No tienes una cuenta?{" "}
            <a
              href="/auth/register"
              className="text-primary font-medium no-underline hover:underline"
              onClick={(e) => {
                e.preventDefault();
                router.push("/auth/register");
              }}
            >
              Regístrate
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

export default LoginForm;
