import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

interface PdfDocumentFooterProps {
  companyName?: string;
  documentNumber?: string | number | null;
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
  companyText: {
    width: "42%",
  },
  documentText: {
    width: "34%",
    textAlign: "center",
  },
  pageText: {
    width: "24%",
    textAlign: "right",
  },
});

const compactText = (value: string, maxLength: number) =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;

const PdfDocumentFooter = ({
  companyName = "AutoSys",
  documentNumber,
}: PdfDocumentFooterProps) => {
  const displayCompanyName = compactText(companyName, 64);
  const displayDocumentNumber = compactText(String(documentNumber || ""), 42);

  return (
    <View style={styles.footer} fixed>
      <Text style={[styles.footerText, styles.companyText]}>{displayCompanyName}</Text>
      <Text style={[styles.footerText, styles.documentText]}>{displayDocumentNumber}</Text>
      <Text
        style={[styles.footerText, styles.pageText]}
        render={({ pageNumber, totalPages }) =>
          `Pagina ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
};

export default PdfDocumentFooter;
