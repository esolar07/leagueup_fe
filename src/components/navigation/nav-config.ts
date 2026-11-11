import { CircleUserRound, LayoutDashboard, Plus, Search, Trophy, type LucideIcon } from "lucide-react";
import { TURKEY_BOWL } from "@/config/campaigns";

export type NavVisibility = "always" | "signed-in" | "signed-out";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  visibility: NavVisibility;
}

/**
 * Only routes that exist are listed — no dead links. Discover, Leagues, Teams and
 * Schedule join here as those features ship. Resource-scoped tools (manager,
 * commissioner) will be shown per resource from backend permissions, not from a
 * global role, because the backend deliberately has no User.role.
 */
const FIND_GAMES: NavItem = { href: "/games", label: "Find Games", icon: Search, visibility: "always" };
const CAMPAIGN: NavItem = { href: TURKEY_BOWL.path, label: TURKEY_BOWL.name, icon: Trophy, visibility: "always" };
const LIST_GAME: NavItem = { href: "/list-your-game", label: "List Game", icon: Plus, visibility: "always" };
const MY_SPORTS: NavItem = { href: "/dashboard", label: "My Sports", icon: LayoutDashboard, visibility: "signed-in" };

export const PRIMARY_NAV: NavItem[] = [CAMPAIGN, FIND_GAMES, LIST_GAME, MY_SPORTS];

export const MOBILE_NAV: NavItem[] = [CAMPAIGN, FIND_GAMES, LIST_GAME, MY_SPORTS, { href: "/account", label: "Profile", icon: CircleUserRound, visibility: "signed-in" }];

/** `signedIn` is undefined while the session is still loading: show only items visible to everyone. */
export function visibleNav(items: NavItem[], signedIn: boolean | undefined): NavItem[] {
  if (signedIn === undefined) return items.filter((item) => item.visibility === "always");
  return items.filter((item) => item.visibility === "always" || item.visibility === (signedIn ? "signed-in" : "signed-out"));
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
