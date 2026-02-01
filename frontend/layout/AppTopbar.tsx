import {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import { LayoutContext } from "./context/layoutcontext";
import type { AppTopbarRef } from "@/types";
import { Ripple } from "primereact/ripple";
import Link from "next/link";
import { StyleClass } from "primereact/styleclass";
import { usePathname, useRouter } from "next/navigation";
import { classNames } from "primereact/utils";
import { signOut, useSession } from "next-auth/react";
import { User } from "next-auth";
import { useSocket } from "@/hooks/useSocket";
import { useRefineriaStore } from "@/store/refineriaStore";
import AppNotificationDropdown from "./AppNotificationDropdown";
import { Dialog } from "primereact/dialog";

interface ExtendedUser extends User {
  usuario: {
    nombre: string;
    rol: string;
  };
  token: string;
  access_token?: string; // Agregado para manejar el token de Google
}

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
  const { data: session } = useSession();
  const { activeRefineria } = useRefineriaStore();

  const { online, desconectarSocket } = useSocket();

  const handleSignOut = async () => {
    // Revoca el token de Google si existe
    const accessToken = session?.user?.access_token;
    if (accessToken) {
      try {
        await fetch(
          `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`
        );
        // console.log("Token de Google revocado correctamente.");
      } catch (e) {
        console.error("Error al revocar el token de Google:", e);
      }
    }
    await signOut();
    desconectarSocket();
  };

  const { onMenuToggle, layoutConfig, tabs, closeTab, setLayoutState } =
    useContext(LayoutContext);

  const [searchActive, setSearchActive] = useState<boolean | null>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const menubuttonRef = useRef(null);

  const searchRef = useRef(null);

  const onMenuButtonClick = () => {
    onMenuToggle();
  };

  const activateSearch = () => {
    setSearchActive(true);
    setTimeout(() => {
      const element = document.querySelector(".searchInput");
      (element as HTMLElement)?.focus();
    }, 100);
  };

  useImperativeHandle(ref, () => ({
    menubutton: menubuttonRef.current,
  }));
  const logo = () => {
    const path = "/layout/images/";
    let logo;
    if (
      layoutConfig.layoutTheme === "primaryColor" &&
      layoutConfig.theme !== "yellow"
    ) {
      logo = "logo-AutoSys.ico";
    } else {
      logo =
        layoutConfig.colorScheme === "light"
          ? "logo-AutoSys.ico"
          : "logo-AutoSys.ico";
    }
    return path + logo;
  };
  useEffect(() => {
    logo();
  }, []);

  const onCloseTab = (index: number) => {
    if (tabs.length > 1) {
      if (index === tabs?.length - 1) router.push(tabs?.[tabs.length - 2].to);
      else router.push(tabs?.[index + 1].to);
    } else {
      router.push("/");
    }
    closeTab(index);
  };

  const openConfigSidebar = () => {
    setLayoutState((prev: any) => ({ ...prev, configSidebarVisible: true }));
  };
  const openLogoutConfirm = () => setLogoutVisible(true);

  return (
    <div className="layout-topbar">
      <Link href={"/"} className="app-logo">
        <img alt="app logo" src={logo()} />
        <span className="app-name">AutoSys</span>
      </Link>

      <button
        ref={menubuttonRef}
        className="topbar-menubutton p-link"
        type="button"
        onClick={onMenuButtonClick}
      >
        <span></span>
      </button>
      <ul className="topbar-menu">
        {tabs.map((item, i) => {
          return (
            <li key={i}>
              <Link
                href={item.to}
                className={classNames({ "active-route": item.to === pathname })}
              >
                <span>{item.label}</span>
              </Link>
              <i className="pi pi-times" onClick={() => onCloseTab(i)}></i>
            </li>
          );
        })}
        {!tabs ||
          (tabs.length === 0 &&
            (pathname.startsWith("/refineria") ||
              pathname.startsWith("/bunkering")) &&
            activeRefineria && (
              // <li className="topbar-menu-empty ">

              <Link href={"/refineria"} className="app-logo">
                <img alt="app logo" src={activeRefineria.img} />
                <span className="app-name">{activeRefineria.nombre}</span>
              </Link>
              // </li>
            ))}
      </ul>
      <div className="topbar-search">
        <AppNotificationDropdown session={session} />
      </div>
      <div className="topbar-profile">
        <StyleClass
          nodeRef={searchRef}
          selector="@next"
          enterClassName="hidden"
          enterActiveClassName="scalein"
          leaveToClassName="hidden"
          leaveActiveClassName="fadeout"
          hideOnOutsideClick
        >
          <button
            ref={searchRef}
            className="topbar-profile-button p-link"
            type="button"
          >
            <img
              alt="avatar"
              src={
                session?.user?.usuario?.img
                  ? session.user.usuario.img
                  : "/layout/images/avatarHombre.png"
              }
              className="p-avatar p-avatar-image p-avatar-circle topbar-profile-avatar"
              style={{ width: "3rem", height: "3rem", marginRight: "0.5rem" }}
            />

            <span className="profile-details">
              <span className="profile-name">
                {session?.user?.usuario?.nombre}
              </span>
              <span className="profile-job">
                {session?.user?.usuario?.rol.toLowerCase()}
              </span>
              <span className="profile-job">
                {online ? "Conectado" : "Desconectado"}
              </span>
            </span>
            <i className="pi pi-angle-down"></i>
          </button>
        </StyleClass>
        <ul className="list-none p-3 m-0 border-round shadow-2 hidden absolute surface-overlay origin-top w-full sm:w-12rem mt-2 right-0 top-auto">
          <li>
            <Link
              href="/profile/myProfile"
              className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer"
            >
              <i className="pi pi-user mr-3"></i>
              <span className="hidden sm:inline">Perfil</span>
              <Ripple />
            </Link>

            {/* Botón Configuración abre AppConfig Sidebar - ahora como enlace estilizado */}
            <a
              href="#"
              role="button"
              onClick={(e) => {
                e.preventDefault();
                openConfigSidebar();
              }}
              className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer no-underline"
            >
              <i className="pi pi-cog mr-3"></i>
              <span className="hidden sm:inline">Configuración</span>
              <Ripple />
            </a>
            <a
              className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer"
              onClick={openLogoutConfirm}
            >
              <i className="pi pi-power-off mr-3"></i>
              <span className="hidden sm:inline">Cerrar sesión</span>
              <Ripple />
            </a>
          </li>
        </ul>
      </div>

      <Dialog
        header="Confirmar Cierre de Sesión"
        visible={logoutVisible}
        style={{ width: "22rem" }}
        modal
        onHide={() => setLogoutVisible(false)}
        draggable={false}
        resizable={false}
        contentClassName="p-3"
      >
        <div className="flex flex-column gap-3">
          <p className="m-0 text-700">
            ¿Seguro que deseas cerrar sesión? Se cerrarán tus conexiones
            activas.
          </p>
          <div className="flex justify-content-end gap-2 mt-2">
            <button
              type="button"
              className="p-button p-component p-button-text"
              onClick={() => setLogoutVisible(false)}
            >
              <span className="p-button-label">Cancelar</span>
            </button>
            <button
              type="button"
              className="p-button p-component p-button-danger"
              onClick={handleSignOut}
            >
              <span className="p-button-icon p-button-icon-left pi pi-power-off" />
              <span className="p-button-label">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
});

AppTopbar.displayName = "AppTopbar";

export default AppTopbar;
