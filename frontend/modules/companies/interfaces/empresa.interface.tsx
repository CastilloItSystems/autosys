import { User } from "@/modules/users/interfaces/user.interface";

export interface Empresa {
  id_empresa: string;
  nombre: string;
  direccion?: string | null;
  telefonos?: string | null;
  fax?: string | null;
  numerorif?: string | null;
  numeronit?: string | null;
  website?: string | null;
  email?: string | null;
  contacto?: string | null;
  predeter: boolean;
  soporte1?: string | null;
  soporte2?: string | null;
  soporte3?: string | null;
  data_usaweb: boolean;
  data_servidor?: string | null;
  data_usuario?: string | null;
  data_password?: string | null;
  data_port?: string | null;
  licencia?: string | null;
  historizada: boolean;
  masinfo?: string | null;
  usa_prefijo: boolean;
  name_prefijo?: string | null;
  dprefijobd?: string | null;
  dprefijosrv?: string | null;
  dprefijousr?: string | null;
  logo_url?: string | null;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  users?: User[];
}

export interface AuditUser {
  id: string;
  nombre: string;
  correo: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId?: string;
  user?: AuditUser;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: unknown;
  createdAt: string;
}

export interface EmpresasResponse {
  total: number;
  empresas: Empresa[];
}

export interface AuditLogsResponse {
  total: number;
  auditLogs: AuditLog[];
}

export interface EmpresaCreate {
  nombre: string;
  direccion?: string | null;
  telefonos?: string | null;
  fax?: string | null;
  numerorif?: string | null;
  numeronit?: string | null;
  website?: string | null;
  email?: string | null;
  contacto?: string | null;
  predeter?: boolean;
  soporte1?: string | null;
  soporte2?: string | null;
  soporte3?: string | null;
  data_usaweb?: boolean;
  data_servidor?: string | null;
  data_usuario?: string | null;
  data_password?: string | null;
  data_port?: string | null;
  licencia?: string | null;
  historizada?: boolean;
  masinfo?: string | null;
  usa_prefijo?: boolean;
  name_prefijo?: string | null;
  dprefijobd?: string | null;
  dprefijosrv?: string | null;
  dprefijousr?: string | null;
  logo_url?: string | null;
}

export interface EmpresaUpdate extends Partial<EmpresaCreate> {}
