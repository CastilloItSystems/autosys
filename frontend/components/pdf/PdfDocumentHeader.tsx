import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfCompanyInfo } from "./pdfCompany";
import { FALLBACK_PDF_COMPANY } from "./pdfCompany";

interface PdfDocumentHeaderProps {
  company?: PdfCompanyInfo;
  title: string;
  documentNumber?: string | number | null;
  date?: string | null;
  status?: string | null;
  statusColor?: { bg: string; text: string };
  type?: string | null;
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 7,
  },
  companySide: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "64%",
    gap: 8,
  },
  logo: {
    width: 34,
    height: 34,
    objectFit: "contain",
    marginTop: 1,
  },
  companyText: {
    flex: 1,
  },
  companyName: {
    fontSize: 10,
    lineHeight: 1.1,
    fontFamily: "Roboto-Bold",
    color: "#0f172a",
  },
  documentTitle: {
    fontSize: 7.5,
    lineHeight: 1.15,
    color: "#1e3a8a",
    marginTop: 1,
    fontFamily: "Roboto-Bold",
  },
  companyMeta: {
    fontSize: 6.5,
    lineHeight: 1.15,
    color: "#64748b",
    marginTop: 1.5,
  },
  documentSide: {
    alignItems: "flex-end",
    width: "34%",
  },
  documentNumber: {
    fontSize: 11,
    lineHeight: 1.1,
    fontFamily: "Roboto-Bold",
    color: "#1e3a8a",
  },
  documentMeta: {
    fontSize: 6.5,
    lineHeight: 1.15,
    color: "#64748b",
    marginTop: 2,
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 6.5,
    fontFamily: "Roboto-Bold",
    alignSelf: "flex-end",
    marginTop: 3,
    backgroundColor: "#f1f5f9",
    color: "#334155",
  },
});

const formatDocumentNumber = (value?: string | number | null) =>
  value === undefined || value === null || value === "" ? undefined : String(value);

const compactText = (value: string | undefined, maxLength: number) => {
  const normalized = value?.replace(/\s+/g, " ").trim();

  if (!normalized || normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const PdfDocumentHeader = ({
  company,
  title,
  documentNumber,
  date,
  status,
  statusColor,
  type,
}: PdfDocumentHeaderProps) => {
  const companyInfo = company?.name ? company : FALLBACK_PDF_COMPANY;
  const companyName = compactText(companyInfo.name, 58) || FALLBACK_PDF_COMPANY.name;
  const primaryMeta = compactText([
    companyInfo.rif ? `RIF: ${companyInfo.rif}` : null,
    companyInfo.phone,
    companyInfo.email,
  ].filter(Boolean).join(" | "), 84);
  const address = compactText(companyInfo.address, 72);
  const number = formatDocumentNumber(documentNumber);

  return (
    <View style={styles.header} fixed>
      <View style={styles.companySide}>
        {companyInfo.logoDataUrl && (
          /* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image does not support alt in its TS props. */
          <Image src={companyInfo.logoDataUrl} style={styles.logo} />
        )}
        <View style={styles.companyText}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.documentTitle}>{title}</Text>
          {primaryMeta && <Text style={styles.companyMeta}>{primaryMeta}</Text>}
          {address && <Text style={styles.companyMeta}>{address}</Text>}
        </View>
      </View>

      <View style={styles.documentSide}>
        {number && <Text style={styles.documentNumber}>{number}</Text>}
        {date && <Text style={styles.documentMeta}>{date}</Text>}
        {status && (
          <Text
            style={[
              styles.badge,
              statusColor
                ? { backgroundColor: statusColor.bg, color: statusColor.text }
                : {},
            ]}
          >
            {status}
          </Text>
        )}
        {type && <Text style={styles.documentMeta}>Tipo: {type}</Text>}
      </View>
    </View>
  );
};

export default PdfDocumentHeader;
