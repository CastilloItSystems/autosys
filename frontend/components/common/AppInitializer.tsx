"use client";
import { useEffect } from "react";
import FCMSetup from "./FCMSetup";

export default function AppInitializer() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          // console.log("SW registrado:", registration);
        });
    }
  }, []);

  return <FCMSetup />;
}
