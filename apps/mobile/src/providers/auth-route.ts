export type AuthRouteStatus =
  | "restoring"
  | "authenticated"
  | "unauthenticated";

export function getAuthRedirect(
  status: AuthRouteStatus,
  routeGroup: string | undefined
): "/(app)" | "/(auth)/login" | null {
  if (status === "restoring") {
    return null;
  }

  if (status === "authenticated" && routeGroup === "(auth)") {
    return "/(app)";
  }

  if (status === "unauthenticated" && routeGroup !== "(auth)") {
    return "/(auth)/login";
  }

  return null;
}
