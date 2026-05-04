"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";
import { NotificationItem } from "@/shared/services/notificationService";

interface ExtendedUser {
  token: string;
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
}

export const SocketContext = createContext<UseSocketReturn | undefined>(
  undefined,
);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const activeEmpresaId = activeEmpresa?.id_empresa;
  const [online, setOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );

  const conectarSocket = useCallback(() => {
    if (status !== "authenticated" || !session) {
      return;
    }

    const token = (session.user as ExtendedUser)?.token;
    if (!token) {
      console.error("SocketProvider: No se encontró el token en la sesión");
      return;
    }

    // Usar NEXT_PUBLIC_API_BASE_URL. Removiendo '/api' al final porque los WS se conectan a la raíz.
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
    const serverPath = apiBaseUrl.replace(/\/api\/?$/, "");
    const authPayload: SocketAuthPayload = { token };
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

    setSocket(socketTemp);
  }, [session, status, activeEmpresaId]);

  const desconectarSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setOnline(false);
    }
  }, [socket]);

  // Se intenta conectar automáticamente si hay sesión y no hay socket
  useEffect(() => {
    if (status === "authenticated" && !socket) {
      conectarSocket();
    } else if (status === "unauthenticated" && socket) {
      desconectarSocket();
    }
  }, [status, socket, conectarSocket, desconectarSocket]);

  // Si cambia la empresa activa, forzamos reconexión para revalidar membresía/rol en backend
  useEffect(() => {
    if (!socket) return;

    const socketOpts = socket.io.opts as { auth?: SocketAuthPayload };
    const socketEmpresaId = socketOpts.auth?.empresaId;
    const currentSocketEmpresaId = socketEmpresaId || null;
    const currentActiveEmpresaId = activeEmpresaId || null;

    if (currentSocketEmpresaId !== currentActiveEmpresaId) {
      socket.disconnect();
      setSocket(null);
      setOnline(false);
    }
  }, [socket, activeEmpresaId]);

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

  return (
    <SocketContext.Provider
      value={{
        socket,
        online,
        conectarSocket,
        desconectarSocket,
        notification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
