"use client";
import {
  getEmpresas,
  Empresa as EmpresaService,
} from "@/app/api/empresaService";
import { Empresa } from "@/libs/interfaces/empresaInterface";
import { useCallback } from "react";
import useSWR from "swr";

// Tipo para el estado consolidado
interface EmpresaData {
  empresas: Empresa[];
}

const nullableToOptional = <T,>(value: T | null | undefined): T | undefined =>
  value ?? undefined;

const toEmpresa = (empresa: EmpresaService): Empresa => ({
  id_empresa: empresa.id_empresa,
  nombre: empresa.nombre,
  direccion: nullableToOptional(empresa.direccion),
  telefonos: nullableToOptional(empresa.telefonos),
  fax: nullableToOptional(empresa.fax),
  numerorif: nullableToOptional(empresa.numerorif),
  numeronit: nullableToOptional(empresa.numeronit),
  website: nullableToOptional(empresa.website),
  email: nullableToOptional(empresa.email),
  contacto: nullableToOptional(empresa.contacto),
  predeter: empresa.predeter,
  soporte1: nullableToOptional(empresa.soporte1),
  soporte2: nullableToOptional(empresa.soporte2),
  soporte3: nullableToOptional(empresa.soporte3),
  data_usaweb: empresa.data_usaweb,
  data_servidor: nullableToOptional(empresa.data_servidor),
  data_usuario: nullableToOptional(empresa.data_usuario),
  data_password: nullableToOptional(empresa.data_password),
  data_port: nullableToOptional(empresa.data_port),
  licencia: nullableToOptional(empresa.licencia),
  historizada: empresa.historizada,
  masinfo: nullableToOptional(empresa.masinfo),
  usa_prefijo: empresa.usa_prefijo,
  name_prefijo: nullableToOptional(empresa.name_prefijo),
  dprefijobd: nullableToOptional(empresa.dprefijobd),
  dprefijosrv: nullableToOptional(empresa.dprefijosrv),
  dprefijousr: nullableToOptional(empresa.dprefijousr),
  logo_url: nullableToOptional(empresa.logo_url),
  eliminado: empresa.eliminado,
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
    empresas: empresasDB?.empresas.map(toEmpresa) || [],
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
