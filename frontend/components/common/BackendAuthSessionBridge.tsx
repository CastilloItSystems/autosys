"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  clearBackendAuthSessionState,
  registerBackendSessionUpdater,
  setCachedBackendAuthSession,
} from "@/lib/backendAuthSession";

export default function BackendAuthSessionBridge() {
  const { data: session, status, update } = useSession();

  useEffect(() => registerBackendSessionUpdater(update), [update]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      setCachedBackendAuthSession(session);
      return;
    }

    clearBackendAuthSessionState();
  }, [session, status]);

  return null;
}
