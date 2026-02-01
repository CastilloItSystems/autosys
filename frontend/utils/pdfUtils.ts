"use client";
import { Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Registrar fuentes con .ttf
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/Roboto-Regular.ttf",
      fontWeight: "normal",
      // format: "truetype",
    },
    {
      src: "/fonts/Roboto-Bold.ttf",
      fontWeight: "bold",
      // format: "truetype",
    },
  ],
});

// Función utilitaria para formatear fechas
export const formatDate = (
  date: Date,
  formatString: string = "dd/MM/yyyy"
): string => format(date, formatString);

// Exportar nombres de familia para uso en StyleSheet
export const registeredFonts = {
  normal: "Roboto",
  bold: "Roboto",
  italic: "Roboto",
  boldItalic: "Roboto",
};
