import { z } from "zod";

import { STAGES } from "@bgv-portal/backend/convex/lib/stages";

export const credentialsSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const personalInfoSchema = z.object({
	fullName: z.string().min(1, "Full name is required"),
	email: z.string().email("Invalid email address"),
	mobileNumber: z.string().min(1, "Mobile number is required"),
	currentLocation: z.string().min(1, "Current location is required"),
});

export const professionalInfoSchema = z.object({
	totalExperience: z.string().min(1, "Total experience is required"),
	currentDesignation: z.string().min(1, "Current designation is required"),
	currentDepartment: z.string().min(1, "Current department is required"),
	currentSalary: z.number().min(0, "Current salary must be positive"),
});

export const applicationInfoSchema = z.object({
	designationAppliedFor: z
		.string()
		.min(1, "Designation applied for is required"),
	offeredDepartment: z.string().min(1, "Offered department is required"),
	expectedLocation: z.string().min(1, "Expected location is required"),
	salaryOffered: z.number().min(0, "Salary offered must be positive"),
});

export const createCandidateFormSchema = z.object({
	...credentialsSchema.shape,
	...personalInfoSchema.shape,
	...professionalInfoSchema.shape,
	...applicationInfoSchema.shape,
});

export const stageSchema = z.enum(STAGES);

export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
export type ProfessionalInfoForm = z.infer<typeof professionalInfoSchema>;
export type ApplicationInfoForm = z.infer<typeof applicationInfoSchema>;
export type CreateCandidateForm = z.infer<typeof createCandidateFormSchema>;
export type Stage = z.infer<typeof stageSchema>;
