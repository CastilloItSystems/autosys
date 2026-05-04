import React from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ExpenseTemplate from "../templates/ExpenseTemplate";
import type { Expense } from "../interfaces/expense";

const ExpensePDFPreview = ({ data }: { data: Expense }) => (
  <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ExpenseTemplate data={data} />
  </PDFViewer>
);
export default ExpensePDFPreview;
