import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import DealerQuoteTemplate from "../templates/DealerQuoteTemplate";
import type { DealerQuote } from "../interfaces/dealerQuote.interface";

const DealerQuotePDFPreview = ({ data }: { data: DealerQuote }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <DealerQuoteTemplate data={data} />
  </PDFViewer>
);
export default DealerQuotePDFPreview;
