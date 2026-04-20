import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "./theme-shared";

export { THEME_COOKIE };
export type { Theme };

export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  const v = c.get(THEME_COOKIE)?.value;
  if (v === "light" || v === "dark") return v;
  return "system";
}
