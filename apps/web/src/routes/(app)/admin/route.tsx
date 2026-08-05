import { api } from "@bgv-portal/backend/convex/_generated/api";
import { Avatar, AvatarFallback } from "@bgv-portal/ui/components/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@bgv-portal/ui/components/breadcrumb";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@bgv-portal/ui/components/sidebar";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LogOut, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { BrandLogo } from "@/components/brand-logo";
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
						<BrandLogo size="sm" />
						<div>
							<div className="font-bold text-sm tracking-wide">KIEWIT CORP</div>
							<div className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">
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
													? "rounded-full bg-blue-600 text-white hover:bg-blue-700"
													: "rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
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
							<div className="truncate font-medium text-sm text-white">
								{user?.name ?? "Admin User"}
							</div>
							<div className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">
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
						className="mt-3 flex items-center gap-2 text-slate-400 text-sm hover:text-white"
					>
						<LogOut className="h-4 w-4" />
						<span className="font-medium text-xs uppercase tracking-wider">
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
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
