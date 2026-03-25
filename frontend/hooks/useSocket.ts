import { useContext } from "react";
import { SocketContext, UseSocketReturn } from "@/context/SocketContext";

export const useSocket = (): UseSocketReturn => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket debe ser usado dentro de un SocketProvider");
  }
  return context;
};
