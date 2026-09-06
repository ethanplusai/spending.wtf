import { createContext, useContext } from "react";
export type Environment = { url: string; snapshots: Record<string, unknown> };
export const EnvironmentContext = createContext<Environment>({
  url: "/",
  snapshots: {},
});
export function useSnapshot<T>(name: string): T | null {
  return (useContext(EnvironmentContext).snapshots[name] as T) ?? null;
}
export function useSearch() {
  const env = useContext(EnvironmentContext);
  return new URL(
    typeof location === "undefined" ? env.url : location.href,
    "https://spending.wtf",
  ).searchParams;
}
