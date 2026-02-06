import { Usuario } from "./authInterface";

export interface Empresa {
  id_empresa: string;
  nombre: string;
  direccion?: string;
  telefonos?: string;
  fax?: string;
  numerorif?: string;
  numeronit?: string;
  website?: string;
  email?: string;
  contacto?: string;
  predeter: boolean;
  soporte1?: string;
  soporte2?: string;
  soporte3?: string;
  data_usaweb: boolean;
  data_servidor?: string;
  data_usuario?: string;
  data_password?: string;
  data_port?: string;
  licencia?: string;
  historizada: boolean;
  masinfo?: string;
  usa_prefijo: boolean;
  name_prefijo?: string;
  dprefijobd?: string;
  dprefijosrv?: string;
  dprefijousr?: string;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  users?: Usuario[];
}

export interface EmpresaCreate {
  nombre: string;
  direccion?: string;
  telefonos?: string;
  fax?: string;
  numerorif?: string;
  numeronit?: string;
  website?: string;
  email?: string;
  contacto?: string;
  predeter?: boolean;
  soporte1?: string;
  soporte2?: string;
  soporte3?: string;
  data_usaweb?: boolean;
  data_servidor?: string;
  data_usuario?: string;
  data_password?: string;
  data_port?: string;
  licencia?: string;
  historizada?: boolean;
  masinfo?: string;
  usa_prefijo?: boolean;
  name_prefijo?: string;
  dprefijobd?: string;
  dprefijosrv?: string;
  dprefijousr?: string;
}

export interface EmpresaUpdate extends Partial<EmpresaCreate> {}
