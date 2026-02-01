import { Recepcion, Refineria } from "@/libs/interfaces";
import { getSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ExtendedUser {
  token: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  online: boolean;
  conectarSocket: () => void;
  desconectarSocket: () => void;
  recepcionModificado: Recepcion | null;
  refineriaModificado: Refineria | null;
  notification: any | null;
}

export const useSocket = (): UseSocketReturn => {
  //const serverPath = "http://localhost:8080";
  const serverPath = "https://api-maroil-refinery-2500582bacd8.herokuapp.com";
  const [online, setOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recepcionModificado, setRecepcionModificado] =
    useState<Recepcion | null>(null);
  // console.log("recepcionModificado", recepcionModificado);
  const [refineriaModificado, setRefineriaModificado] =
    useState<Refineria | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  // console.log(notification);

  const conectarSocket = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      console.error("No hay sesión activa");
      return;
    }

    const token = (session.user as ExtendedUser)?.token;
    if (!token) {
      console.error("No se encontró el token en la sesión");
      return;
    }

    const socketTemp = io(serverPath, {
      transports: ["websocket"],
      autoConnect: true,
      forceNew: true,
      query: {
        "x-token": token,
      },
    });

    socketTemp.on("connect", () => {
      // console.log("Connected to server");
      setOnline(true);
    });

    socketTemp.on("disconnect", () => {
      // console.log("Disconnected from server");
      setOnline(false);
    });

    socketTemp.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
    // Escucha un nuevo evento "mensaje" del servidor

    setSocket(socketTemp);
  }, [serverPath]);

  const desconectarSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setOnline(false);
    }
  }, [socket]);

  // Se intenta conectar automáticamente si no hay conexión activa
  useEffect(() => {
    if (!socket) {
      conectarSocket();
    }
  }, [socket, conectarSocket]);

  useEffect(() => {
    // Escucha un nuevo evento "mensaje" del servidor
    socket?.on("welcome", (data) => {
      console.log("Mensaje recibido del servidor:", data);
      // Aquí puedes actualizar el estado o realizar otra acción según lo recibido.
    });
  }, [socket]);

  useEffect(() => {
    socket?.on("refineria-modificada", (refineria) => {
      console.log("Refinería modificada:", refineria);
      // Actualizar la lista de refinerías en el cliente
    });
  }, [socket]);

  useEffect(() => {
    socket?.on("recepcion-modificada", (recepcion) => {
      console.log("Recepcion Modificada", recepcion);
      setRecepcionModificado(recepcion);
      // Actualizar la lista de refinerías en el cliente
    });
  }, [socket]);

  useEffect(() => {
    socket?.on("new-notification", (notification) => {
      // console.log("notificacion:", notification);
      setNotification(notification);
      // console.log("notificacion", notification);
      // Aquí puedes actualizar el estado o realizar otra acción según lo recibido.
    });
  }, [socket]);
  return {
    socket,
    online,
    conectarSocket,
    desconectarSocket,
    recepcionModificado,
    refineriaModificado,
    notification,
  };
};
