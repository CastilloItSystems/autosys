"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";

interface PDFDownloadButtonProps {
  document: React.ReactElement;
  fileName?: string;
  className?: string;
  children?: React.ReactNode;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  document,
  fileName = "documento.pdf",
  className = "",
  children,
}) => {
  return (
    <PDFDownloadLink
      document={document}
      fileName={fileName}
      className={`pdf-download-button ${className}`}
      style={{
        textDecoration: "none",
        padding: "10px 20px",
        backgroundColor: "#3182ce",
        color: "white",
        borderRadius: "5px",
        fontWeight: "bold",
        transition: "background-color 0.3s",
        display: "inline-block",
      }}
    >
      {({ loading }) => (
        <span>
          {loading ? "Generando PDF..." : children || "Descargar PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
};

export default PDFDownloadButton;
