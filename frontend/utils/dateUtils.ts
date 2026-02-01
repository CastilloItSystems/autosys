import { format } from "date-fns";

export const formatDateFH = (dateString: Date | string) => {
  if (!dateString) {
    return ""; // O puedes devolver un valor predeterminado como "Fecha no disponible"
  }
  return format(new Date(dateString), "dd/MM/yyyy HH:mm");
};
export const formatDateFHSinHora = (dateString: Date | string) => {
  if (!dateString) {
    return ""; // O puedes devolver un valor predeterminado como "Fecha no disponible"
  }
  return format(new Date(dateString), "dd/MM/yyyy");
};
export const formatDateSinAnoFH = (dateString: Date | string) => {
  if (!dateString) {
    return ""; // O puedes devolver un valor predeterminado como "Fecha no disponible"
  }
  return format(new Date(dateString), "dd/MM HH:mm");
};
export const formatDuration = (
  startDate: Date | string,
  endDate: Date | string
) => {
  if (!startDate || !endDate) {
    return "Duración no disponible";
  }
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const milliseconds = end - start;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  return `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
};
export const timeAgo = (dateString: Date | string) => {
  if (!dateString) {
    return "Fecha no disponible";
  }

  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const milliseconds = now - past;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `hace ${seconds} segundos`;
  } else if (minutes < 60) {
    return `hace ${minutes} minutos`;
  } else if (hours < 24) {
    return `hace ${hours} horas`;
  } else {
    return `hace ${days} días`;
  }
};
