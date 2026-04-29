"use client";

import { addLocale, PrimeReactProvider } from "primereact/api";
import { SessionProvider } from "next-auth/react";
import { LayoutProvider } from "@/layout/context/layoutcontext";
import { SWRCacheProvider } from "@/shared/providers/SWRCacheProvider";
import AppInitializer from "@/shared/components/AppInitializer";
import { SocketProvider } from "@/context/SocketContext";

// Registrar locale español para PrimeReact
addLocale("es", {
  firstDayOfWeek: 1,
  dayNames: [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ],
  dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
  monthNames: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
  monthNamesShort: [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ],
  today: "Hoy",
  clear: "Limpiar",
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LayoutProvider>
        <PrimeReactProvider value={{ ripple: true }}>
          <SocketProvider>
            <AppInitializer />
            <SWRCacheProvider>{children}</SWRCacheProvider>
          </SocketProvider>
        </PrimeReactProvider>
      </LayoutProvider>
    </SessionProvider>
  );
}
