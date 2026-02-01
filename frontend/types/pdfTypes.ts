// Tipos para la factura
export interface Client {
  name: string;
  address: string;
  email: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  authorizedBy: string;
  pageNumber: number;
  totalPages: number;
}

// Tipo genérico para plantillas
export interface TemplateProps<T> {
  data: T;
}

// Tipo para el componente PDFGenerator
export interface PDFGeneratorProps<T> {
  template: React.ComponentType<TemplateProps<T>>;
  data: T;
  fileName: string;
  showPreview?: boolean;
  downloadText?: string;
}

// ... otros tipos ...

export interface IdReferencia {
  idGuia: number;
  id: string;
}

export interface Aplicar {
  tipo: string;
  idReferencia: IdReferencia;
}

export interface User {
  _id: string;
  nombre: string;
  correo: string;
  id: string;
}

export interface Refineria {
  _id: string;
  nombre: string;
  id: string;
}

export interface Producto {
  _id: string;
  nombre: string;
  id: string;
}

export interface Cambio {
  from: string;
  to: string;
}

export interface HistorialItem {
  modificadoPor: User;
  cambios: Record<string, Cambio>;
  _id: string;
  fecha: string;
}

export interface RecepcionData {
  aplicar: Aplicar;
  idRefineria: Refineria;
  idProducto: Producto;
  fechaChequeo: string;
  cantidad: number;
  estado: string;
  eliminado: boolean;
  createdBy: User;
  historial: HistorialItem[];
  createdAt: string;
  updatedAt: string;
  numeroChequeoCantidad: number;
  id: string;
}
