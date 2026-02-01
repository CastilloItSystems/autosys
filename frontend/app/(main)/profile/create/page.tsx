"use client";
import { Page } from "../../../../types/layout";
import UsuarioForm from "@/components/usuarioComponents/UsuarioForm";

const Login: Page = () => {
  return (
    <UsuarioForm
      usuario={null} // Provide appropriate usuario object
      hideUsuarioFormDialog={() => {}} // Provide appropriate function
      usuarios={[]} // Provide appropriate usuarios array
      setUsuarios={() => {}} // Provide appropriate function
    />
  );
};

export default Login;
