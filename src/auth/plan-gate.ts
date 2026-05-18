import type { MiddlewareHandler } from "hono";
import type { Env, AuthContext } from "../types";

type GateEnv = { Bindings: Env; Variables: { auth: AuthContext } };

export function hasPro(auth: AuthContext): boolean {
  return auth.plan === "pro" || auth.foundingMember;
}

export const requirePro: MiddlewareHandler<GateEnv> = async (c, next) => {
  const auth = c.get("auth");
  if (!hasPro(auth)) {
    const accept = c.req.header("Accept") || "";
    if (accept.includes("text/html")) {
      return c.redirect("/upgrade");
    }
    return c.json({ error: "pro_required", message: "This feature requires a Pro subscription." }, 403);
  }
  await next();
};
