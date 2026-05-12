"use client";

import { useEffect, useMemo, useState } from "react";
import type { Empresa } from "@/modules/companies/interfaces/empresa.interface";
import { useEmpresasStore } from "@/store/empresasStore";
import { urlToBase64ViaProxy } from "./pdfImage";

export interface PdfCompanyInfo {
  name: string;
  rif?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoDataUrl?: string;
}

export const FALLBACK_PDF_COMPANY: PdfCompanyInfo = {
  name: "AutoSys",
};

const clean = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized || undefined;
};

export const buildPdfCompanyInfo = (
  empresa?: Empresa | null,
  logoDataUrl?: string | null,
): PdfCompanyInfo => ({
  name: clean(empresa?.nombre) || FALLBACK_PDF_COMPANY.name,
  rif: clean(empresa?.numerorif),
  address: clean(empresa?.direccion),
  phone: clean(empresa?.telefonos),
  email: clean(empresa?.email),
  logoDataUrl: clean(logoDataUrl),
});

export const usePdfCompanyInfo = () => {
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const logoUrl = activeEmpresa?.logo_url;

    setLogoDataUrl(null);

    if (!logoUrl) {
      setIsLoadingLogo(false);
      return () => {
        cancelled = true;
      };
    }

    if (logoUrl.startsWith("data:")) {
      setLogoDataUrl(logoUrl);
      setIsLoadingLogo(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingLogo(true);
    urlToBase64ViaProxy(logoUrl)
      .then((dataUrl) => {
        if (!cancelled) {
          setLogoDataUrl(dataUrl);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingLogo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeEmpresa?.logo_url]);

  const company = useMemo(
    () => buildPdfCompanyInfo(activeEmpresa, logoDataUrl),
    [activeEmpresa, logoDataUrl],
  );

  return { company, isLoadingLogo };
};
