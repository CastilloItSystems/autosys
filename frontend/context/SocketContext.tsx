"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { mutate as mutateSWR } from "swr";
import { useSession } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";
import { PERMISSIONS_SWR_KEY } from "@/hooks/usePermissionsData";
import { NotificationItem } from "@/shared/services/notificationService";
import { SESSION_EXPIRED_EVENT } from "@/lib/sessionExpiration";

interface ExtendedUser {
  token?: string;
}

interface SocketAuthPayload {
  token: string;
  empresaId?: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  online: boolean;
  conectarSocket: () => void;
  desconectarSocket: () => void;
  notification: NotificationItem | null;
  membershipChanged: boolean;
  clearMembershipChanged: () => void;
}

export const SocketContext = createContext<UseSocketReturn | undefined>(
  undefined,
);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status, update } = useSession();
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const activeEmpresaId = activeEmpresa?.id_empresa;
  const sessionToken = (session?.user as ExtendedUser | undefined)?.token;
  const [online, setOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );
  const [membershipChanged, setMembershipChanged] = useState(false);

  const clearMembershipChanged = useCallback(() => setMembershipChanged(false), []);

  const conectarSocket = useCallback(() => {
    if (status !== "authenticated" || !session) {
      return;
    }

    if (!sessionToken) {
      console.error("SocketProvider: No se encontró el token en la sesión");
      return;
    }

    // Usar NEXT_PUBLIC_API_BASE_URL. Removiendo '/api' al final porque los WS se conectan a la raíz.
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
    const serverPath = apiBaseUrl.replace(/\/api\/?$/, "");
    const authPayload: SocketAuthPayload = { token: sessionToken };
    if (activeEmpresaId) {
      authPayload.empresaId = activeEmpresaId;
    }

    const socketTemp = io(serverPath, {
      transports: ["websocket"],
      autoConnect: true,
      forceNew: true,
      auth: authPayload, // Incluye token + empresa activa para validación multiempresa en backend
    });

    socketTemp.on("connect", () => setOnline(true));
    socketTemp.on("disconnect", () => setOnline(false));
    socketTemp.on("connect_error", (error) =>
      console.error("Socket Connection error:", error),
    );

    socketTemp.on("welcome", (data) =>
      console.log("Mensaje recibido del servidor:", data),
    );
    socketTemp.on("notifications:received", (notificationData: NotificationItem) => {
      const incomingEmpresaId =
        typeof notificationData?.empresaId === "string"
          ? notificationData.empresaId
          : null;

      if (!activeEmpresaId || !incomingEmpresaId) return;
      if (incomingEmpresaId !== activeEmpresaId) return;

      setNotification(notificationData);
    });
    socketTemp.on("inventory:stock-updated", (data) =>
      console.log("Stock actualizado:", data),
    );
    socketTemp.on("inventory:alert", (data) =>
      console.log("Alerta de inventario:", data),
    );
    socketTemp.on("membership:permissions-changed", async () => {
      await update({ forcePermissionsRefresh: true });
      // Los permisos ya no viven en el token: revalidar el cache de SWR.
      await mutateSWR(PERMISSIONS_SWR_KEY);
      setMembershipChanged(true);
    });

    setSocket(socketTemp);
  }, [session, sessionToken, status, activeEmpresaId]);

  const desconectarSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setOnline(false);
    }
  }, [socket]);

  // Se intenta conectar automáticamente si hay sesión y no hay socket
  useEffect(() => {
    if (status === "authenticated" && sessionToken && !socket) {
      conectarSocket();
    } else if (status === "unauthenticated" && socket) {
      desconectarSocket();
    }
  }, [status, sessionToken, socket, conectarSocket, desconectarSocket]);

  // Si cambia la empresa activa o el access token, forzamos reconexión.
  useEffect(() => {
    if (!socket) return;

    const socketOpts = socket.io.opts as { auth?: SocketAuthPayload };
    const socketEmpresaId = socketOpts.auth?.empresaId;
    const socketToken = socketOpts.auth?.token;
    const currentSocketEmpresaId = socketEmpresaId || null;
    const currentActiveEmpresaId = activeEmpresaId || null;

    if (
      socketToken !== sessionToken ||
      currentSocketEmpresaId !== currentActiveEmpresaId
    ) {
      socket.disconnect();
      setSocket(null);
      setOnline(false);
    }
  }, [socket, sessionToken, activeEmpresaId]);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, desconectarSocket);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, desconectarSocket);
    };
  }, [desconectarSocket]);

  useEffect(() => {
    setNotification(null);
  }, [activeEmpresaId]);

  // Limpiar el socket al desmontar el Provider
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = useMemo<UseSocketReturn>(
    () => ({
      socket,
      online,
      conectarSocket,
      desconectarSocket,
      notification,
      membershipChanged,
      clearMembershipChanged,
    }),
    [
      socket,
      online,
      conectarSocket,
      desconectarSocket,
      notification,
      membershipChanged,
      clearMembershipChanged,
    ],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
