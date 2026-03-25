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
import { Recepcion, Refineria } from "@/libs/interfaces";

interface ExtendedUser {
  token: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  online: boolean;
  conectarSocket: () => void;
  desconectarSocket: () => void;
  recepcionModificado: Recepcion | null;
  refineriaModificado: Refineria | null;
  notification: any | null;
}

export const SocketContext = createContext<UseSocketReturn | undefined>(
  undefined,
);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [online, setOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recepcionModificado, setRecepcionModificado] =
    useState<Recepcion | null>(null);
  const [refineriaModificado, setRefineriaModificado] =
    useState<Refineria | null>(null);
  const [notification, setNotification] = useState<any | null>(null);

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

    const socketTemp = io(serverPath, {
      transports: ["websocket"],
      autoConnect: true,
      forceNew: true,
      auth: { token }, // Pasamos el token como auth para que el backend lo reciba en socket.handshake.auth.token
    });

    socketTemp.on("connect", () => setOnline(true));
    socketTemp.on("disconnect", () => setOnline(false));
    socketTemp.on("connect_error", (error) =>
      console.error("Socket Connection error:", error),
    );

    socketTemp.on("welcome", (data) =>
      console.log("Mensaje recibido del servidor:", data),
    );
    socketTemp.on("refineria-modificada", (refineria) =>
      setRefineriaModificado(refineria),
    );
    socketTemp.on("recepcion-modificada", (recepcion) =>
      setRecepcionModificado(recepcion),
    );
    socketTemp.on("new-notification", (notificationData) =>
      setNotification(notificationData),
    );
    // Listen to new inventory event patterns
    socketTemp.on("notification:received", (notificationData) =>
      setNotification(notificationData),
    );
    socketTemp.on("inventory:stock-updated", (data) =>
      console.log("Stock actualizado:", data),
    );
    socketTemp.on("inventory:alert", (data) =>
      console.log("Alerta de inventario:", data),
    );

    setSocket(socketTemp);
  }, [session, status]);

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
        recepcionModificado,
        refineriaModificado,
        notification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
