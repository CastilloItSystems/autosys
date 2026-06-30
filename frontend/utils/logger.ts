/**
 * Logger del frontend.
 *
 * `debug`/`info` solo emiten en desarrollo; `warn`/`error` siempre.
 * Reemplaza los `console.log` de depuración dispersos por el código para que
 * no lleguen a producción. La regla de ESLint `no-console` permite únicamente
 * `console.warn`/`console.error`, por lo que el resto debe pasar por aquí.
 */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.warn("[debug]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.warn("[info]", ...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

export default logger;
