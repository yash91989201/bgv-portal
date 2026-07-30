import { createFileRoute } from "@tanstack/react-router";

import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/admin/dashboard")({
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Admin Dashboard</h1>
				<UserMenu />
			</div>
			<p className="text-muted-foreground">
				Admin dashboard content will be added in a future change.
			</p>
		</div>
	);
}
