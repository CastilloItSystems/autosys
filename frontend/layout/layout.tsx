"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { PrimeReactContext } from "primereact/api";
import {
  useEventListener,
  useMountEffect,
  useResizeListener,
  useUnmountEffect,
} from "primereact/hooks";
import { classNames, DomHandler } from "primereact/utils";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import AppConfig from "./AppConfig";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";
import { LayoutContext } from "./context/layoutcontext";
import AppBreadcrumb from "./AppBreadCrumb";
import AppFooter from "./AppFooter";
import type { AppTopbarRef, ChildContainerProps } from "@/types";

const Layout = (props: ChildContainerProps) => {
  const {
    layoutConfig,
    layoutState,
    setLayoutState,
    setLayoutConfig,
    isSlim,
    isSlimPlus,
    isHorizontal,
    isDesktop,
    isSidebarActive,
  } = useContext(LayoutContext);
  const topbarRef = useRef<AppTopbarRef>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let timeout: NodeJS.Timeout | null = null;

  const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] =
    useEventListener({
      type: "click",
      listener: (event) => {
        const isOutsideClicked = !(
          sidebarRef.current?.isSameNode(event.target as Node) ||
          sidebarRef.current?.contains(event.target as Node) ||
          topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
          topbarRef.current?.menubutton?.contains(event.target as Node)
        );

        if (isOutsideClicked) {
          hideMenu();
        }
      },
    });

  const [bindDocumentResizeListener, unbindDocumentResizeListener] =
    useResizeListener({
      listener: () => {
        if (isDesktop() && !DomHandler.isTouchDevice()) {
          hideMenu();
        }
      },
    });

  const hideMenu = useCallback(() => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      overlayMenuActive: false,
      overlaySubmenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false,
      resetMenu: (isSlim() || isSlimPlus() || isHorizontal()) && isDesktop(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSlim, isHorizontal, isDesktop]);

  const blockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.add("blocked-scroll");
    } else {
      document.body.className += " blocked-scroll";
    }
  };

  const unblockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.remove("blocked-scroll");
    } else {
      document.body.className = document.body.className.replace(
        new RegExp(
          "(^|\\b)" + "blocked-scroll".split(" ").join("|") + "(\\b|$)",
          "gi"
        ),
        " "
      );
    }
  };

  const onMouseEnter = () => {
    if (!layoutState.anchored) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      setLayoutState((prevLayoutState) => ({
        ...prevLayoutState,
        sidebarActive: true,
      }));
    }
  };

  const onMouseLeave = () => {
    if (!layoutState.anchored) {
      if (!timeout) {
        timeout = setTimeout(
          () =>
            setLayoutState((prevLayoutState) => ({
              ...prevLayoutState,
              sidebarActive: false,
            })),
          300
        );
      }
    }
  };

  useEffect(() => {
    const onRouteChange = () => {
      if (layoutConfig.colorScheme === "dark") {
        setLayoutConfig((prevState) => ({ ...prevState, menuTheme: "dark" }));
      }
    };
    onRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isSidebarActive()) {
      bindMenuOutsideClickListener();
    }

    if (layoutState.staticMenuMobileActive) {
      blockBodyScroll();
      (isSlim() || isSlimPlus() || isHorizontal()) &&
        bindDocumentResizeListener();
    }

    return () => {
      unbindMenuOutsideClickListener();
      unbindDocumentResizeListener();
      unblockBodyScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layoutState.overlayMenuActive,
    layoutState.staticMenuMobileActive,
    layoutState.overlaySubmenuActive,
  ]);

  useEffect(() => {
    const onRouteChange = () => {
      hideMenu();
    };
    onRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useUnmountEffect(() => {
    unbindMenuOutsideClickListener();
  });

  const containerClassName = classNames({
    "layout-slim": layoutConfig.menuMode === "slim",
    "layout-slim-plus": layoutConfig.menuMode === "slim-plus",
    "layout-static": layoutConfig.menuMode === "static",
    "layout-overlay": layoutConfig.menuMode === "overlay",
    "layout-overlay-active": layoutState.overlayMenuActive,
    "layout-mobile-active": layoutState.staticMenuMobileActive,
    "layout-static-inactive":
      layoutState.staticMenuDesktopInactive &&
      layoutConfig.menuMode === "static",
    "p-input-filled": layoutConfig.inputStyle === "filled",
    "p-ripple-disabled": !layoutConfig.ripple,
    "layout-light":
      layoutConfig.layoutTheme === "colorScheme" &&
      layoutConfig.colorScheme === "light",
    "layout-dark":
      layoutConfig.layoutTheme === "colorScheme" &&
      layoutConfig.colorScheme === "dark",
    "layout-primary":
      layoutConfig.colorScheme !== "dark" &&
      layoutConfig.layoutTheme === "primaryColor",
  });

  return (
    <React.Fragment>
      <div className={classNames("layout-container", containerClassName)}>
        <AppTopbar ref={topbarRef} />
        <div
          ref={sidebarRef}
          className="layout-sidebar"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <AppSidebar />
        </div>
        <div className="layout-content-wrapper">
          <div className="layout-content">
            <div className="layout-content-inner">
              <AppBreadcrumb></AppBreadcrumb>
              {props.children}
              <AppFooter></AppFooter>
            </div>
          </div>
        </div>
        <AppConfig />
      </div>
    </React.Fragment>
  );
};

export default Layout;
