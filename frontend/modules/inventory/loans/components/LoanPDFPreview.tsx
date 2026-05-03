import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import LoanTemplate from "../templates/LoanTemplate";
import type { Loan } from "../services/loanService";

const LoanPDFPreview = ({ data }: { data: Loan }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <LoanTemplate data={data} />
  </PDFViewer>
);
export default LoanPDFPreview;
