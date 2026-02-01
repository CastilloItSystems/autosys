import { SWRConfig } from "swr";
import { localStorageProvider } from "@/utils/swrLocalStorageProvider";

export function SWRCacheProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>{children}</SWRConfig>
  );
}
