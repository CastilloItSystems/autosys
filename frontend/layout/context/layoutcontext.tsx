"use client";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import type {
  ChildContainerProps,
  LayoutContextProps,
  LayoutConfig,
  LayoutState,
  Breadcrumb,
} from "@/types";

const defaultConfig: LayoutConfig = {
  ripple: true,
  inputStyle: "filled",
  menuMode: "static",
  colorScheme: "light",
  componentTheme: "blue",
  scale: 14,
  theme: "blue",
  menuTheme: "light",
  layoutTheme: "primaryColor",
  topBarTheme: "primaryColor",
};

export const LayoutContext = React.createContext({} as LayoutContextProps);

export const LayoutProvider = (props: ChildContainerProps) => {
  const [tabs, setTabs] = useState<any>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  //   const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
  //     ripple: true,
  //     inputStyle: "filled",
  //     menuMode: "overlay",
  //     colorScheme: "light",
  //     componentTheme: "blue",
  //     scale: 14,
  //     theme: "blue",
  //     menuTheme: "light",
  //     layoutTheme: "primaryColor",
  //     topBarTheme: "primaryColor",
  //   });

  // SSR safe: inicia con defaults, se sincroniza en cliente
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(defaultConfig);

  // Contador de renders para saber cuándo es seguro guardar
  const renderCount = useRef(0);

  // Guardar config en cookie (max-age 1 año) + localStorage
  const persistConfig = (config: LayoutConfig) => {
    const json = JSON.stringify(config);
    localStorage.setItem("layoutConfig", json);
    document.cookie = `layoutConfig=${encodeURIComponent(json)};path=/;max-age=31536000;SameSite=Lax`;
  };

  // Cargar desde localStorage al montar + sincronizar CSS del tema
  useEffect(() => {
    const saved = localStorage.getItem("layoutConfig");
    if (saved) {
      try {
        const parsed = { ...defaultConfig, ...JSON.parse(saved) };
        setLayoutConfig(parsed);

        // Sincronizar CSS si el servidor no tenía cookie (primera vez)
        const link = document.getElementById("theme-link") as HTMLLinkElement | null;
        if (link) {
          const expectedHref = `/theme/theme-${parsed.colorScheme}/${parsed.componentTheme}/theme.css`;
          if (!link.href.endsWith(expectedHref)) {
            link.href = expectedHref;
          }
        }
        document.documentElement.style.fontSize = parsed.scale + "px";

        // Asegurar que la cookie existe (migración de localStorage → cookie)
        persistConfig(parsed);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Guardar cambios del usuario: skip primeros 2 renders (mount + restauración)
  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current <= 2) return;
    persistConfig(layoutConfig);
  }, [layoutConfig]);

  const [layoutState, setLayoutState] = useState<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    configSidebarVisible: false,
    profileSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    rightMenuActive: false,
    topbarMenuActive: false,
    sidebarActive: false,
    anchored: false,
    overlaySubmenuActive: false,
    menuProfileActive: false,
    resetMenu: false,
  });

  const onMenuProfileToggle = () => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      menuProfileActive: !prevLayoutState.menuProfileActive,
    }));
  };

  const isSidebarActive = () =>
    layoutState.overlayMenuActive ||
    layoutState.staticMenuMobileActive ||
    layoutState.overlaySubmenuActive;

  const onMenuToggle = () => {
    if (isOverlay()) {
      setLayoutState((prevLayoutState) => ({
        ...prevLayoutState,
        overlayMenuActive: !prevLayoutState.overlayMenuActive,
      }));
    }

    if (isDesktop()) {
      setLayoutState((prevLayoutState) => ({
        ...prevLayoutState,
        staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive,
      }));
    } else {
      setLayoutState((prevLayoutState) => ({
        ...prevLayoutState,
        staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive,
      }));
    }
  };

  const isOverlay = () => {
    return layoutConfig.menuMode === "overlay";
  };

  const isSlim = () => {
    return layoutConfig.menuMode === "slim";
  };

  const isSlimPlus = () => {
    return layoutConfig.menuMode === "slim-plus";
  };

  const isHorizontal = () => {
    return layoutConfig.menuMode === "horizontal";
  };

  const isDesktop = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth > 991;
  };
  const onTopbarMenuToggle = () => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      topbarMenuActive: !prevLayoutState.topbarMenuActive,
    }));
  };
  const showRightSidebar = () => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      rightMenuActive: true,
    }));
  };
  const openTab = (value: number) => {
    setTabs((prevTabs: number[]) => [...prevTabs, value]);
  };
  const closeTab = (index: number) => {
    const newTabs = [...tabs];
    newTabs.splice(index, 1);
    setTabs(newTabs);
  };

  const value = {
    layoutConfig,
    setLayoutConfig,
    layoutState,
    setLayoutState,
    onMenuToggle,
    isSlim,
    isSlimPlus,
    isHorizontal,
    isDesktop,
    isSidebarActive,
    breadcrumbs,
    setBreadcrumbs,
    onMenuProfileToggle,
    onTopbarMenuToggle,
    showRightSidebar,
    tabs,
    closeTab,
    openTab,
  };

  return (
    <LayoutContext.Provider value={value as any}>
      <>
        <Head>
          <title> AutoSys</title>
          <meta charSet="UTF-8" />
          <meta name="description" content="AutoSys" />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <meta property="og:type" content="website"></meta>
          <meta property="og:title" content="AutoSys "></meta>
          <meta
            property="og:url"
            content="https://www.primefaces.org/verona-react"
          ></meta>
          <meta
            property="og:description"
            content="The ultimate collection of design-agnostic, flexible and accessible React UI Components."
          />
          <meta
            property="og:image"
            content="https://www.primefaces.org/static/social/verona-react.png"
          ></meta>
          <meta property="og:ttl" content="604800"></meta>
          <link rel="icon" href={`/favicon.ico`} type="image/x-icon"></link>
        </Head>
        {props.children}
      </>
    </LayoutContext.Provider>
  );
};
