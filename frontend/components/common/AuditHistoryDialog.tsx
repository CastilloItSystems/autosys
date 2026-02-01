import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Divider } from "primereact/divider";
import { formatDateFH } from "@/utils/dateUtils";
import type {
  UserReference,
  HistorialCambio,
} from "@/libs/interfaces/configRefineriaInterface";

interface AuditHistoryDialogProps {
  visible: boolean;
  onHide: () => void;
  title: React.ReactNode;
  createdBy: UserReference;
  createdAt: string;
  historial?: HistorialCambio[];
}

const AuditHistoryDialog: React.FC<AuditHistoryDialogProps> = ({
  visible,
  onHide,
  title,
  createdBy,
  createdAt,
  historial = [],
}) => (
  <Dialog
    visible={visible}
    style={{ width: "600px" }}
    header={title}
    contentClassName="p-0"
    modal
    draggable={false}
    onHide={onHide}
    footer={
      <div className="col-12 flex justify-content-end align-items-center mt-3">
        <Button
          type="button"
          label="Salir"
          className="w-auto"
          severity="danger"
          onClick={onHide}
        />
      </div>
    }
  >
    {/* Creación */}
    <div className="m-3 p-3 border-round surface-50 border-left-3 border-primary">
      <div className="text-sm text-600">CREACIÓN INICIAL</div>
      <div className="flex flex-column gap-1 mt-2">
        <span>
          <span className="font-medium">Autor:</span> {createdBy?.nombre}
        </span>
        <span>
          <span className="font-medium">Email:</span> {createdBy?.correo}
        </span>
        <span>
          <span className="font-medium">Fecha:</span> {formatDateFH(createdAt)}
        </span>
      </div>
    </div>

    {/* Historial */}
    <div className="m-3 p-3 border-round surface-50 border-left-3 border-primary">
      <Accordion multiple>
        {historial.length ? (
          historial.map((h, idx) => (
            <AccordionTab
              key={idx}
              header={
                <div className="flex align-items-center gap-3">
                  <i className="pi pi-pencil text-green-500"></i>
                  <div>
                    <div className="font-medium">{formatDateFH(h.fecha)}</div>
                    <div className="text-sm text-600">
                      {h.modificadoPor.nombre}
                    </div>
                  </div>
                </div>
              }
            >
              <div className="m-2 p-3 surface-50 border-round">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <span className="font-medium">Usuario:</span>{" "}
                    {h.modificadoPor.nombre}
                  </div>
                  <div className="col-12 md:col-6">
                    <span className="font-medium">Email:</span>{" "}
                    {h.modificadoPor.correo}
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="text-lg font-medium mb-2">Cambios:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {Object.entries(h.cambios || {}).map(([field, change], i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-3 rounded flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-800 font-medium">
                        {field}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 line-through">
                          {String(change.from)}
                        </span>
                        <i className="pi pi-arrow-right text-gray-500"></i>
                        <span className="text-green-600 font-semibold">
                          {String(change.to)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionTab>
          ))
        ) : (
          <div className="m-3 p-3 text-center text-600">
            No se encontraron modificaciones
          </div>
        )}
      </Accordion>
    </div>
  </Dialog>
);

export default AuditHistoryDialog;
