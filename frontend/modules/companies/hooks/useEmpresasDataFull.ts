"use client";
import {
  getEmpresas,
  Empresa as EmpresaService,
} from "@/modules/companies/services/empresa.service";
import { Empresa } from "@/modules/companies/interfaces/empresa.interface";
import { useCallback } from "react";
import useSWR from "swr";

// Tipo para el estado consolidado
interface EmpresaData {
  empresas: Empresa[];
}

const toEmpresa = (empresa: EmpresaService): Empresa => ({
  id: empresa.id,
  name: empresa.name,
  address: empresa.address,
  phones: empresa.phones,
  fax: empresa.fax,
  rif: empresa.numerorif,
  nit: empresa.numeronit,
  website: empresa.website,
  email: empresa.email,
  contact: empresa.contact,
  isDefault: empresa.isDefault,
  support1: empresa.soporte1,
  support2: empresa.soporte2,
  support3: empresa.soporte3,
  usesWeb: empresa.data_usaweb,
  dbServer: empresa.data_servidor,
  dbUser: empresa.data_usuario,
  dbPassword: empresa.data_password,
  dbPort: empresa.data_port,
  license: empresa.licencia,
  archived: empresa.historizada,
  additionalInfo: empresa.masinfo,
  usesPrefix: empresa.usa_prefijo,
  prefixName: empresa.name_prefijo,
  dbPrefix: empresa.dprefijobd,
  serverPrefix: empresa.dprefijosrv,
  userPrefix: empresa.dprefijousr,
  logoUrl: empresa.logoUrl,
  deleted: empresa.deleted,
  createdAt: empresa.createdAt,
  updatedAt: empresa.updatedAt,
});

/**
 * Hook para obtener y manejar todos los datos globales de la aplicación (sin filtrar por refinería), usando SWR.
 * @param recepcionModificado - Recepción modificada para actualizar en el estado
 */
const fetcher = async () => {
  const results = await Promise.allSettled([getEmpresas()]);
  console.log(results);
  const [empresasDB] = results.map((r) =>
    r.status === "fulfilled" ? r.value : null,
  );

  return {
    empresas: empresasDB?.companies.map(toEmpresa) || [],
  };
};

export const useEmpresaDataFull = () => {
  const { data, error, isLoading, mutate } = useSWR<EmpresaData>(
    "empresa-data-global",
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    ...(data || {}),
    loading: isLoading,
    error,
    // updateRecepciones,
    mutateEmpresaDataFull: useCallback(() => {
      mutate();
    }, [mutate]),
  };
};
