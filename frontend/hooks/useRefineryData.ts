import { useCallback, useEffect, useState } from "react";
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
  Partida,
  Factura,
} from "@/libs/interfaces";
import { getTanques } from "@/app/api/tanqueService";
import { getTorresDestilacion } from "@/app/api/torreDestilacionService";
import { getLineaRecepcions } from "@/app/api/lineaRecepcionService";
import { getRecepcions } from "@/app/api/recepcionService";
import { getContratos } from "@/app/api/contratoService";
import { getRefinacions } from "@/app/api/refinacionService";
import { getProductos } from "@/app/api/productoService";
import { getTipoProductos } from "@/app/api/tipoProductoService";
import { getContactos } from "@/app/api/contactoService";
import { getLineaDespachos } from "@/app/api/lineaDespachoService";
import { getDespachos } from "@/app/api/despachoService";
import { getOperadors } from "@/app/api/operadorService";
import { getCorteRefinacions } from "@/app/api/corteRefinacionService";
import {
  getChequeoCalidad,
  getChequeoCalidads,
} from "@/app/api/chequeoCalidadService";
import { getChequeoCantidads } from "@/app/api/chequeoCantidadService";
import { getPartidas } from "@/app/api/partidaService";
import { getFacturas } from "@/app/api/facturaService";

export const useRefineryData = (
  activeRefineriaId: string,
  recepcionModificado?: Recepcion
) => {
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [torresDestilacion, setTorresDestilacion] = useState<
    TorreDestilacion[]
  >([]);
  const [lineaRecepcions, setLineaRecepcions] = useState<LineaRecepcion[]>([]);
  const [lineaDespachos, setLineaDespachos] = useState<LineaDespacho[]>([]);
  const [recepcions, setRecepcions] = useState<Recepcion[]>([]);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tipoProductos, setTipoProductos] = useState<TipoProducto[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [brent, setBrent] = useState<any | null>(null);
  const [operadors, setOperadors] = useState<any>([]);
  const [corteRefinacions, setCorteRefinacions] = useState<CorteRefinacion[]>(
    []
  );
  const [chequeoCantidads, setChequeoCantidads] = useState<ChequeoCantidad[]>(
    []
  );
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        tanquesDB,
        torresDestilacionDB,
        lineaRecepcionDB,
        lineaDespachoDB,
        recepcionsDB,
        despachosDB,
        contratosDB,
        productosDB,
        tipoProductosDB,
        contactosDB,
        operadorDB,
        corteRefinacionDB,
        chequeoCantidadDB,
        partidaDB,
        facturaDB,

        // brent,
      ] = await Promise.all([
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
        getOperadors(),
        getCorteRefinacions(),
        getChequeoCantidads(),
        getPartidas(),
        getFacturas(),
        // getBrent(),
      ]);

      const filteredTanques =
        tanquesDB?.tanques?.filter(
          (tanque: Tanque) => tanque.idRefineria?.id === activeRefineriaId
        ) || [];
      const filteredTorresDestilacion =
        torresDestilacionDB?.torres
          ?.filter(
            (torre: TorreDestilacion) =>
              torre.idRefineria?.id === activeRefineriaId
          )
          .map((torre: TorreDestilacion) => ({
            ...torre,
            material: torre.material.sort(
              (a, b) =>
                parseInt(a.idProducto?.posicion?.toString() || "0", 10) -
                parseInt(b.idProducto?.posicion?.toString() || "0", 10)
            ),
          })) || [];
      const filteredLineaRecepcions =
        lineaRecepcionDB?.lineaCargas?.filter(
          (lineaRecepcion: LineaRecepcion) =>
            lineaRecepcion.idRefineria?.id === activeRefineriaId
        ) || [];
      const filteredLineaDespachos =
        lineaDespachoDB?.lineaDespachos?.filter(
          (lineaDespacho: LineaDespacho) =>
            lineaDespacho.idRefineria?.id === activeRefineriaId
        ) || [];
      const filteredRecepcions =
        recepcionsDB?.recepcions?.filter(
          (recepcion: Recepcion) =>
            recepcion.idRefineria?.id === activeRefineriaId
        ) || [];
      const filteredDespachos =
        despachosDB?.despachos?.filter(
          (despacho: Despacho) => despacho.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredContratos =
        contratosDB?.contratos?.filter(
          (contrato: Contrato) => contrato.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredPorducto =
        productosDB?.productos?.filter(
          (producto: Producto) => producto.idRefineria?.id === activeRefineriaId
        ) || [];

      const filterdTipoProductos =
        tipoProductosDB?.tipoProductos?.filter(
          (tipoProducto: TipoProducto) =>
            tipoProducto.idRefineria?.id === activeRefineriaId
        ) || [];
      const filteredContactos =
        contactosDB?.contactos?.filter(
          (contacto: Contacto) => contacto.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredOperador =
        operadorDB?.operadors?.filter(
          (operador: any) => operador.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredCorteRefinacion =
        corteRefinacionDB?.corteRefinacions?.filter(
          (corteRefinacion: CorteRefinacion) =>
            corteRefinacion.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredChequeoCantidads =
        chequeoCantidadDB?.chequeoCantidads?.filter(
          (chequeoCantidad: ChequeoCantidad) =>
            chequeoCantidad.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredPartidas =
        partidaDB?.partidas?.filter(
          (partida: Partida) => partida.idRefineria?.id === activeRefineriaId
        ) || [];

      const filteredFacturas =
        facturaDB?.facturas?.filter(
          (factura: Factura) => factura.idRefineria?.id === activeRefineriaId
        ) || [];

      setTanques(filteredTanques);
      setTorresDestilacion(filteredTorresDestilacion);
      setLineaRecepcions(filteredLineaRecepcions);
      setLineaDespachos(filteredLineaDespachos);
      setRecepcions(filteredRecepcions);
      setDespachos(filteredDespachos);
      setContratos(filteredContratos);
      setProductos(filteredPorducto);
      setTipoProductos(filterdTipoProductos);
      setContactos(filteredContactos);
      setOperadors(filteredOperador);
      setChequeoCantidads(filteredChequeoCantidads);
      setPartidas(filteredPartidas);
      setFacturas(filteredFacturas);

      setBrent(brent);
      setCorteRefinacions(filteredCorteRefinacion);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  }, [activeRefineriaId]);

  useEffect(() => {
    if (activeRefineriaId) {
      fetchData();
    }
  }, [activeRefineriaId, fetchData]);

  // Efecto para manejar recepcionModificado
  useEffect(() => {
    if (recepcionModificado) {
      setRecepcions((prevRecepcions) => {
        const index = prevRecepcions.findIndex(
          (recepcion) => recepcion.id === recepcionModificado.id
        );
        if (index !== -1) {
          // Si la recepción ya existe, actualízala
          const updatedRecepcions = [...prevRecepcions];
          updatedRecepcions[index] = recepcionModificado;
          return updatedRecepcions;
        } else {
          // Si es una nueva recepción, agrégalo al estado
          return [...prevRecepcions, recepcionModificado];
        }
      });
    }
  }, [recepcionModificado]);

  return {
    tanques,
    torresDestilacion,
    lineaRecepcions,
    lineaDespachos,
    recepcions,
    despachos,
    contratos,
    productos,
    tipoProductos,
    contactos,
    loading,
    operadors,
    corteRefinacions,
    chequeoCantidads,
    partidas,
    facturas,
  };
};
