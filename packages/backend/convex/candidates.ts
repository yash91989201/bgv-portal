import type { GenericCtx } from "@convex-dev/better-auth";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { isForwardTransition, type Stage } from "./lib/stages";

// ponytail: duplicated from schema.ts — Convex requires explicit v.literal args in both places
export const stageValidator = v.union(
	v.literal("Application Submitted"),
	v.literal("HR Screening"),
	v.literal("Technical Round 1"),
	v.literal("Technical Round 2"),
	v.literal("Salary Discussion"),
	v.literal("Appointment Letter"),
	v.literal("Background Verification Started"),
	v.literal("BGV Completed"),
	v.literal("Offer Letter Released"),
	v.literal("Onboarding"),
	v.literal("Joined"),
);

async function requireAdmin(ctx: GenericCtx<DataModel>) {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user || !("role" in user) || user.role !== "admin") {
		throw new ConvexError("Unauthorized");
	}
	return user;
}

// --- 2.2 createCandidate ---

export const createCandidate = mutation({
	args: {
		username: v.string(),
		email: v.string(),
		password: v.string(),
		fullName: v.string(),
		mobileNumber: v.string(),
		currentLocation: v.string(),
		totalExperience: v.string(),
		currentDesignation: v.string(),
		currentDepartment: v.string(),
		currentSalary: v.number(),
		designationAppliedFor: v.string(),
		offeredDepartment: v.string(),
		expectedLocation: v.string(),
		salaryOffered: v.number(),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);

		const auth = createAuth(ctx);
		let createdUser: { user: { id: string } };
		try {
			const result = await auth.api.createUser({
				body: {
					email: args.email,
					password: args.password,
					name: args.fullName,
					role: "user",
					data: { username: args.username },
				},
			});
			createdUser = result as { user: { id: string } };
		} catch (err: unknown) {
			let msg = String(err);
			if (err && typeof err === "object") {
				const body = "body" in err ? err.body : undefined;
				if (body && typeof body === "object" && "message" in body) {
					msg = String(body.message);
				} else if ("message" in err) {
					msg = String(err.message);
				}
			}
			if (msg.includes("username") || msg.includes("already")) {
				throw new ConvexError(`Username or email already exists: ${msg}`);
			}
			throw new ConvexError(`Failed to create auth user: ${msg}`);
		}

		const initialStage: Stage = "Application Submitted";
		const candidateId = await ctx.db.insert("candidates", {
			userId: createdUser.user.id,
			fullName: args.fullName,
			email: args.email,
			mobileNumber: args.mobileNumber,
			currentLocation: args.currentLocation,
			totalExperience: args.totalExperience,
			currentDesignation: args.currentDesignation,
			currentDepartment: args.currentDepartment,
			currentSalary: args.currentSalary,
			designationAppliedFor: args.designationAppliedFor,
			offeredDepartment: args.offeredDepartment,
			expectedLocation: args.expectedLocation,
			salaryOffered: args.salaryOffered,
			currentStage: initialStage,
		});

		await ctx.db.insert("statusEvents", {
			candidateId,
			stage: initialStage,
		});

		return candidateId;
	},
});

// --- 2.3 listCandidates ---

export const listCandidates = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		return await ctx.db
			.query("candidates")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

// --- 2.4 getCandidate ---

export const getCandidate = query({
	args: {
		candidateId: v.id("candidates"),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		return await ctx.db.get("candidates", args.candidateId);
	},
});

// --- 2.5 updateCandidateInfo ---

export const updateCandidateInfo = mutation({
	args: {
		candidateId: v.id("candidates"),
		fullName: v.optional(v.string()),
		email: v.optional(v.string()),
		mobileNumber: v.optional(v.string()),
		currentLocation: v.optional(v.string()),
		totalExperience: v.optional(v.string()),
		currentDesignation: v.optional(v.string()),
		currentDepartment: v.optional(v.string()),
		currentSalary: v.optional(v.number()),
		designationAppliedFor: v.optional(v.string()),
		offeredDepartment: v.optional(v.string()),
		expectedLocation: v.optional(v.string()),
		salaryOffered: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const { candidateId, ...updates } = args;
		const clean = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);
		if (Object.keys(clean).length > 0) {
			await ctx.db.patch("candidates", candidateId, clean);
		}
	},
});

// --- 2.6 updateStage ---

export const updateStage = mutation({
	args: {
		candidateId: v.id("candidates"),
		newStage: stageValidator,
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const candidate = await ctx.db.get("candidates", args.candidateId);
		if (!candidate) {
			throw new ConvexError("Candidate not found");
		}
		if (!isForwardTransition(candidate.currentStage, args.newStage)) {
			throw new ConvexError(
				`Cannot move from "${candidate.currentStage}" to "${args.newStage}". Stage transitions must be forward-only.`,
			);
		}
		await ctx.db.patch("candidates", args.candidateId, {
			currentStage: args.newStage,
		});
		await ctx.db.insert("statusEvents", {
			candidateId: args.candidateId,
			stage: args.newStage,
			note: args.note,
		});
	},
});

// --- 2.7 getPipelineStats ---

export const getPipelineStats = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const candidates = await ctx.db.query("candidates").collect();
		const interviewsActive = [
			"HR Screening",
			"Technical Round 1",
			"Technical Round 2",
			"Salary Discussion",
		];
		const offersPending = ["Appointment Letter", "Offer Letter Released"];
		const bgvInProgress = ["Background Verification Started", "BGV Completed"];

		let interviewsCount = 0;
		let offersCount = 0;
		let bgvCount = 0;

		for (const c of candidates) {
			if (interviewsActive.includes(c.currentStage)) interviewsCount++;
			else if (offersPending.includes(c.currentStage)) offersCount++;
			else if (bgvInProgress.includes(c.currentStage)) bgvCount++;
		}

		return {
			total: candidates.length,
			interviewsActive: interviewsCount,
			offersPending: offersCount,
			bgvInProgress: bgvCount,
		};
	},
});

// --- 2.8 getStatusHistory ---

export const getStatusHistory = query({
	args: {
		candidateId: v.id("candidates"),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		return await ctx.db
			.query("statusEvents")
			.withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
			.order("asc")
			.collect();
	},
});

// --- 2.9 getMyCandidateProfile ---

export const getMyCandidateProfile = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return null;
		const candidate = await ctx.db
			.query("candidates")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.unique();
		return candidate ?? null;
	},
});

// --- 2.10 getMyStatusHistory ---

export const getMyStatusHistory = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) return [];
		const candidate = await ctx.db
			.query("candidates")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.unique();
		if (!candidate) return [];
		return await ctx.db
			.query("statusEvents")
			.withIndex("by_candidateId", (q) => q.eq("candidateId", candidate._id))
			.order("desc")
			.collect();
	},
});
