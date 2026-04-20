import { cookies } from "next/headers";

export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE = "pd_theme";

export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  const v = c.get(THEME_COOKIE)?.value;
  if (v === "light" || v === "dark") return v;
  return "system";
}
