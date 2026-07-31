import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@bgv-portal/ui/components/sidebar";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";

import UserMenu from "@/components/user-menu";
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
	const location = useLocation();

	return (
		<SidebarProvider className="h-full min-h-0">
			<Sidebar>
				<SidebarHeader>
					<span className="px-2 font-semibold text-lg">BGV Portal</span>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Admin</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										render={<Link to="/admin/dashboard" />}
										isActive={location.pathname === "/admin/dashboard"}
									>
										Dashboard
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>

			<SidebarInset className="overflow-auto">
				<header className="flex items-center gap-2 border-b px-4 py-2">
					<SidebarTrigger />
					<h1 className="font-semibold text-lg">Admin Dashboard</h1>
					<div className="ml-auto">
						<UserMenu />
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
