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
				<h2 className="font-semibold text-xl">Enterprise directory</h2>
				<AddCandidateModal />
			</div>
			<CandidateDirectory />
		</div>
	);
}
