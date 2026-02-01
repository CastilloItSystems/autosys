// import { useCallback, useEffect, useState } from "react";
// import {
//   Muelle,
//   LineaRecepcionBK,
//   LineaDespachoBK,
//   ProductoBK,
//   ContactoBK,
//   ContratoBK,
//   TanqueBK,
//   RecepcionBK,
//   DespachoBK,
//   ChequeoCantidadBK,
// } from "@/libs/interfaces";

// import { getLineaRecepcionsBK } from "@/app/api/bunkering/lineaRecepcionBKService";
// import { getLineaDespachosBK } from "@/app/api/bunkering/lineaDespachoBKService";
// import { getRecepcionsBK } from "@/app/api/bunkering/recepcionBKService";
// import { getDespachosBK } from "@/app/api/bunkering/despachoBKService";
// import { getContratosBK } from "@/app/api/bunkering/contratoBKService";
// import { getProductosBK } from "@/app/api/bunkering/productoBKService";
// import { getTipoProductosBK } from "@/app/api/bunkering/tipoProductoBKService";
// import { getContactosBK } from "@/app/api/bunkering/contactoBKService";
// import { getChequeoCantidadsBK } from "@/app/api/bunkering/chequeoCantidadBKService";
// import { getChequeoCalidadsBK } from "@/app/api/bunkering/chequeoCalidadBKService";
// import { getMuellesBK } from "@/app/api/bunkering/muelleBKService";
// import { TipoProductoBK } from "@/libs/interfaces/tipoProductoBKInterface";
// import { getTanquesBK } from "@/app/api/bunkering/tanqueBKService";

// export const useBunkeringData = (
//   activeRefineriaId: string,
//   recepcionModificado?: RecepcionBK
// ) => {
//   const [lineaRecepcions, setLineaRecepcions] = useState<LineaRecepcionBK[]>(
//     []
//   );
//   const [lineaDespachos, setLineaDespachos] = useState<LineaDespachoBK[]>([]);
//   const [recepcions, setRecepcions] = useState<RecepcionBK[]>([]);
//   const [despachos, setDespachos] = useState<DespachoBK[]>([]);
//   const [contratos, setContratos] = useState<ContratoBK[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [productos, setProductos] = useState<ProductoBK[]>([]);
//   const [tipoProductos, setTipoProductos] = useState<TipoProductoBK[]>([]);
//   const [contactos, setContactos] = useState<ContactoBK[]>([]);
//   const [muelles, setMuelles] = useState<Muelle[]>([]); // Cambia el tipo según tu modelo de datos

//   const [chequeoCantidads, setChequeoCantidads] = useState<ChequeoCantidadBK[]>(
//     []
//   );
//   const [chequeoCalidads, setChequeoCalidads] = useState<any[]>([]);
//   const [tanques, setTanques] = useState<TanqueBK[]>([]);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const results = await Promise.allSettled([
//         getLineaRecepcionsBK(),
//         getLineaDespachosBK(),
//         getRecepcionsBK(),
//         getDespachosBK(),
//         getContratosBK(),
//         getProductosBK(),
//         getTipoProductosBK(),
//         getContactosBK(),
//         getChequeoCantidadsBK(),
//         getChequeoCalidadsBK(),
//         getMuellesBK(),
//         getTanquesBK(),
//       ]);

//       const [
//         lineaRecepcionDB,
//         lineaDespachoDB,
//         recepcionsDB,
//         despachosDB,
//         contratosDB,
//         productosDB,
//         tipoProductosDB,
//         contactosDB,
//         chequeoCantidadDB,
//         chequeoCalidadDB,
//         muelleDB,
//         tanqueDB,
//         // brent,
//       ] = results.map((result, idx) => {
//         if (result.status === "fulfilled") {
//           return result.value;
//         } else {
//           console.error(`Error in API call #${idx + 1}:`, result.reason);
//           return undefined;
//         }
//       });
//       const filteredLineaRecepcions =
//         lineaRecepcionDB?.lineaCargas?.filter(
//           (lineaRecepcion: LineaRecepcionBK) =>
//             lineaRecepcion.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredLineaDespachos =
//         lineaDespachoDB?.lineaDespachos?.filter(
//           (lineaDespacho: LineaDespachoBK) =>
//             lineaDespacho.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredRecepcions =
//         recepcionsDB?.recepcions?.filter(
//           (recepcion: RecepcionBK) =>
//             recepcion.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredDespachos =
//         despachosDB?.despachos?.filter(
//           (despacho: DespachoBK) =>
//             despacho.idBunkering?.id === activeRefineriaId
//         ) || [];

//       const filteredContratos =
//         contratosDB?.contratos?.filter(
//           (contrato: ContratoBK) =>
//             contrato.idBunkering?.id === activeRefineriaId
//         ) || [];

//       const filteredPorducto =
//         productosDB?.productos?.filter(
//           (producto: ProductoBK) =>
//             producto.idBunkering?.id === activeRefineriaId
//         ) || [];

//       const filterdTipoProductos =
//         tipoProductosDB?.tipoProductos?.filter(
//           (tipoProducto: TipoProductoBK) =>
//             tipoProducto.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredContactos =
//         contactosDB?.contactos?.filter(
//           (contacto: ContactoBK) =>
//             contacto.idBunkering?.id === activeRefineriaId
//         ) || [];

//       const filteredChequeoCantidads =
//         chequeoCantidadDB?.chequeoCantidads?.filter(
//           (chequeoCantidad: ChequeoCantidadBK) =>
//             chequeoCantidad.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredChequeoCalidads =
//         chequeoCalidadDB?.chequeoCalidads?.filter(
//           (chequeoCalidad: any) =>
//             chequeoCalidad.idBunkering?.id === activeRefineriaId
//         ) || [];
//       const filteredMuelles =
//         muelleDB?.muelles?.filter(
//           (muelle: Muelle) => muelle.idBunkering?.id === activeRefineriaId
//         ) || [];

//       const filteredTanques = tanqueDB?.tanques?.filter(
//         (tanque: TanqueBK) => tanque.idBunkering?.id === activeRefineriaId
//       );
//       // const filteredBrent =
//       setLineaRecepcions(filteredLineaRecepcions);
//       setLineaDespachos(filteredLineaDespachos);
//       setRecepcions(filteredRecepcions);
//       setDespachos(filteredDespachos);
//       setContratos(filteredContratos);
//       setProductos(filteredPorducto);
//       setTipoProductos(filterdTipoProductos);
//       setContactos(filteredContactos);
//       setChequeoCantidads(filteredChequeoCantidads);
//       setChequeoCalidads(filteredChequeoCalidads);
//       setMuelles(filteredMuelles);
//       setTanques(filteredTanques);
//     } catch (error) {
//       console.error("Error al obtener los datos:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [activeRefineriaId]);

//   useEffect(() => {
//     if (activeRefineriaId) {
//       fetchData();
//     }
//   }, [activeRefineriaId, fetchData]);

//   // Efecto para manejar recepcionModificado
//   useEffect(() => {
//     if (recepcionModificado) {
//       setRecepcions((prevRecepcions) => {
//         const index = prevRecepcions.findIndex(
//           (recepcion) => recepcion.id === recepcionModificado.id
//         );
//         if (index !== -1) {
//           // Si la recepción ya existe, actualízala
//           const updatedRecepcions = [...prevRecepcions];
//           updatedRecepcions[index] = recepcionModificado;
//           return updatedRecepcions;
//         } else {
//           // Si es una nueva recepción, agrégalo al estado
//           return [...prevRecepcions, recepcionModificado];
//         }
//       });
//     }
//   }, [recepcionModificado]);

//   return {
//     lineaRecepcions,
//     lineaDespachos,
//     recepcions,
//     despachos,
//     contratos,
//     productos,
//     tipoProductos,
//     contactos,
//     loading,
//     chequeoCantidads,
//     chequeoCalidads,
//     muelles,
//     tanques,
//   };
// };
