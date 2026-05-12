import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import ExpenseTemplate from "../templates/ExpenseTemplate";
import type { Expense } from "../interfaces/expense";

const ExpensePDFPreview = ({ data }: { data: Expense }) => (
  <CompanyPDFViewer>
    {(company) => <ExpenseTemplate data={data} company={company} />}
  </CompanyPDFViewer>
);
export default ExpensePDFPreview;
