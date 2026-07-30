import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { createAuth } from "./auth";

const ADMIN_EMAIL = "bgv-admin@kiewitcorporations.com";
const ADMIN_USERNAME = "bgv-admin";
const ADMIN_PASSWORD = "bgv-admin@kiewitcorporations.com";
const ADMIN_NAME = "BGV Admin";

const CANDIDATE_EMAIL = "test-candidate@example.com";
const CANDIDATE_USERNAME = "test-candidate";
const CANDIDATE_PASSWORD = "test-candidate@123";
const CANDIDATE_NAME = "Test Candidate";

export const seedCandidate = internalMutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", value: CANDIDATE_EMAIL }],
		});

		if (existing) {
			return "Candidate user already exists";
		}

		const auth = createAuth(ctx);
		let createdUser: { user: { id: string } };
		try {
			const result = await auth.api.createUser({
				body: {
					email: CANDIDATE_EMAIL,
					password: CANDIDATE_PASSWORD,
					name: CANDIDATE_NAME,
					role: "user",
					data: { username: CANDIDATE_USERNAME },
				},
			});
			createdUser = result as { user: { id: string } };
		} catch (err: unknown) {
			let msg = String(err);
			if (err && typeof err === "object" && "message" in err) {
				msg = String(err.message);
			}
			return `Failed to create candidate user: ${msg}`;
		}

		const candidateId = await ctx.db.insert("candidates", {
			userId: createdUser.user.id,
			fullName: CANDIDATE_NAME,
			email: CANDIDATE_EMAIL,
			mobileNumber: "+1234567890",
			currentLocation: "New York, NY",
			totalExperience: "5 years",
			currentDesignation: "Software Engineer",
			currentDepartment: "Engineering",
			currentSalary: 95000,
			designationAppliedFor: "Senior Software Engineer",
			offeredDepartment: "Engineering",
			expectedLocation: "San Francisco, CA",
			salaryOffered: 130000,
			currentStage: "Application Submitted",
		});

		await ctx.db.insert("statusEvents", {
			candidateId,
			stage: "Application Submitted",
		});

		return `Candidate created: ${candidateId}`;
	},
});

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
