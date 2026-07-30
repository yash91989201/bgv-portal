import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { createAuth } from "./auth";

const ADMIN_EMAIL = "bgv-admin@kiewitcorporations.com";
const ADMIN_USERNAME = "bgv-admin";
const ADMIN_PASSWORD = "bgv-admin@kiewitcorporations.com";
const ADMIN_NAME = "BGV Admin";

/**
 * Creates the initial admin user if it doesn't already exist.
 * Run via: npx convex run seed:seedAdmin
 *
 * Uses the better-auth admin plugin's createUser API server-side (no headers/session).
 * The admin plugin allows no-session/no-request execution for createUser.
 * The username plugin's before-hook picks up `username` from the data field.
 */
export const seedAdmin = internalMutation({
	args: {},
	handler: async (ctx) => {
		// Idempotency check: look up user by email via the component adapter
		const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", value: ADMIN_EMAIL }],
		});

		if (existing) {
			return "Admin user already exists";
		}

		// Create auth instance and call admin createUser API without headers
		// (server-side call: no session, no request context → auth check passes)
		const auth = createAuth(ctx);
		await auth.api.createUser({
			body: {
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
				name: ADMIN_NAME,
				role: "admin",
				data: { username: ADMIN_USERNAME },
			},
		});

		return "Admin user created";
	},
});
