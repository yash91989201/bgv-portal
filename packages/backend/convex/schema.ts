import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Hand-mirrored from lib/stages.ts STAGES (Convex requires explicit v.literal args)
const stageValidator = v.union(
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

export default defineSchema({
	candidates: defineTable({
		userId: v.string(),
		fullName: v.string(),
		email: v.string(),
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
		adminRemarks: v.optional(v.string()),
		currentStage: stageValidator,
	}).index("by_userId", ["userId"]),

	statusEvents: defineTable({
		candidateId: v.id("candidates"),
		stage: stageValidator,
		note: v.optional(v.string()),
	}).index("by_candidateId", ["candidateId"]),
});
