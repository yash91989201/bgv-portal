import { Button } from "@bgv-portal/ui/components/button";
import { Checkbox } from "@bgv-portal/ui/components/checkbox";
import { Input } from "@bgv-portal/ui/components/input";
import { Label } from "@bgv-portal/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

type PortalMode = "admin" | "candidate";

export function LoginForm() {
	const navigate = useNavigate({ from: "/" });
	const [rememberDevice, setRememberDevice] = useState(false);
	const [portal, setPortal] = useState<PortalMode>("candidate");

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
							user.role === "admin";
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

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-5"
		>
			{/* Portal toggle */}
			<div
				className="grid grid-cols-2 rounded-lg bg-slate-100 p-1"
				role="tablist"
				aria-label="Portal selection"
			>
				<button
					type="button"
					role="tab"
					aria-selected={portal === "candidate"}
					onClick={() => setPortal("candidate")}
					className={
						portal === "candidate"
							? "rounded-md bg-white px-3 py-2.5 font-semibold text-[13px] text-slate-900 shadow-sm transition-all"
							: "rounded-md px-3 py-2.5 font-medium text-[13px] text-slate-500 transition-all hover:text-slate-700"
					}
				>
					Candidate Portal
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={portal === "admin"}
					onClick={() => setPortal("admin")}
					className={
						portal === "admin"
							? "rounded-md bg-white px-3 py-2.5 font-semibold text-[13px] text-slate-900 shadow-sm transition-all"
							: "rounded-md px-3 py-2.5 font-medium text-[13px] text-slate-500 transition-all hover:text-slate-700"
					}
				>
					Admin Portal
				</button>
			</div>

			{/* Username */}
			<form.Field name="username">
				{(field) => (
					<div className="space-y-1.5">
						<Label
							htmlFor={field.name}
							className="font-semibold text-[11px] text-slate-600 tracking-[0.08em]"
						>
							USERNAME
						</Label>
						<div className="relative">
							<User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
							<Input
								id={field.name}
								name={field.name}
								type="text"
								autoComplete="username"
								placeholder="Enter your username"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="h-11 rounded-lg border-slate-200 bg-[#F8FAFC] pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B1B33] focus-visible:ring-[#0B1B33]/15"
							/>
						</div>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-red-500 text-xs">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			{/* Password */}
			<form.Field name="password">
				{(field) => (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label
								htmlFor={field.name}
								className="font-semibold text-[11px] text-slate-600 tracking-[0.08em]"
							>
								PASSWORD
							</Label>
							<button
								type="button"
								className="font-semibold text-[#2563EB] text-[11px] tracking-[0.06em] transition-colors hover:text-blue-700"
							>
								FORGOT PASSWORD?
							</button>
						</div>
						<div className="relative">
							<Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
							<Input
								id={field.name}
								name={field.name}
								type="password"
								autoComplete="current-password"
								placeholder="Enter your password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								className="h-11 rounded-lg border-slate-200 bg-[#F8FAFC] pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0B1B33] focus-visible:ring-[#0B1B33]/15"
							/>
						</div>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-red-500 text-xs">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			{/* Remember device */}
			<label
				htmlFor="remember-device"
				className="flex items-center gap-2.5 text-[14px] text-slate-600"
			>
				<Checkbox
					id="remember-device"
					checked={rememberDevice}
					onCheckedChange={(v) => setRememberDevice(v === true)}
				/>
				Remember my device
			</label>

			{/* Submit */}
			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
			>
				{({ canSubmit, isSubmitting }) => (
					<Button
						type="submit"
						disabled={!canSubmit || isSubmitting}
						className="!bg-[#0B1B33] !text-white hover:!bg-[#071222] h-11 w-full gap-2 rounded-lg px-4 font-semibold text-sm shadow-none"
					>
						{isSubmitting ? (
							"Signing in..."
						) : (
							<>
								Sign In Securely
								<ArrowRight className="size-4" />
							</>
						)}
					</Button>
				)}
			</form.Subscribe>

			{/* SSO footer */}
			<p className="pt-2 text-center font-medium text-[10px] text-slate-400 leading-relaxed tracking-[0.08em]">
				PROTECTED BY ENTERPRISE SINGLE SIGN-ON (SSO).
				<br />
				FOR ASSISTANCE, CONTACT IT SUPPORT.
			</p>
		</form>
	);
}
