"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import {
  DEFAULT_SESSION_EXPIRED_DETAIL,
  SESSION_EXPIRED_EVENT,
  type SessionExpiredEventDetail,
} from "@/lib/sessionExpiration";

export default function SessionExpiredDialog() {
  const [visible, setVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [detail, setDetail] = useState<SessionExpiredEventDetail>(
    DEFAULT_SESSION_EXPIRED_DETAIL,
  );

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const expiredEvent =
        event as CustomEvent<Partial<SessionExpiredEventDetail>>;

      setDetail({
        ...DEFAULT_SESSION_EXPIRED_DETAIL,
        ...expiredEvent.detail,
      });
      setVisible(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/auth/login" });
  }, []);

  const footer = (
    <div className="flex justify-content-center sm:justify-content-end">
      <Button
        autoFocus
        className="w-full sm:w-auto"
        icon="pi pi-sign-in"
        label="Iniciar sesión"
        loading={isSigningOut}
        onClick={handleSignIn}
      />
    </div>
  );

  return (
    <Dialog
      breakpoints={{ "640px": "calc(100vw - 2rem)" }}
      closable={false}
      closeOnEscape={false}
      contentClassName="pt-2"
      draggable={false}
      footer={footer}
      header={detail.title}
      modal
      onHide={() => null}
      resizable={false}
      style={{ width: "min(30rem, calc(100vw - 2rem))" }}
      visible={visible}
    >
      <div className="flex flex-column align-items-center text-center gap-3">
        <div className="flex align-items-center justify-content-center gap-2">
          <span
            className="inline-flex align-items-center justify-content-center border-circle"
            style={{
              backgroundColor: "var(--surface-100)",
              height: "3rem",
              width: "3rem",
            }}
          >
            <Image
              alt="AutoSys"
              height={38}
              src="/layout/images/logo-AutoSys-Completo.png"
              style={{
                height: "2.25rem",
                objectFit: "contain",
                width: "2.25rem",
              }}
              width={38}
            />
          </span>
          <span className="font-semibold text-xl text-color">AutoSys</span>
        </div>
        <span
          aria-hidden="true"
          className="inline-flex align-items-center justify-content-center border-circle"
          style={{
            backgroundColor: "var(--primary-50)",
            color: "var(--primary-600)",
            height: "3.25rem",
            width: "3.25rem",
          }}
        >
          <i className="pi pi-lock text-3xl" />
        </span>
        <div className="flex flex-column gap-2">
          <p className="m-0 line-height-3 text-color-secondary">
            {detail.message}
          </p>
          <small className="text-color-secondary">
            Por seguridad, vuelve a iniciar sesión para continuar trabajando.
          </small>
        </div>
      </div>
    </Dialog>
  );
}
