import {
  getTorresDestilacion,
  getLineaRecepcions,
  getLineaDespachos,
  getRecepcions,
  getDespachos,
  getContratos,
  getProductos,
  getTipoProductos,
  getContactos,
  getCorteRefinacions,
  getChequeoCantidads,
  getChequeoCalidads,
  getPartidas,
  getTanques,
  getRefinerias,
} from "@/app/api";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import {
  Tanque,
  TorreDestilacion,
  LineaRecepcion,
  Recepcion,
  Contrato,
  Producto,
  TipoProducto,
  Contacto,
  LineaDespacho,
  Despacho,
  CorteRefinacion,
  ChequeoCantidad,
  ChequeoCalidad,
  Partida,
  Refineria,
} from "@/libs/interfaces";

// Tipo para el estado consolidado
interface RefineryData {
  tanques: Tanque[];
  torresDestilacions: TorreDestilacion[];
  lineaRecepcions: LineaRecepcion[];
  lineaDespachos: LineaDespacho[];
  recepcions: Recepcion[];
  despachos: Despacho[];
  contratos: Contrato[];
  productos: Producto[];
  tipoProductos: TipoProducto[];
  contactos: Contacto[];
  corteRefinacions: CorteRefinacion[];
  chequeoCantidads: ChequeoCantidad[];
  chequeoCalidads: ChequeoCalidad[];
  partidas: Partida[];
  refinerias: Refineria[];
}

/**
 * Hook para obtener y manejar todos los datos globales de la aplicación (sin filtrar por refinería), usando SWR.
 * @param recepcionModificado - Recepción modificada para actualizar en el estado
 */
const fetcher = async () => {
  const results = await Promise.allSettled([
    getTanques(),
    getTorresDestilacion(),
    getLineaRecepcions(),
    getLineaDespachos(),
    getRecepcions(),
    getDespachos(),
    getContratos(),
    getProductos(),
    getTipoProductos(),
    getContactos(),
    getCorteRefinacions(),
    getChequeoCantidads(),
    getChequeoCalidads(),
    getPartidas(),
    getRefinerias(),
  ]);
  const [
    tanquesDB,
    torresDestilacionsDB,
    lineaRecepcionsDB,
    lineaDespachosDB,
    recepcionsDB,
    despachosDB,
    contratosDB,
    productosDB,
    tipoProductosDB,
    contactosDB,
    corteRefinacionsDB,
    chequeoCantidadsDB,
    chequeoCalidadsDB,
    partidasDB,
    refineriasDB,
  ] = results.map((r) => (r.status === "fulfilled" ? r.value : null));

  return {
    tanques: tanquesDB?.tanques || [],
    torresDestilacions: (torresDestilacionsDB?.torres || []).map(
      (torre: TorreDestilacion) => ({
        ...torre,
        material:
          torre.material?.sort(
            (a, b) =>
              parseInt(a.idProducto?.posicion?.toString() || "0", 10) -
              parseInt(b.idProducto?.posicion?.toString() || "0", 10)
          ) || [],
      })
    ),
    lineaRecepcions: lineaRecepcionsDB?.lineaCargas || [],
    lineaDespachos: lineaDespachosDB?.lineaDespachos || [],
    recepcions: recepcionsDB?.recepcions || [],
    despachos: despachosDB?.despachos || [],
    contratos: contratosDB?.contratos || [],
    productos: productosDB?.productos || [],
    tipoProductos: tipoProductosDB?.tipoProductos || [],
    contactos: contactosDB?.contactos || [],
    corteRefinacions: corteRefinacionsDB?.corteRefinacions || [],
    chequeoCantidads: chequeoCantidadsDB?.chequeoCantidads || [],
    chequeoCalidads: chequeoCalidadsDB?.chequeoCalidads || [],
    partidas: partidasDB?.partidas || [],
    refinerias: refineriasDB?.refinerias || [],
  };
};

export const useRefineryDataFull = (recepcionModificado?: Recepcion) => {
  const { data, error, isLoading, mutate } = useSWR<RefineryData>(
    "refinery-data-global",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Actualizar recepciones localmente
  const updateRecepciones = useCallback(
    (newRecepcion: Recepcion) => {
      if (!data) return;
      const index = data.recepcions.findIndex(
        (r: Recepcion) => r.id === newRecepcion.id
      );
      let updatedRecepcions;
      if (index !== -1) {
        updatedRecepcions = [...data.recepcions];
        updatedRecepcions[index] = newRecepcion;
      } else {
        updatedRecepcions = [...data.recepcions, newRecepcion];
      }
      mutate({ ...data, recepcions: updatedRecepcions }, false);
    },
    [data, mutate]
  );

  // Efecto para actualizar recepciones si cambia recepcionModificado
  useEffect(() => {
    if (recepcionModificado && data) {
      updateRecepciones(recepcionModificado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recepcionModificado]);

  return {
    ...(data || {}),
    loading: isLoading,
    error,
    updateRecepciones,
  };
};
