// import React, { useState } from "react";
// import { Chart } from "primereact/chart";
// import { Dropdown } from "primereact/dropdown";
// import { Card } from "primereact/card";

// const RecepcionDashboard = ({ recepcions }) => {
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

//   // Procesar datos para agrupar por mes
//   const processMonthlyData = () => {
//     const months = Array.from({ length: 12 }, (_, i) => ({
//       name: new Date(2025, i).toLocaleString("default", { month: "long" }),
//       cantidadEnviada: 0,
//       cantidadRecibida: 0,
//       recepcionesCount: 0,
//     }));

//     recepcions.forEach((recepcion) => {
//       const month = new Date(recepcion.createdAt).getMonth();
//       months[month].cantidadEnviada += recepcion.cantidadEnviada;
//       months[month].cantidadRecibida += recepcion.cantidadRecibida;
//       months[month].recepcionesCount++;
//     });

//     return months;
//   };

//   const monthlyData = processMonthlyData();
//   const currentMonthData = monthlyData[selectedMonth];

//   // Configuración del gráfico
//   const chartData = {
//     labels: monthlyData.map((m) => m.name),
//     datasets: [
//       {
//         label: "Cantidad Enviada",
//         backgroundColor: "#42A5F5",
//         data: monthlyData.map((m) => m.cantidadEnviada),
//       },
//       {
//         label: "Cantidad Recibida",
//         backgroundColor: "#66BB6A",
//         data: monthlyData.map((m) => m.cantidadRecibida),
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   };

//   // Opciones para el dropdown de meses
//   const monthOptions = monthlyData.map((month, index) => ({
//     label: month.name,
//     value: index,
//   }));

//   return (
//     <div className="p-fluid">
//       <div className="p-grid p-mt-4">
//         <div className="p-col-12">
//           <div className="p-card">
//             <div className="p-card-body">
//               <div className="p-d-flex p-jc-between p-ai-center p-mb-4">
//                 <h2>Estadísticas Anuales</h2>
//                 <Dropdown
//                   value={selectedMonth}
//                   options={monthOptions}
//                   onChange={(e) => setSelectedMonth(e.value)}
//                   placeholder="Seleccionar Mes"
//                 />
//               </div>
//               <div style={{ height: "400px" }}>
//                 <Chart type="bar" data={chartData} options={options} />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="p-col-12 p-mt-4">
//           <div className="p-grid">
//             <div className="p-col-12 p-md-4">
//               <Card title="Cantidad Total Enviada" className="p-card-shadow">
//                 <h2 className="p-text-bold">
//                   {currentMonthData.cantidadEnviada} Barriles
//                 </h2>
//               </Card>
//             </div>

//             <div className="p-col-12 p-md-4">
//               <Card title="Cantidad Total Recibida" className="p-card-shadow">
//                 <h2 className="p-text-bold">
//                   {currentMonthData.cantidadRecibida} Barriles
//                 </h2>
//               </Card>
//             </div>

//             <div className="p-col-12 p-md-4">
//               <Card title="Recepciones Registradas" className="p-card-shadow">
//                 <h2 className="p-text-bold">
//                   {currentMonthData.recepcionesCount}
//                 </h2>
//               </Card>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RecepcionDashboard;
