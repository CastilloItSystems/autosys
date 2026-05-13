"use client";
import UsuarioList from "@/modules/users/components/UsuarioList";
import { Page } from "@/types";

const UsersListPage: Page = () => {
  return <UsuarioList scope="global" />;
};

export default UsersListPage;
