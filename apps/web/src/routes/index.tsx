import { createFileRoute, redirect } from "@tanstack/react-router";

import LoginForm from "@/components/login-form";
import { getAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) return; // no user → render login form below

		if (
			user &&
			typeof user === "object" &&
			"role" in user &&
			user.role === "admin"
		) {
			throw redirect({ to: "/admin/dashboard" });
		}
		throw redirect({ to: "/portal" });
	},
	component: HomeComponent,
});

function HomeComponent() {
	return <LoginForm />;
}
