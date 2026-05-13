"use client";

import UsuarioList from "@/modules/users/components/UsuarioList";
import type { Page } from "@/types";

const EmpresaUsuariosPage: Page = () => {
  return <UsuarioList scope="company" />;
};

export default EmpresaUsuariosPage;
