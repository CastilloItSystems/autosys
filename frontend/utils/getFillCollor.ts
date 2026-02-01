const materialColors: Record<string, string> = {
  nafta: "#add8e6", // Azul claro / Celeste
  "fuel oil 4 (mgo)": "#556b2f", // Verde oscuro / Verde oliva
  "fuel oil 6 (fondo)": "#654321", // Marrón oscuro / Negro
  queroseno: "#ffd700", // Amarillo / Dorado
  "petroleo crudo": "#000000", // Negro / Marrón muy oscuro
};

export const getFillColor = (material: string): string => {
  return materialColors[material.toLowerCase()] || "#cccccc";
};
