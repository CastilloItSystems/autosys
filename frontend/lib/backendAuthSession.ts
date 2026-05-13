"use client";

import type { Session } from "next-auth";
import { getCsrfToken, getSession, signOut } from "next-auth/react";
import {
  notifySessionExpired,
  type SessionExpiredEventDetail,
} from "@/lib/sessionExpiration";
import { useEmpresasStore } from "@/store/empresasStore";

export const BACKEND_TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;

const REFRESH_LOCK_KEY = "autosys:backend-auth-refresh-lock";
const REFRESH_SIGNAL_KEY = "autosys:backend-auth-refresh-signal";
const REFRESH_CHANNEL_NAME = "autosys:backend-auth-refresh";
const REFRESH_LOCK_TTL_MS = 15 * 1000;
const REFRESH_WAIT_TIMEOUT_MS = 20 * 1000;
const REFRESH_WAIT_POLL_MS = 150;

type BackendAuthError = "MissingRefreshToken" | "RefreshAccessTokenError";

type BackendSessionUser = Session["user"] & {
  token?: string;
  backendAccessTokenExpiresAt?: string;
  backendRefreshTokenExpiresAt?: string;
  backendAuthError?: BackendAuthError;
};

export type BackendAuthSession = Session & {
  user: BackendSessionUser;
};

type BackendSessionUpdatePayload = {
  forceBackendTokenRefresh?: boolean;
};

type SessionUpdater = (
  data?: BackendSessionUpdatePayload,
) => Promise<Session | null | undefined>;

type RefreshLock = {
  owner: string;
  expiresAt: number;
};

let cachedSession: BackendAuthSession | null = null;
let sessionUpdater: SessionUpdater | null = null;
let refreshPromise: Promise<BackendAuthSession | null> | null = null;
let expirePromise: Promise<void> | null = null;

const isBrowser = () => typeof window !== "undefined";

const toBackendSession = (
  session: Session | null | undefined,
): BackendAuthSession | null => {
  if (!session?.user) return null;
  return session as BackendAuthSession;
};

export function setCachedBackendAuthSession(
  session: Session | null | undefined,
) {
  cachedSession = toBackendSession(session);
}

export function clearBackendAuthSessionState() {
  cachedSession = null;
  refreshPromise = null;
}

export function registerBackendSessionUpdater(update: SessionUpdater) {
  sessionUpdater = update;

  return () => {
    if (sessionUpdater === update) {
      sessionUpdater = null;
    }
  };
}

export function isBackendAccessTokenExpiring(
  session: BackendAuthSession | null | undefined,
  skewMs = BACKEND_TOKEN_REFRESH_SKEW_MS,
) {
  const expiresAt = session?.user?.backendAccessTokenExpiresAt;
  if (!session?.user?.token || typeof expiresAt !== "string") {
    return false;
  }

  const expiresTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiresTime)) {
    return false;
  }

  return Date.now() + skewMs >= expiresTime;
}

export async function getValidBackendSession({
  forceRefresh = false,
}: {
  forceRefresh?: boolean;
} = {}) {
  const session = await getCurrentBackendSession();
  if (!session) return null;

  const shouldRefresh =
    forceRefresh ||
    Boolean(session.user.backendAuthError) ||
    isBackendAccessTokenExpiring(session);

  if (!shouldRefresh) {
    return session;
  }

  const refreshed = await refreshBackendAuthSession();
  if (
    !refreshed?.user?.token ||
    refreshed.user.backendAuthError ||
    isBackendAccessTokenExpiring(refreshed)
  ) {
    return null;
  }

  return refreshed;
}

export async function expireBackendSession(
  detail: Partial<SessionExpiredEventDetail> = {},
) {
  if (!isBrowser()) return;

  clearBackendAuthSessionState();
  useEmpresasStore.getState().clearActiveEmpresa();
  notifySessionExpired(detail);

  if (!expirePromise) {
    expirePromise = signOut({ callbackUrl: "/auth/login?expired=1" })
      .then(() => undefined)
      .catch(() => {
        window.location.assign("/auth/login?expired=1");
      })
      .finally(() => {
        expirePromise = null;
      });
  }

  return expirePromise;
}

async function getCurrentBackendSession() {
  if (!isBrowser()) return null;
  if (cachedSession) return cachedSession;

  const session = await getSession();
  setCachedBackendAuthSession(session);
  return cachedSession;
}

async function refreshBackendAuthSession() {
  if (!isBrowser()) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshWithTabLock().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function refreshWithTabLock() {
  const owner = createLockOwner();

  if (!tryAcquireRefreshLock(owner)) {
    await waitForOtherTabRefresh();

    const session = await fetchLatestSession();
    if (
      session?.user?.token &&
      !session.user.backendAuthError &&
      !isBackendAccessTokenExpiring(session)
    ) {
      return session;
    }

    if (!tryAcquireRefreshLock(owner)) {
      return session;
    }
  }

  return refreshAsLockOwner(owner);
}

async function refreshAsLockOwner(owner: string) {
  const keepAlive = window.setInterval(() => {
    extendRefreshLock(owner);
  }, Math.floor(REFRESH_LOCK_TTL_MS / 3));

  try {
    const session = await forceNextAuthBackendRefresh();
    signalRefreshComplete();
    return session;
  } finally {
    window.clearInterval(keepAlive);
    releaseRefreshLock(owner);
  }
}

async function forceNextAuthBackendRefresh() {
  let session: Session | null | undefined = null;

  if (sessionUpdater) {
    session = await sessionUpdater({ forceBackendTokenRefresh: true });
  }

  if (!session) {
    session = await postNextAuthSessionUpdate({
      forceBackendTokenRefresh: true,
    });
  }

  if (!session) {
    session = await getSession();
  }

  setCachedBackendAuthSession(session);
  return cachedSession;
}

async function fetchLatestSession() {
  const session = await getSession();
  setCachedBackendAuthSession(session);
  return cachedSession;
}

async function postNextAuthSessionUpdate(payload: BackendSessionUpdatePayload) {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return null;

  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      csrfToken,
      data: payload,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return Object.keys(data).length > 0 ? (data as Session) : null;
}

function createLockOwner() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readRefreshLock(): RefreshLock | null {
  try {
    const raw = window.localStorage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RefreshLock>;
    if (
      typeof parsed.owner !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return parsed as RefreshLock;
  } catch {
    return null;
  }
}

function tryAcquireRefreshLock(owner: string) {
  const existing = readRefreshLock();
  if (existing && existing.expiresAt > Date.now() && existing.owner !== owner) {
    return false;
  }

  if (!writeRefreshLock(owner)) {
    return true;
  }

  return readRefreshLock()?.owner === owner;
}

function writeRefreshLock(owner: string) {
  try {
    window.localStorage.setItem(
      REFRESH_LOCK_KEY,
      JSON.stringify({
        owner,
        expiresAt: Date.now() + REFRESH_LOCK_TTL_MS,
      } satisfies RefreshLock),
    );
    return true;
  } catch {
    // If storage is unavailable, same-tab single-flight still protects requests.
    return false;
  }
}

function extendRefreshLock(owner: string) {
  if (readRefreshLock()?.owner === owner) {
    writeRefreshLock(owner);
  }
}

function releaseRefreshLock(owner: string) {
  try {
    if (readRefreshLock()?.owner === owner) {
      window.localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  } catch {
    // Ignore storage errors; refresh result is already available in cookies.
  }

  signalRefreshComplete();
}

function signalRefreshComplete() {
  const message = JSON.stringify({
    at: Date.now(),
  });

  try {
    window.localStorage.setItem(REFRESH_SIGNAL_KEY, message);
  } catch {
    // Storage events are a best-effort cross-tab hint.
  }

  if ("BroadcastChannel" in window) {
    try {
      const channel = new window.BroadcastChannel(REFRESH_CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    } catch {
      // BroadcastChannel is optional; localStorage polling remains enough.
    }
  }
}

function waitForOtherTabRefresh() {
  return new Promise<void>((resolve) => {
    let finished = false;
    let channel: BroadcastChannel | null = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
      channel?.close();
      resolve();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === REFRESH_SIGNAL_KEY ||
        (event.key === REFRESH_LOCK_KEY && !event.newValue)
      ) {
        finish();
      }
    };

    const timeoutId = window.setTimeout(finish, REFRESH_WAIT_TIMEOUT_MS);
    const intervalId = window.setInterval(() => {
      const lock = readRefreshLock();
      if (!lock || lock.expiresAt <= Date.now()) {
        finish();
      }
    }, REFRESH_WAIT_POLL_MS);

    window.addEventListener("storage", handleStorage);

    if ("BroadcastChannel" in window) {
      try {
        channel = new window.BroadcastChannel(REFRESH_CHANNEL_NAME);
        channel.onmessage = finish;
      } catch {
        channel = null;
      }
    }
  });
}
