import React from "react";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";

interface FiltrosDashboardProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  selectedRefinerias: string[];
  setSelectedRefinerias: (refinerias: string[]) => void;
  availableRefinerias: string[];
  selectedMonth: Date | null;
  setSelectedMonth: (month: Date | null) => void;
  availableMonths: { label: string; value: Date }[];
}

const FiltrosDashboard: React.FC<FiltrosDashboardProps> = ({
  selectedYear,
  setSelectedYear,
  availableYears,
  selectedRefinerias,
  setSelectedRefinerias,
  availableRefinerias,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Dropdown
        value={selectedYear}
        options={availableYears.map((y) => ({ label: y, value: y }))}
        onChange={(e) => setSelectedYear(e.value)}
        placeholder="Año"
        className="w-8rem"
      />
      <MultiSelect
        value={selectedRefinerias}
        options={availableRefinerias.map((r) => ({ label: r, value: r }))}
        onChange={(e) => setSelectedRefinerias(e.value)}
        placeholder="Refinerías"
        className="w-16rem"
        optionLabel="label"
        display="chip"
        showClear
      />
      <Dropdown
        value={selectedMonth}
        options={availableMonths}
        onChange={(e) => setSelectedMonth(e.value)}
        placeholder="Mes"
        className="w-14rem"
        optionLabel="label"
      />
    </div>
  );
};

export default FiltrosDashboard;
