import { STAGES } from "@bgv-portal/backend/convex/lib/stages";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import AddCandidateModal from "@/components/admin/add-candidate-modal";
import CandidateDirectory from "@/components/admin/candidate-directory";
import StatsCards from "@/components/admin/stats-cards";

const dashboardSearchSchema = z.object({
	name: z
		.string()
		.optional()
		.transform((v) => v || undefined),
	position: z
		.string()
		.optional()
		.transform((v) => v || undefined),
	stage: z
		.string()
		.optional()
		.transform((v) => {
			const cleaned = v || undefined;
			if (cleaned && !(STAGES as readonly string[]).includes(cleaned))
				return undefined;
			return cleaned;
		}),
	page: z.coerce.number().int().min(1).default(1),
});

export const Route = createFileRoute("/(app)/admin/dashboard")({
	validateSearch: dashboardSearchSchema,
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<div className="space-y-6 p-6">
			<StatsCards />
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">Enterprise Directory</h2>
					<p className="text-muted-foreground text-sm">
						Manage and track candidate pipelines.
					</p>
				</div>
				<AddCandidateModal />
			</div>
			<CandidateDirectory />
		</div>
	);
}
