"use client";
import PrimeReact, { PrimeReactContext } from "primereact/api";
import { Button } from "primereact/button";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";
import { RadioButton, RadioButtonChangeEvent } from "primereact/radiobutton";
import { Sidebar } from "primereact/sidebar";
import { classNames } from "primereact/utils";
import { useContext, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";
import type { AppConfigProps, ColorScheme } from "@/types";

const AppConfig = (props: AppConfigProps) => {
  const {
    layoutConfig,
    setLayoutConfig,
    layoutState,
    setLayoutState,
    isSlim,
    isSlimPlus,
  } = useContext(LayoutContext);
  const { setRipple, changeTheme } = useContext(PrimeReactContext);
  const escalas = [12, 13, 14, 15, 16];
  const temasComponentes = [
    { name: "indigo", color: "#3F51B5" },
    { name: "blue", color: "#2196F3" },
    { name: "green", color: "#4CAF50" },
    { name: "deeppurple", color: "#673AB7" },
    { name: "orange", color: "#FF9800" },
    { name: "cyan", color: "#00BCD4" },
    { name: "yellow", color: "#FFB340" },
    { name: "pink", color: "#E91E63" },
    { name: "purple", color: "#9C27B0" },
    { name: "lime", color: "#CDDC39" },
  ];
  useEffect(() => {
    if (isSlim() || isSlimPlus()) {
      setLayoutState((prevState) => ({ ...prevState, resetMenu: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layoutConfig.menuMode,
    layoutConfig.colorScheme,
    layoutConfig.layoutTheme,
    layoutConfig.componentTheme,
  ]);

  const onConfigButtonClick = () => {
    setLayoutState((prevState) => ({
      ...prevState,
      configSidebarVisible: true,
    }));
  };

  const onConfigSidebarHide = () => {
    setLayoutState((prevState) => ({
      ...prevState,
      configSidebarVisible: false,
    }));
  };

  const changeInputStyle = (e: RadioButtonChangeEvent) => {
    setLayoutConfig((prevState) => ({ ...prevState, inputStyle: e.value }));
  };

  const changeRipple = (e: InputSwitchChangeEvent) => {
    setRipple?.(e.value as boolean);
    setLayoutConfig((prevState) => ({
      ...prevState,
      ripple: e.value as boolean,
    }));
  };

  const changeMenuMode = (e: RadioButtonChangeEvent) => {
    setLayoutConfig((prevState) => ({ ...prevState, menuMode: e.value }));
  };

  const changeColorScheme = (colorScheme: ColorScheme) => {
    changeTheme?.(layoutConfig.colorScheme, colorScheme, "theme-link", () => {
      setLayoutConfig((prevState) => ({
        ...prevState,
        colorScheme,
        menuTheme: colorScheme === "dark" ? "dark" : "light",
      }));
    });
  };

  const _changeTheme = (componentTheme: string) => {
    changeTheme?.(
      layoutConfig.componentTheme,
      componentTheme,
      "theme-link",
      () => {
        setLayoutConfig((prevState) => ({ ...prevState, componentTheme }));
      }
    );
  };
  const changeLayoutTheme = (themeLayout: string) => {
    setLayoutConfig((prevState) => ({
      ...prevState,
      layoutTheme: themeLayout,
    }));
  };

  const decrementScale = () => {
    setLayoutConfig((prevState) => ({
      ...prevState,
      scale: prevState.scale - 1,
    }));
  };

  const incrementScale = () => {
    setLayoutConfig((prevState) => ({
      ...prevState,
      scale: prevState.scale + 1,
    }));
  };

  const applyScale = () => {
    document.documentElement.style.fontSize = layoutConfig.scale + "px";
  };
  useEffect(() => {
    if (layoutConfig.colorScheme === "dark") {
      changeLayoutTheme("colorScheme");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutConfig.colorScheme]);

  useEffect(() => {
    applyScale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutConfig.scale]);

  return (
    <>
      {/* <button
        className="layout-config-button config-link"
        type="button"
        onClick={onConfigButtonClick}
      >
        <i className="pi pi-cog"></i>
      </button> */}

      <Sidebar
        visible={layoutState.configSidebarVisible}
        onHide={onConfigSidebarHide}
        position="right"
        className="layout-config-sidebar"
        style={{ width: "18rem" }}
      >
        {!props.minimal && (
          <>
            <h5>Tipo de Menú</h5>
            <div className="flex flex-wrap row-gap-3">
              <div className="flex align-items-center gap-2 w-6">
                <RadioButton
                  name="menuMode"
                  value={"static"}
                  checked={layoutConfig.menuMode === "static"}
                  onChange={(e) => changeMenuMode(e)}
                  inputId="mode1"
                ></RadioButton>
                <label htmlFor="mode1">Estático</label>
              </div>
              <div className="flex align-items-center gap-2 w-6 pl-2">
                <RadioButton
                  name="menuMode"
                  value={"overlay"}
                  checked={layoutConfig.menuMode === "overlay"}
                  onChange={(e) => changeMenuMode(e)}
                  inputId="mode2"
                ></RadioButton>
                <label htmlFor="mode2">Superpuesto</label>
              </div>
              <div className="flex align-items-center gap-2 w-6">
                <RadioButton
                  name="menuMode"
                  value={"slim"}
                  checked={layoutConfig.menuMode === "slim"}
                  onChange={(e) => changeMenuMode(e)}
                  inputId="mode3"
                ></RadioButton>
                <label htmlFor="mode3">Delgado</label>
              </div>
              <div className="flex align-items-center gap-2 w-6 pl-2">
                <RadioButton
                  name="menuMode"
                  value={"slim-plus"}
                  checked={layoutConfig.menuMode === "slim-plus"}
                  onChange={(e) => changeMenuMode(e)}
                  inputId="mode4"
                ></RadioButton>
                <label htmlFor="mode4">Delgado +</label>
              </div>
            </div>
          </>
        )}
        <hr />
        <h5>Esquema de Colores</h5>
        <div className="flex">
          <div className="field-radiobutton flex-1">
            <RadioButton
              id="light"
              name="darkMenu"
              value="light"
              checked={layoutConfig.colorScheme === "light"}
              onChange={(e) => changeColorScheme(e.value)}
            />
            <label htmlFor="light" className="ml-2">
              Claro
            </label>
          </div>
          <div className="field-radiobutton flex-1">
            <RadioButton
              id="dark"
              name="darkMenu"
              value="dark"
              checked={layoutConfig.colorScheme === "dark"}
              onChange={(e) => changeColorScheme(e.value)}
            />
            <label htmlFor="dark" className="ml-2">
              Oscuro
            </label>
          </div>
        </div>
        {!props.minimal && (
          <>
            <h5>Tema del Layout</h5>
            <div className="field-radiobutton">
              <RadioButton
                name="menuTheme"
                value="colorScheme"
                checked={layoutConfig.layoutTheme === "colorScheme"}
                onChange={(e) => changeLayoutTheme(e.value)}
                inputId="menutheme-colorscheme"
              ></RadioButton>
              <label htmlFor="menutheme-colorscheme">Esquema de Colores</label>
            </div>
            <div className="field-radiobutton">
              <RadioButton
                name="menuTheme"
                value="primaryColor"
                checked={layoutConfig.layoutTheme === "primaryColor"}
                onChange={(e) => changeLayoutTheme(e.value)}
                disabled={layoutConfig.colorScheme === "dark"}
                inputId="menutheme-colorscheme"
              ></RadioButton>
              <label htmlFor="menutheme-primarycolor">
                Color Primario (Solo Claro)
              </label>
            </div>
          </>
        )}
        <h5>Temas</h5>
        <div className="flex flex-wrap gap-3">
          {temasComponentes.map((t, i) => {
            return (
              <div key={i}>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => _changeTheme(t.name)}
                  title={t.name}
                >
                  <a
                    className="inline-flex justify-content-center align-items-center w-2rem h-2rem border-round"
                    style={{ backgroundColor: t.color }}
                  >
                    {layoutConfig.componentTheme === t.name && (
                      <span className="check flex align-items-center justify-content-center">
                        <i className="pi pi-check text-white"></i>
                      </span>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <h5>Escala</h5>
        <div className="flex align-items-center">
          <Button
            icon="pi pi-minus"
            type="button"
            onClick={decrementScale}
            className="w-2rem h-2rem mr-2"
            rounded
            text
            disabled={layoutConfig.scale === escalas[0]}
          ></Button>
          <div className="flex gap-2 align-items-center">
            {escalas.map((s, i) => {
              return (
                <i
                  key={i}
                  className={classNames("pi pi-circle-fill text-300", {
                    "text-primary-500": s === layoutConfig.scale,
                  })}
                ></i>
              );
            })}
          </div>
          <Button
            icon="pi pi-plus"
            type="button"
            onClick={incrementScale}
            className="w-2rem h-2rem ml-2"
            rounded
            text
            disabled={layoutConfig.scale === escalas[escalas.length - 1]}
          ></Button>
        </div>
        {!props.minimal && (
          <>
            <h5>Estilo de Entrada</h5>
            <div className="flex">
              <div className="field-radiobutton flex-1">
                <RadioButton
                  name="inputStyle"
                  value="outlined"
                  checked={layoutConfig.inputStyle === "outlined"}
                  onChange={(e) => changeInputStyle(e)}
                  inputId="outlined_input"
                ></RadioButton>
                <label htmlFor="outlined_input">Contorneado</label>
              </div>
              <div className="field-radiobutton flex-1">
                <RadioButton
                  name="inputStyle"
                  value="filled"
                  checked={layoutConfig.inputStyle === "filled"}
                  onChange={(e) => changeInputStyle(e)}
                  inputId="filled_input"
                ></RadioButton>
                <label htmlFor="filled_input">Relleno</label>
              </div>
            </div>
          </>
        )}

        <h5>Efecto Ripple</h5>
        <InputSwitch
          checked={layoutConfig.ripple}
          onChange={changeRipple}
        ></InputSwitch>
      </Sidebar>
    </>
  );
};

export default AppConfig;
