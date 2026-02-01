// "use client";
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useRefineriaStore } from "@/store/refineriaStore";
// import { Bunkering } from "@/libs/interfaces";
// import { getBunkerings } from "@/app/api/bunkering/bunkeringService";

// import { useSession } from "next-auth/react";
// import { ProgressSpinner } from "primereact/progressspinner";
// import { Button } from "primereact/button";
// import { motion } from "framer-motion";
// import GraficaRecepcionesPorRefineria from "./GraficaRecepcionesPorRefineria";
// import FiltrosDashboard from "./FiltrosDashboard";
// import GraficaDespachoPorRefineria from "./GraficaDespachoPorRefineria";
// import { useRefineryDataFull } from "@/hooks/useRefineryDataFull";
// import useSWR from "swr";

// const DashboardRefinerias = () => {
//   const { data: session, status } = useSession();
//   const user = session?.user;
//   const {
//     refinerias = [],
//     recepcions = [],
//     despachos = [],
//     loading,
//   } = useRefineryDataFull();
//   // Para refrescar datos globales con SWR
//   const { mutate } = useSWR("refinery-data-global");
//   const [bunkerings, setBunkerings] = useState<Bunkering[]>([]);
//   const { setActiveRefineria } = useRefineriaStore();
//   const router = useRouter();

//   // Estado global de filtros para dashboard
//   // Obtener años disponibles
//   const availableYears = React.useMemo(() => {
//     if (!recepcions.length) return [];
//     const years = Array.from(
//       new Set(
//         recepcions.map((r) => new Date(r.fechaInicioRecepcion).getFullYear())
//       )
//     );
//     return years.sort((a, b) => b - a);
//   }, [recepcions]);

//   // Obtener refinerías disponibles
//   const availableRefinerias = React.useMemo(() => {
//     if (!recepcions.length) return [];
//     return Array.from(new Set(recepcions.map((r) => r.idRefineria.nombre)));
//   }, [recepcions]);

//   // Estado de filtros
//   const [selectedYear, setSelectedYear] = useState<number>(
//     availableYears[0] || new Date().getFullYear()
//   );
//   const [selectedRefinerias, setSelectedRefinerias] = useState<string[]>([]);
//   const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

//   // Filtrar recepciones según año y refinería
//   const filteredRecepcions = React.useMemo(() => {
//     return recepcions.filter((r) => {
//       const year = new Date(r.fechaInicioRecepcion).getFullYear();
//       const refName = r.idRefineria.nombre;
//       const yearMatch = year === selectedYear;
//       const refMatch =
//         selectedRefinerias.length === 0 || selectedRefinerias.includes(refName);
//       return yearMatch && refMatch;
//     });
//   }, [recepcions, selectedYear, selectedRefinerias]);

//   // Meses disponibles para el filtro actual
//   const availableMonths = React.useMemo(() => {
//     if (!filteredRecepcions.length) return [];
//     const fechas = filteredRecepcions.map(
//       (r) => new Date(r.fechaInicioRecepcion)
//     );
//     const min = fechas.reduce((a, b) => (a < b ? a : b));
//     const max = fechas.reduce((a, b) => (a > b ? a : b));
//     const months: { label: string; value: Date }[] = [];
//     let current = new Date(min.getFullYear(), min.getMonth(), 1);
//     const end = new Date(max.getFullYear(), max.getMonth(), 1);
//     while (current <= end) {
//       months.push({
//         label: current.toLocaleString("es", {
//           month: "long",
//           year: "numeric",
//         }),
//         value: new Date(current),
//       });
//       current.setMonth(current.getMonth() + 1);
//     }
//     return months;
//   }, [filteredRecepcions]);

//   // Selección automática del mes más reciente
//   React.useEffect(() => {
//     if (availableMonths.length && !selectedMonth) {
//       setSelectedMonth(availableMonths[availableMonths.length - 1].value);
//     }
//     // Reset month if year or refineria changes
//     if (
//       selectedMonth &&
//       !availableMonths.find(
//         (m) => m.value.getTime() === selectedMonth.getTime()
//       )
//     ) {
//       setSelectedMonth(
//         availableMonths.length
//           ? availableMonths[availableMonths.length - 1].value
//           : null
//       );
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [availableMonths, selectedYear, selectedRefinerias]);

//   // Cargar bunkerings solo una vez
//   useEffect(() => {
//     const fetchBunkerings = async () => {
//       try {
//         const data = await getBunkerings();
//         const { bunkerings: dataBunkerings } = data;
//         if (Array.isArray(dataBunkerings)) {
//           setBunkerings(dataBunkerings);
//         } else {
//           console.error("La respuesta no es un array:", dataBunkerings);
//         }
//       } catch (error) {
//         console.error("Error al obtener los bunkerings:", error);
//       }
//     };
//     fetchBunkerings();
//   }, []);

//   // Filtrar refinerías según el acceso del usuario
//   const refineriasFilter = React.useMemo(() => {
//     if (!Array.isArray(refinerias)) return [];
//     if (user?.usuario?.acceso === "completo") {
//       return refinerias;
//     } else if (
//       user?.usuario?.acceso === "limitado" &&
//       Array.isArray(user?.usuario?.idRefineria)
//     ) {
//       return refinerias.filter((r: { id: string | undefined }) =>
//         user?.usuario?.idRefineria?.some((idObj) => idObj.id === r.id)
//       );
//     } else {
//       return [];
//     }
//   }, [user, refinerias]);

//   // Evitar problemas de hidratación: solo renderizar cuando la sesión esté lista
//   if (status === "loading" || loading) {
//     return (
//       <div
//         className="flex justify-content-center align-items-center"
//         style={{ height: "300px" }}
//       >
//         <ProgressSpinner />
//       </div>
//     );
//   }

//   const handleDivClick = (refineria: any) => {
//     setActiveRefineria(refineria);
//     router.push("/refineria");
//   };
//   const handleDivClickBunkering = (refineria: any) => {
//     setActiveRefineria(refineria);
//     router.push("/bunkering");
//   };

//   // show spinner while loading
//   if (loading) {
//     return (
//       <div
//         className="flex justify-content-center align-items-center"
//         style={{ height: "300px" }}
//       >
//         <ProgressSpinner />
//       </div>
//     );
//   }

//   // empty state if no refinerías
//   if (!loading && refinerias.length === 0) {
//     return (
//       <div
//         className="flex flex-column align-items-center justify-content-center"
//         style={{ height: "300px" }}
//       >
//         <img
//           src="/layout/images/pages/auth/access-denied.svg"
//           alt="Sin datos"
//           width={120}
//         />
//         <h3 className="mt-3">No tienes refinerías</h3>
//         <p className="text-500">
//           Contacta al administrador para solicitar acceso.
//         </p>
//         <Button
//           label="Recargar"
//           icon="pi pi-refresh"
//           onClick={() => mutate()}
//           className="mt-2"
//         />
//       </div>
//     );
//   }
//   return (
//     <>
//       <div className="grid">
//         {Array.isArray(refineriasFilter) &&
//           refineriasFilter.length > 0 &&
//           refineriasFilter.map((refineria, idx) => (
//             <motion.div
//               key={refineria.id}
//               className="col-12 md:col-6 lg:col-4 xl:col-3 p-2 clickable"
//               onClick={() => handleDivClick(refineria)}
//               initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
//               animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
//               transition={{
//                 duration: 0.6,
//                 delay: idx * 0.08,
//                 ease: [0.22, 1, 0.36, 1],
//               }}
//               whileHover={{
//                 scale: 1.03,
//                 // boxShadow: "0 8px 32px 0 rgba(0,0,0,0.12)",
//               }}
//               whileTap={{ scale: 0.98 }}
//               style={{ cursor: "pointer" }}
//             >
//               <div className="card h-full flex flex-column surface-card hover:surface-hover transition-colors transition-duration-300">
//                 <div className="flex flex-column md:flex-row align-items-center ">
//                   <img
//                     src={refineria.img}
//                     alt={refineria.nombre}
//                     width={100}
//                     height={100}
//                     className="rounded-lg shadow-4 object-cover mb-3 md:mb-0 md:mr-3 card p-0"
//                     style={{ background: "#f4f6fa" }}
//                   />
//                   <div className="ml-3">
//                     <span className="text-primary block white-space-nowrap text-xs font-medium opacity-80">
//                       {refineria.ubicacion}
//                     </span>
//                     <span className="text-primary block text-2xl md:text-3xl font-bold mb-1">
//                       {refineria.nombre}
//                     </span>
//                     <span className="text-primary block white-space-nowrap text-xs opacity-70">
//                       {refineria.nit}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         {Array.isArray(bunkerings) &&
//           bunkerings.length > 0 &&
//           bunkerings.map((bunkering) => (
//             <div
//               className="col-12 md:col-6 lg:col-4 xl:col-3 p-2 clickable"
//               key={bunkering.id}
//               onClick={() => handleDivClickBunkering(bunkering)}
//             >
//               <div className="card h-full flex flex-column surface-card hover:surface-hover transition-colors transition-duration-300">
//                 <div className="flex flex-column md:flex-row align-items-center p-3">
//                   <img
//                     src={bunkering.img}
//                     alt={bunkering.nombre}
//                     width={100}
//                     height={100}
//                     // className="w-40 h-40 object-cover rounded-lg"
//                     // className="w-10rem h-10rem object-cover mb-3 md:mb-0 md:mr-3 shadow-4"
//                   />
//                   <div className="ml-3">
//                     <span className="text-primary block white-space-nowrap">
//                       {bunkering.ubicacion}
//                     </span>
//                     <span className="text-primary block text-4xl font-bold">
//                       {bunkering.nombre}
//                     </span>
//                     <span className="text-primary block white-space-nowrap">
//                       {bunkering.nit}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         {/* <div className="col-12">
//         {CardRecepcionesPorRefineria ? (
//           <CardRecepcionesPorRefineria recepcions={recepcions} />
//           ) : (
//             <p>Error loading chart component</p>
//             )}{" "}
//             </div>
//             <div className="col-12">
//             {CardDespachoPorRefineria ? (
//               <CardDespachoPorRefineria despachos={despachos} />
//               ) : (
//                 <p>Error loading chart component</p>
//                 )}{" "}
//                 </div> */}
//       </div>
//       <hr
//         style={{
//           border: "none",
//           borderTop: "2px solid #e0e4ea",
//           margin: "2rem 0",
//           width: "100%",
//           opacity: 0.7,
//           borderRadius: "2px",
//         }}
//       />
//       {/* Filtros globales dashboard */}
//       <div className="">
//         <FiltrosDashboard
//           selectedYear={selectedYear}
//           setSelectedYear={setSelectedYear}
//           availableYears={availableYears}
//           selectedRefinerias={selectedRefinerias}
//           setSelectedRefinerias={setSelectedRefinerias}
//           availableRefinerias={availableRefinerias}
//           selectedMonth={selectedMonth}
//           setSelectedMonth={setSelectedMonth}
//           availableMonths={availableMonths}
//         />
//       </div>
//       <div className="grid mt-1">
//         <div className="col-12 md:col-6 ">
//           {GraficaRecepcionesPorRefineria ? (
//             <GraficaRecepcionesPorRefineria
//               recepcions={recepcions}
//               selectedYear={selectedYear}
//               selectedRefinerias={selectedRefinerias}
//               selectedMonth={selectedMonth}
//               availableYears={availableYears}
//               availableRefinerias={availableRefinerias}
//               availableMonths={availableMonths}
//             />
//           ) : (
//             <p>Error loading chart component</p>
//           )}
//         </div>
//         <div className="col-12 md:col-6 ">
//           {GraficaDespachoPorRefineria ? (
//             <GraficaDespachoPorRefineria despachos={despachos} />
//           ) : (
//             <p>Error loading chart component</p>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default DashboardRefinerias;
