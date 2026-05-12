export const SESSION_EXPIRED_EVENT = "autosys:session-expired";

export type SessionExpiredEventDetail = {
  title: string;
  message: string;
};

export const DEFAULT_SESSION_EXPIRED_DETAIL: SessionExpiredEventDetail = {
  title: "Sesión finalizada",
  message: "Tu sesión ha finalizado. Inicia sesión nuevamente para continuar.",
};

export function notifySessionExpired(
  detail: Partial<SessionExpiredEventDetail> = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SessionExpiredEventDetail>(SESSION_EXPIRED_EVENT, {
      detail: {
        ...DEFAULT_SESSION_EXPIRED_DETAIL,
        ...detail,
      },
    }),
  );
}
