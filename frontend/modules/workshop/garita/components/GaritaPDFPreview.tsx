import React from "react";
import CompanyPDFViewer from "@/components/pdf/CompanyPDFViewer";
import GaritaEventTemplate from "@/components/pdf/templates/GaritaEventTemplate";
import type { GaritaEvent } from '@/modules/workshop/garita/interfaces/garita.interface';;

interface Props {
  event: GaritaEvent & { empresaName?: string };
}

const GaritaPDFPreview: React.FC<Props> = ({ event }) => {
  return (
    <CompanyPDFViewer>
      {(company) => <GaritaEventTemplate data={event} company={company} />}
    </CompanyPDFViewer>
  );
};

export default GaritaPDFPreview;
