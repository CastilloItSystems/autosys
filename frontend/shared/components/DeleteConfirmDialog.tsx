import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

interface DeleteConfirmDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  itemName: string | React.ReactNode;
  isDeleting?: boolean;
}

const DeleteConfirmDialog = ({
  visible,
  onHide,
  onConfirm,
  itemName,
  isDeleting = false,
}: DeleteConfirmDialogProps) => {
  const footer = (
    <div className="flex justify-content-end gap-2 ">
      <Button
        label="No"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
        disabled={isDeleting}
        className="flex-1"
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={onConfirm}
        loading={isDeleting}
        className="flex-1"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "450px" }}
      header="Confirmar"
      modal
      footer={footer}
      onHide={onHide}
    >
      <div className="flex align-items-center justify-content-center">
        <i
          className="pi pi-exclamation-triangle mr-3 text-red-500"
          style={{ fontSize: "2rem" }}
        />
        <span>
          ¿Estás seguro de que deseas eliminar <b>{itemName}</b>?
        </span>
      </div>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
