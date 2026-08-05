import { api } from "@bgv-portal/backend/convex/_generated/api";
import { STAGES, stageIndex } from "@bgv-portal/backend/convex/lib/stages";
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
import { Check, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { authClient } from "@/lib/auth-client";
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

	const isLoading = profile === undefined;
	const hasProfile = !!profile;
	const firstName = hasProfile ? profile.fullName.split(" ")[0] : "";
	const currentIdx = hasProfile ? stageIndex(profile.currentStage) : 0;
	const eventsByStage = new Map((statusHistory ?? []).map((e) => [e.stage, e]));

	return (
		<div className="min-h-screen bg-slate-50">
			{/* ── Dark navy header ── */}
			<header className="bg-[#0B1F3A]">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
					<div className="flex items-center gap-3">
						<BrandLogo />
						<div>
							<p className="font-bold text-sm leading-tight text-white tracking-wide">
								KIEWIT CORPORATION
							</p>
							<p className="text-[10px] leading-tight text-white/50 tracking-widest uppercase">
								CANDIDATE PORTAL
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										window.location.href = "/";
									},
								},
							});
						}}
						className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-white text-xs font-medium uppercase tracking-wide transition-colors hover:bg-white/10"
					>
						<LogOut className="size-3.5" />
						Sign Out
					</button>
				</div>
			</header>

			{/* ── Content area ── */}
			<main className="mx-auto max-w-4xl px-6 py-8">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<p className="text-muted-foreground">Loading…</p>
					</div>
				) : !hasProfile ? (
					<div className="py-12">
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
				) : (
					<>
						{/* ── Welcome card ── */}
						<div className="relative mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/40 to-blue-100/60 pointer-events-none" />
							<div className="relative">
								<p className="mb-1 text-blue-600 text-xs font-semibold uppercase tracking-wider">
									Welcome Back
								</p>
								<h1 className="mb-2 font-bold text-3xl text-[#0B1F3A]">
									Hello, {firstName}
								</h1>
								<p className="mb-4 max-w-lg text-muted-foreground text-sm leading-relaxed">
									Your recruitment journey for{" "}
									<strong className="font-semibold text-foreground">
										{profile.designationAppliedFor}
									</strong>{" "}
									is progressing. View your application status and updates
									below.
								</p>
								<div className="flex flex-wrap gap-2">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 text-xs font-medium">
										<span className="size-1.5 rounded-full bg-blue-500" />
										STAGE: {profile.currentStage}
									</span>
									<span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600 text-xs font-medium">
										EXPECTED COMPLETION: 3-5 Business Days
									</span>
								</div>
							</div>
						</div>

						{/* ── Tabs ── */}
						<Tabs defaultValue="journey">
							<TabsList variant="line" className="border-slate-200 border-b">
								<TabsTrigger
									value="journey"
									className="text-slate-500 uppercase tracking-wide text-xs data-active:text-blue-700 data-active:after:bg-blue-600"
								>
									Application Journey
								</TabsTrigger>
								<TabsTrigger
									value="profile"
									className="text-slate-500 uppercase tracking-wide text-xs data-active:text-blue-700 data-active:after:bg-blue-600"
								>
									My Profile Details
								</TabsTrigger>
							</TabsList>

							{/* ── Application Journey tab ── */}
							<TabsContent value="journey">
								<Card className="mt-4 border-slate-200 shadow-sm">
									<CardHeader className="pb-4">
										<CardTitle className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
											Application Journey
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="relative pl-8">
											{/* Vertical connector line */}
											<div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-blue-200" />

											{STAGES.map((stage, idx) => {
												const isCompleted = idx < currentIdx;
												const isCurrent = idx === currentIdx;
												const isUpcoming = idx > currentIdx;
												const event = eventsByStage.get(stage);

												return (
													<div key={stage} className="relative mb-8 last:mb-0">
														{/* Circle indicator */}
														<div
															className={`absolute -left-8 top-0.5 z-10 flex size-6 items-center justify-center rounded-full border-2 ${
																isCompleted
																	? "border-green-500 bg-green-500"
																	: isCurrent
																		? "border-blue-500 bg-blue-500"
																		: "border-slate-300 bg-white"
															}`}
														>
															{isCompleted ? (
																<Check
																	className="size-3.5 text-white"
																	strokeWidth={3}
																/>
															) : isCurrent ? (
																<div className="size-2 rounded-full bg-white" />
															) : null}
														</div>

														{/* Stage content */}
														<div>
															<p
																className={`font-semibold text-sm ${
																	isUpcoming
																		? "text-slate-400"
																		: "text-slate-900"
																}`}
															>
																{stage}
															</p>
															{isCompleted && (
																<p className="mt-0.5 text-green-600 text-xs font-medium uppercase">
																	Completed
																</p>
															)}
															{isCurrent && (
																<p className="mt-0.5 text-blue-600 text-xs font-medium">
																	In Progress
																</p>
															)}
															{event?._creationTime &&
																(isCompleted || isCurrent) && (
																	<p className="mt-0.5 text-muted-foreground text-xs">
																		{new Date(
																			event._creationTime,
																		).toLocaleDateString()}
																	</p>
																)}
															{event?.note && (isCompleted || isCurrent) && (
																<p className="mt-0.5 text-muted-foreground text-xs italic">
																	{event.note}
																</p>
															)}
														</div>
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* ── My Profile Details tab ── */}
							<TabsContent value="profile">
								<div className="mt-4 space-y-4">
									{profileSections.map((section) => (
										<Card
											key={section.title}
											className="border-slate-200 shadow-sm"
										>
											<CardHeader className="pb-3">
												<CardTitle className="text-slate-900 text-sm font-semibold">
													{section.title}
												</CardTitle>
											</CardHeader>
											<CardContent>
												<dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
													{section.fields.map((field) => (
														<div key={field.label} className="contents">
															<dt className="text-muted-foreground">
																{field.label}
															</dt>
															<dd className="font-medium text-slate-900">
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
					</>
				)}
			</main>
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
