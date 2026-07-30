import { createFileRoute, redirect } from "@tanstack/react-router";

import { getAuthUser } from "@/lib/auth-user";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/portal")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		// ponytail: role not typed until backend regen; runtime check
		if ("role" in user && (user as { role?: unknown }).role === "admin") {
			throw redirect({ to: "/admin/dashboard" });
		}
	},
	component: PortalPage,
});

function PortalPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Candidate Portal</h1>
				<UserMenu />
			</div>
			<p className="text-muted-foreground">
				Candidate portal content will be added in a future change.
			</p>
		</div>
	);
}
