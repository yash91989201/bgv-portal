import type { AuthConfig } from "convex/server";

/**
 * Self-hosted Coolify currently sets built-in CONVEX_SITE_URL to the backend
 * origin (used as JWT issuer). JWKS is only reachable on the site proxy.
 *
 * Set BETTER_AUTH_JWKS_URL to the site JWKS endpoint, e.g.
 * https://site-….pmigov.com/api/auth/convex/jwks
 *
 * Prefer fixing Coolify CONVEX_SITE_ORIGIN → site URL long-term.
 */
const issuer = process.env.CONVEX_SITE_URL ?? "";
const jwks =
	process.env.BETTER_AUTH_JWKS_URL ?? `${issuer}/api/auth/convex/jwks`;

export default {
	providers: [
		{
			type: "customJwt",
			applicationID: "convex",
			algorithm: "RS256",
			issuer,
			jwks,
		},
	],
} satisfies AuthConfig;
