import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}
		// ponytail: role not typed until backend regen; runtime check
		if (!("role" in user) || (user as { role?: unknown }).role !== "admin") {
			throw redirect({ to: "/portal" });
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
