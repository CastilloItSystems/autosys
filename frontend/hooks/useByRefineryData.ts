import {
  getChequeoCantidads,
  obtenerChequeosCantidadPorRefineria,
} from "@/app/api/chequeoCantidadService";
import {
  getChequeoCalidads,
  obtenerChequeosCalidadPorRefineria,
} from "@/app/api/chequeoCalidadService";
import {
  getContactos,
  obtenerContactosPorRefineria,
} from "@/app/api/contactoService";
import {
  getContratos,
  obtenerContratosPorRefineria,
} from "@/app/api/contratoService";
import {
  getCorteRefinacions,
  obtenerCortesRefinacionPorRefineria,
} from "@/app/api/corteRefinacionService";
import {
  getDespachos,
  obtenerDespachosPorRefineria,
} from "@/app/api/despachoService";
import {
  getLineaDespachos,
  obtenerLineasDespachoPorRefineria,
} from "@/app/api/lineaDespachoService";
import {
  getLineaRecepcions,
  obtenerLineasRecepcionPorRefineria,
} from "@/app/api/lineaRecepcionService";
import { getOperadors } from "@/app/api/operadorService";
import {
  getProductos,
  obtenerProductosPorRefineria,
} from "@/app/api/productoService";
import {
  getRecepcions,
  obtenerRecepcionesPorRefineria,
} from "@/app/api/recepcionService";
import {
  getTanques,
  obtenerTanquesPorRefineria,
} from "@/app/api/tanqueService";
import {
  getTipoProductos,
  obtenerTiposProductoPorRefineria,
} from "@/app/api/tipoProductoService";
import { obtenerTorresPorRefineria } from "@/app/api/torreDestilacionService";
import {
  getPartidas,
  obtenerPartidasPorRefineria,
} from "@/app/api/partidaService";

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
  Factura,
  Balance,
  Cuenta,
  Abono,
} from "@/libs/interfaces";
import { obtenerFacturasPorRefineria } from "@/app/api/facturaService";
import { obtenerBalancesPorRefineria } from "@/app/api/balanceService";
import { obtenerCuentaPorRefineria } from "@/app/api/cuentaService";
import { obtenerAbonosporRefineria } from "@/app/api/abonoService";

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
  facturas: Factura[]; // Agregado para facturas
  balances: Balance[];
  cuentas: Cuenta[];
  abonos: Abono[];
}

// SWR fetcher function
const fetcher = async (refineriaId: string) => {
  const results = await Promise.allSettled([
    obtenerTanquesPorRefineria(refineriaId),
    obtenerTorresPorRefineria(refineriaId),
    obtenerLineasRecepcionPorRefineria(refineriaId),
    obtenerLineasDespachoPorRefineria(refineriaId),
    obtenerRecepcionesPorRefineria(refineriaId),
    obtenerDespachosPorRefineria(refineriaId),
    obtenerContratosPorRefineria(refineriaId),
    obtenerProductosPorRefineria(refineriaId),
    obtenerTiposProductoPorRefineria(refineriaId),
    obtenerContactosPorRefineria(refineriaId),
    obtenerCortesRefinacionPorRefineria(refineriaId),
    obtenerChequeosCantidadPorRefineria(refineriaId),
    obtenerChequeosCalidadPorRefineria(refineriaId),
    obtenerPartidasPorRefineria(refineriaId),
    obtenerFacturasPorRefineria(refineriaId),
    obtenerBalancesPorRefineria(refineriaId),
    obtenerCuentaPorRefineria(refineriaId),
    obtenerAbonosporRefineria(refineriaId),
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
    facturaDB,
    balanceDB,
    cuentasDB,
    abonosDB,
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
    facturas: facturaDB?.facturas || [],
    balances: balanceDB?.balances || [],
    cuentas: cuentasDB?.cuentas || [],
    abonos: abonosDB?.abonos || [],
  };
};

export const useByRefineryData = (
  activeRefineriaId: string,
  recepcionModificado?: Recepcion
) => {
  const { data, error, isLoading, mutate } = useSWR<RefineryData>(
    activeRefineriaId ? ["refinery-data", activeRefineriaId] : null,
    () => fetcher(activeRefineriaId),
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
