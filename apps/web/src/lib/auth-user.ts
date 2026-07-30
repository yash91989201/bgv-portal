import { api } from "@bgv-portal/backend/convex/_generated/api";
import { createServerFn } from "@tanstack/react-start";

import { fetchAuthQuery } from "@/lib/auth-server";

// ponytail: backend _generated types lack role/username until regen; runtime narrowing inline
export const getAuthUser = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			return await fetchAuthQuery(api.auth.getCurrentUser);
		} catch {
			return null;
		}
	},
);
