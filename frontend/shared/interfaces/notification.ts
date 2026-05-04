export interface Notification {
  id?: string;
  _id?: string;
  userId: { id: string; nombre: string; correo: string } | string;
  empresaId?: string;
  module?: string;
  channel?: string;
  title: string;
  message: string;
  type: "in-app" | "email" | "sms" | "info" | "warning" | "error" | "success" | string;
  entityType?: string;
  entityId?: string;
  eventCode?: string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt?: string;
}
