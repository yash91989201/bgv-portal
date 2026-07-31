import { createFileRoute } from "@tanstack/react-router";

import AddCandidateModal from "@/components/admin/add-candidate-modal";
import CandidateDirectory from "@/components/admin/candidate-directory";
import StatsCards from "@/components/admin/stats-cards";

export const Route = createFileRoute("/(app)/admin/dashboard")({
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<div className="space-y-6 p-6">
			<StatsCards />
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">Enterprise Directory</h2>
					<p className="text-sm text-muted-foreground">
						Manage and track candidate pipelines.
					</p>
				</div>
				<AddCandidateModal />
			</div>
			<CandidateDirectory />
		</div>
	);
}
