// recepcionesWorker.ts
export interface Recepcion {
  fechaInicioRecepcion: string;
  cantidadEnviada: number;
  cantidadRecibida: number;
  idRefineria: { nombre: string };
}

export interface WorkerInput {
  recepcions: Recepcion[];
  selectedYear: number;
  selectedRefinerias: string[];
}

export interface DatosHistoricos {
  [refineria: string]: {
    [mes: string]: {
      enviado: number;
      recibido: number;
      recepciones: number;
    };
  };
}

const ctx: Worker = self as any;

ctx.onmessage = function (e: MessageEvent<WorkerInput>) {
  const { recepcions, selectedYear, selectedRefinerias } = e.data;
  // Filtrado principal
  let filtered = recepcions.filter((r) => {
    const year = new Date(r.fechaInicioRecepcion).getFullYear();
    return (
      year === selectedYear &&
      (selectedRefinerias.length === 0 ||
        selectedRefinerias.includes(r.idRefineria.nombre))
    );
  });
  // Procesar historico
  const datosHistoricos: DatosHistoricos = {};
  filtered.forEach((recepcion) => {
    const fecha = new Date(recepcion.fechaInicioRecepcion);
    const mes = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1
    ).toISOString();
    const refineria = recepcion.idRefineria.nombre;
    if (!datosHistoricos[refineria]) datosHistoricos[refineria] = {};
    if (!datosHistoricos[refineria][mes]) {
      datosHistoricos[refineria][mes] = {
        enviado: 0,
        recibido: 0,
        recepciones: 0,
      };
    }
    datosHistoricos[refineria][mes].enviado += recepcion.cantidadEnviada;
    datosHistoricos[refineria][mes].recibido += recepcion.cantidadRecibida;
    datosHistoricos[refineria][mes].recepciones += 1;
  });
  // Responder al hilo principal
  ctx.postMessage({ filtered, datosHistoricos });
};
