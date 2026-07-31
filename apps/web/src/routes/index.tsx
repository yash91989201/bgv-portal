import { createFileRoute, redirect } from "@tanstack/react-router";

import { getAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/login" });
		}

		if ("role" in user && (user as { role?: unknown }).role === "admin") {
			throw redirect({ to: "/admin/dashboard" });
		}
		throw redirect({ to: "/portal" });
	},
	component: HomeComponent,
});

function HomeComponent() {
	return null;
}
