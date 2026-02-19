import type { Role } from "./role";
import type { AuthUser } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers(): HeadersInit {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function resolveRole(
  user: AuthUser | null
): Promise<Role> {
  if (!user?.pi_uid) return "guest";

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${user.pi_uid}&select=role&limit=1`,
      {
        headers: headers(),
        cache: "no-store",
      }
    );

    if (!res.ok) return "customer";

    const data: Array<{ role: string }> = await res.json();
    const role = data?.[0]?.role;

    if (
      role === "seller" ||
      role === "admin" ||
      role === "customer"
    ) {
      return role;
    }

    return "customer";
  } catch {
    return "customer";
  }
}
