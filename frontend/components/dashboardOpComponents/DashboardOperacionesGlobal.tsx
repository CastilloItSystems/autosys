"use client";
import React, { useEffect, useState } from "react";
import { getRefinerias } from "@/app/api/refineriaService";
import { useRouter } from "next/navigation";
import { useRefineriaStore } from "@/store/refineriaStore";

const DashboardOperacionesGlobal = () => {
  const [refinerias, setRefinerias] = useState<any[]>([]);
  // const setActiveRefineriaId = useRefineriaStore(
  //   (state) => state.setActiveRefineriaId
  // );
  const { activeRefineria, setActiveRefineria } = useRefineriaStore();
  const router = useRouter();

  useEffect(() => {
    const fetchRefinerias = async () => {
      try {
        const data = await getRefinerias();
        const { refinerias: dataRefinerias } = data;
        if (Array.isArray(dataRefinerias)) {
          setRefinerias(dataRefinerias);
        } else {
          console.error("La respuesta no es un array:", dataRefinerias);
        }
      } catch (error) {
        console.error("Error al obtener las refinerías:", error);
      }
    };

    fetchRefinerias();
  }, []);
  const handleDivClick = (refineria: any) => {
    setActiveRefineria(refineria);
    router.push("/refineria");
  };
  return (
    <div className="grid">
      {Array.isArray(refinerias) && refinerias.length > 0 ? (
        refinerias.map((refineria) => (
          <div
            className="col-12 md:col-6 lg:col-4 xl:col-3 p-2 clickable"
            key={refineria.id}
            onClick={() => handleDivClick(refineria)}
          >
            <div className="card h-full flex flex-column surface-card hover:surface-hover transition-colors transition-duration-300">
              <div className="flex flex-column md:flex-row align-items-center p-3">
                <img
                  src={refineria.img}
                  alt={refineria.nombre}
                  width={100}
                  height={100}
                  // className="w-40 h-40 object-cover rounded-lg"
                  // className="w-10rem h-10rem object-cover mb-3 md:mb-0 md:mr-3 shadow-4"
                />
                <div className="ml-3">
                  <span className="text-primary block white-space-nowrap">
                    {refineria.ubicacion}
                  </span>
                  <span className="text-primary block text-4xl font-bold">
                    {refineria.nombre}
                  </span>
                  <span className="text-primary block white-space-nowrap">
                    {refineria.nit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-12 text-center p-4">
          <p className="text-500 italic">No hay refinerías disponibles</p>
        </div>
      )}
    </div>
  );
};

export default DashboardOperacionesGlobal;
