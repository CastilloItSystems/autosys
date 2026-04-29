import { Usuario } from "./authInterface";

export interface Empresa {
  id: string;
  name: string;
  address?: string | null;
  phones?: string | null;
  fax?: string | null;
  rif?: string | null;
  nit?: string | null;
  website?: string | null;
  email?: string | null;
  contact?: string | null;
  isDefault: boolean;
  support1?: string | null;
  support2?: string | null;
  support3?: string | null;
  usesWeb: boolean;
  dbServer?: string | null;
  dbUser?: string | null;
  dbPassword?: string | null;
  dbPort?: string | null;
  license?: string | null;
  archived: boolean;
  additionalInfo?: string | null;
  usesPrefix: boolean;
  prefixName?: string | null;
  dbPrefix?: string | null;
  serverPrefix?: string | null;
  userPrefix?: string | null;
  logoUrl?: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  users?: Usuario[];
}

export interface EmpresaCreate {
  name: string;
  address?: string;
  phones?: string;
  fax?: string;
  rif?: string;
  nit?: string;
  website?: string;
  email?: string;
  contact?: string;
  isDefault?: boolean;
  support1?: string;
  support2?: string;
  support3?: string;
  usesWeb?: boolean;
  dbServer?: string;
  dbUser?: string;
  dbPassword?: string;
  dbPort?: string;
  license?: string;
  archived?: boolean;
  additionalInfo?: string;
  usesPrefix?: boolean;
  prefixName?: string;
  dbPrefix?: string;
  serverPrefix?: string;
  userPrefix?: string;
  logoUrl?: string;
}

export interface EmpresaUpdate extends Partial<EmpresaCreate> {}
