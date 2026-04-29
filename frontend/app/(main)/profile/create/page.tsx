"use client";
import { Page } from "../../../../types/layout";
import UsuarioForm from "@/modules/users/components/UsuarioForm";
import { useRef } from "react";

const Login: Page = () => {
  const toast = useRef(null);
  return (
    <div className="card">
      <UsuarioForm usuario={null} onSave={() => {}} toast={toast} />
    </div>
  );
};

export default Login;
