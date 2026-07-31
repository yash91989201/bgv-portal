import { api } from "@bgv-portal/backend/convex/_generated/api";
import { STAGES, stageIndex } from "@bgv-portal/backend/convex/lib/stages";
import { Badge } from "@bgv-portal/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@bgv-portal/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@bgv-portal/ui/components/empty";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@bgv-portal/ui/components/tabs";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import UserMenu from "@/components/user-menu";
import { getAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/(app)/portal")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/" });
		}
		// ponytail: role not typed until backend regen; runtime check
		if ("role" in user && (user as { role?: unknown }).role === "admin") {
			throw redirect({ to: "/admin/dashboard" });
		}
	},
	component: PortalPage,
});

function PortalPage() {
	const profile = useQuery(api.candidates.getMyCandidateProfile);
	const statusHistory = useQuery(api.candidates.getMyStatusHistory);

	if (profile === undefined) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<p className="text-muted-foreground">Loading…</p>
			</div>
		);
	}

	if (profile === null) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No profile found</EmptyTitle>
						<EmptyDescription>
							Your candidate profile has not been set up yet. Please contact
							administration.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	const currentIdx = stageIndex(profile.currentStage);
	const eventsByStage = new Map((statusHistory ?? []).map((e) => [e.stage, e]));

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="font-bold text-3xl">Candidate Portal</h1>
				<UserMenu />
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-xl">{profile.fullName}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Current stage:{" "}
						<span className="font-medium text-foreground">
							{profile.currentStage}
						</span>{" "}
						— Stage {currentIdx + 1} of {STAGES.length}
					</p>
				</CardContent>
			</Card>

			<Tabs defaultValue="journey">
				<TabsList>
					<TabsTrigger value="journey">Application Journey</TabsTrigger>
					<TabsTrigger value="profile">My Profile</TabsTrigger>
				</TabsList>

				<TabsContent value="journey">
					<Card>
						<CardHeader>
							<CardTitle>Application Journey</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="relative ml-3 space-y-6 border-muted border-l-2 pl-6">
								{STAGES.map((stage, idx) => {
									const event = eventsByStage.get(stage);
									const isCompleted = !!event && idx !== currentIdx;
									const isCurrent = idx === currentIdx;
									const isUpcoming = !isCompleted && !isCurrent;

									return (
										<div key={stage} className="relative">
											<div
												className={`absolute top-0.5 -left-[31px] h-3 w-3 rounded-full border-2 ${
													isCompleted
														? "border-green-500 bg-green-500"
														: isCurrent
															? "border-blue-500 bg-blue-500"
															: "border-muted-foreground/30 bg-background"
												}`}
											/>
											<div className="flex items-start justify-between gap-2">
												<div>
													<p
														className={`font-medium text-sm ${
															isUpcoming ? "text-muted-foreground" : ""
														}`}
													>
														{stage}
													</p>
													{event?._creationTime && (
														<p className="mt-0.5 text-muted-foreground text-xs">
															{new Date(
																event._creationTime,
															).toLocaleDateString()}
														</p>
													)}
													{event?.note && (
														<p className="mt-0.5 text-muted-foreground text-xs italic">
															{event.note}
														</p>
													)}
												</div>
												<div>
													{isCompleted && (
														<Badge variant="secondary">Completed</Badge>
													)}
													{isCurrent && (
														<Badge variant="default">Current</Badge>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="profile">
					<div className="space-y-4">
						{profileSections.map((section) => (
							<Card key={section.title}>
								<CardHeader>
									<CardTitle>{section.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
										{section.fields.map((field) => (
											<div key={field.label} className="contents">
												<dt className="text-muted-foreground">{field.label}</dt>
												<dd>
													{"format" in field && field.format
														? field.format(profile[field.key] as number)
														: String(profile[field.key] ?? "—")}
												</dd>
											</div>
										))}
									</dl>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

const profileSections = [
	{
		title: "Personal",
		fields: [
			{ label: "Full Name", key: "fullName" as const },
			{ label: "Email", key: "email" as const },
			{ label: "Mobile", key: "mobileNumber" as const },
			{ label: "Current Location", key: "currentLocation" as const },
		],
	},
	{
		title: "Professional",
		fields: [
			{ label: "Total Experience", key: "totalExperience" as const },
			{ label: "Current Designation", key: "currentDesignation" as const },
			{ label: "Current Department", key: "currentDepartment" as const },
			{
				label: "Current Salary",
				key: "currentSalary" as const,
				format: (v: number) => `₹${v.toLocaleString()}`,
			},
		],
	},
	{
		title: "Application",
		fields: [
			{
				label: "Designation Applied For",
				key: "designationAppliedFor" as const,
			},
			{ label: "Offered Department", key: "offeredDepartment" as const },
			{ label: "Expected Location", key: "expectedLocation" as const },
			{
				label: "Salary Offered",
				key: "salaryOffered" as const,
				format: (v: number) => `₹${v.toLocaleString()}`,
			},
		],
	},
];
