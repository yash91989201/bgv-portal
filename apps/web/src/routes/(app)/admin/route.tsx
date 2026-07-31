import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
} from "@bgv-portal/ui/components/sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@bgv-portal/ui/components/breadcrumb";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { LayoutGrid, Users, Search, LogOut } from "lucide-react";
import type { CSSProperties } from "react";
import { Avatar, AvatarFallback } from "@bgv-portal/ui/components/avatar";
import { useQuery } from "convex/react";
import { api } from "@bgv-portal/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { getAuthUser } from "@/lib/auth-user";

export const Route = createFileRoute("/(app)/admin")({
	beforeLoad: async () => {
		const user = await getAuthUser();
		if (!user) {
			throw redirect({ to: "/" });
		}
		// ponytail: role not typed until backend regen; runtime check
		if (
			!(
				user &&
				typeof user === "object" &&
				"role" in user &&
				(user as { role: unknown }).role === "admin"
			)
		) {
			throw redirect({ to: "/portal" });
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	const location = useLocation();
	const user = useQuery(api.auth.getCurrentUser);

	const navItems = [
		{ to: "/admin/dashboard", icon: LayoutGrid, label: "Executive Overview" },
		{ to: "/admin/dashboard", icon: Users, label: "Candidate Directory" },
	];

	return (
		<SidebarProvider
			className="h-full min-h-0"
			style={
				{
					"--sidebar": "#0b1220",
					"--sidebar-foreground": "#f8fafc",
					"--sidebar-accent": "#1e293b",
					"--sidebar-accent-foreground": "#f8fafc",
					"--sidebar-border": "transparent",
					"--sidebar-primary": "#2563eb",
					"--sidebar-primary-foreground": "#ffffff",
					"--sidebar-ring": "#2563eb",
				} as CSSProperties
			}
		>
			<Sidebar>
				<SidebarHeader className="px-4 py-5">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
							<LayoutGrid className="h-5 w-5" />
						</div>
						<div>
							<div className="text-sm font-bold tracking-wide">KIEWIT CORP</div>
							<div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
								ENTERPRISE ATS
							</div>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent className="px-2">
					<SidebarGroup className="p-0">
						<SidebarGroupContent>
							<SidebarMenu>
								{navItems.map(({ to, icon: Icon, label }) => (
									<SidebarMenuItem key={label}>
										<SidebarMenuButton
											render={<Link to={to} />}
											isActive={
												location.pathname === to &&
												label === "Executive Overview"
											}
											className={
												location.pathname === to &&
												label === "Executive Overview"
													? "bg-blue-600 text-white hover:bg-blue-700 rounded-full"
													: "text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
											}
										>
											<Icon className="h-4 w-4" />
											<span>{label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="px-4 py-4">
					<div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/50 px-3 py-2.5">
						<Avatar size="sm">
							<AvatarFallback className="bg-blue-600 text-white text-xs">
								{user?.name?.charAt(0)?.toUpperCase() ?? "A"}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<div className="text-sm font-medium truncate text-white">
								{user?.name ?? "Admin User"}
							</div>
							<div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
								HR ADMINISTRATOR
							</div>
						</div>
					</div>
					<button
						onClick={() =>
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										window.location.href = "/";
									},
								},
							})
						}
						className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mt-3"
					>
						<LogOut className="h-4 w-4" />
						<span className="text-xs font-medium uppercase tracking-wider">
							Sign Out
						</span>
					</button>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset className="overflow-auto bg-gray-50">
				<header className="flex items-center justify-between border-b bg-white px-6 py-3">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage className="text-muted-foreground">
									Dashboard
								</BreadcrumbPage>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Overview</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Global search..."
							className="h-9 w-64 rounded-full border bg-gray-50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
