export const STAGES = [
	"Application Submitted",
	"HR Screening",
	"Technical Round 1",
	"Technical Round 2",
	"Salary Discussion",
	"Appointment Letter",
	"Background Verification Started",
	"BGV Completed",
	"Offer Letter Released",
	"Onboarding",
	"Joined",
] as const;

export type Stage = (typeof STAGES)[number];

export function stageIndex(stage: Stage): number {
	return STAGES.indexOf(stage);
}

export function isForwardTransition(from: Stage, to: Stage): boolean {
	return stageIndex(to) > stageIndex(from);
}

export function laterStages(current: Stage): readonly Stage[] {
	return STAGES.slice(stageIndex(current) + 1);
}
