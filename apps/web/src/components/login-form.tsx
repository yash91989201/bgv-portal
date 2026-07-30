import { Button } from "@bgv-portal/ui/components/button";
import { Input } from "@bgv-portal/ui/components/input";
import { Label } from "@bgv-portal/ui/components/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@bgv-portal/ui/components/tabs";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
	const navigate = useNavigate({ from: "/" });
	const [activeTab, setActiveTab] = useState("candidate");

	const form = useForm({
		defaultValues: {
			username: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.username(
				{ username: value.username, password: value.password },
				{
					onSuccess: async () => {
						const session = await authClient.getSession();
						const user = session?.data?.user;
						// ponytail: role not typed until backend regen; runtime check
						const isAdmin =
							user &&
							typeof user === "object" &&
							"role" in user &&
							(user as { role?: unknown }).role === "admin";
						toast.success("Signed in");
						navigate({ to: isAdmin ? "/admin/dashboard" : "/portal" });
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				username: z.string().min(1, "Username is required"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	const heading = activeTab === "admin" ? "Admin Sign In" : "Candidate Sign In";

	return (
		<div className="mx-auto w-full mt-10 max-w-md p-6">
			<h1 className="mb-6 text-center text-3xl font-bold">{heading}</h1>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full mb-6">
					<TabsTrigger value="candidate">Candidate</TabsTrigger>
					<TabsTrigger value="admin">Admin</TabsTrigger>
				</TabsList>

				<TabsContent value="candidate">
					<p className="text-muted-foreground text-sm text-center mb-4">
						Sign in to access the candidate portal.
					</p>
				</TabsContent>
				<TabsContent value="admin">
					<p className="text-muted-foreground text-sm text-center mb-4">
						Sign in to access the admin dashboard.
					</p>
				</TabsContent>
			</Tabs>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="username">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Username</Label>
								<Input
									id={field.name}
									name={field.name}
									type="text"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Submitting..." : "Sign In"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
