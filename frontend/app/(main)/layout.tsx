import { Metadata, Viewport } from "next";
import Layout from "../../layout/layout";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export const metadata: Metadata = {
  title: "AutoSys",
  description: "AutoSys .",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: "AutoSys",
    url: "https://www.AutoSys.com.ve",
    description: "AutoSys .",

    ttl: 604800,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function MainLayout({ children }: MainLayoutProps) {
  return <Layout>{children}</Layout>;
}
