import { cookies } from "next/headers";
import ClientProviders from "@/components/common/ClientProviders";
import "../styles/layout/layout.scss";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.css";
import "../styles/demo/Demos.scss";
import "../styles/globals.css";

export const metadata = {
  title: "AutoSys",
  description: "Sistema de gestión AutoSys",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Leer preferencias del tema desde la cookie (server-side)
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("layoutConfig");
  let colorScheme = "light";
  let componentTheme = "blue";
  let scale = 14;

  if (themeCookie?.value) {
    try {
      const parsed = JSON.parse(themeCookie.value);
      colorScheme = parsed.colorScheme || "light";
      componentTheme = parsed.componentTheme || "blue";
      scale = parsed.scale || 14;
    } catch (e) {
      // ignore
    }
  }

  const themeHref = `/theme/theme-${colorScheme}/${componentTheme}/theme.css`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link id="theme-link" href={themeHref} rel="stylesheet" />
        {scale !== 14 && (
          <style>{`html { font-size: ${scale}px; }`}</style>
        )}
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
