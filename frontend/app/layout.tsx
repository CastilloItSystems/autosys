"use client";
import { LayoutProvider } from "../layout/context/layoutcontext";
import { addLocale, PrimeReactProvider } from "primereact/api";
import "../styles/layout/layout.scss";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.css";
import "../styles/demo/Demos.scss";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import AppInitializer from "@/components/common/AppInitializer";
import { SWRCacheProvider } from "@/store/SWRCacheProvider";

addLocale("es", {
  firstDayOfWeek: 1,
  // showMonthAfterYear: true,
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          id="theme-link"
          href={`/theme/theme-light/blue/theme.css`}
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <SessionProvider>
          <LayoutProvider>
            <PrimeReactProvider value={{ ripple: true }}>
              <AppInitializer />
              <SWRCacheProvider>{children}</SWRCacheProvider>
            </PrimeReactProvider>
          </LayoutProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
