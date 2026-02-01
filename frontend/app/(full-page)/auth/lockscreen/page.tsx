"use client";
import React from "react";
import { useContext } from "react";
import { Button } from "primereact/button";
import { Page } from "../../../../types/layout";
import { classNames } from "primereact/utils";
import { InputText } from "primereact/inputtext";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import { useRouter } from "next/navigation";

const Lockscreen: Page = () => {
  const router = useRouter();
  const navigateToDashboard = () => {
    router.push("/");
  };
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";
  return (
    <div
      className={classNames(
        "surface-ground h-screen w-screen flex align-items-center justify-content-center",
        { "p-input-filled": filledInput }
      )}
    >
      <div
        className="surface-card py-7 px-5 sm:px-7 shadow-2 flex flex-column w-11 sm:w-30rem"
        style={{ borderRadius: "14px" }}
      >
        <h1 className="font-bold text-2xl mt-0 mb-2">AutoSys</h1>
        <p className="text-color-secondary mb-4">Welcome back!</p>

        <div className="flex align-items-center justify-content-between mb-4">
          <div className="flex">
            <img
              src="/layout/images/avatar.png"
              className="mr-3"
              style={{ width: "52px", height: "52px" }}
              alt="avatar"
            />
            <div className="flex flex-column justify-content-center gap-1">
              <span className="font-bold text-color">Wade Warren</span>
              <span className="text-color-secondary">Designer</span>
            </div>
          </div>
          <Button
            icon="pi pi-sign-out"
            label="Log out"
            className="p-button-text"
            iconPos="right"
          ></Button>
        </div>

        <span className="p-input-icon-left mb-4">
          <i className="pi pi-key"></i>
          <InputText
            type="password"
            placeholder="Password"
            className="w-full"
          />
        </span>

        <Button label="Unlock" onClick={navigateToDashboard}></Button>
      </div>
    </div>
  );
};

export default Lockscreen;
