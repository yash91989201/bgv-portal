import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-svh">
			{/* LEFT PANEL — brand */}
			<aside className="relative hidden w-1/2 overflow-hidden bg-[#020B24] lg:flex lg:flex-col">
				{/* Soft gradient wash */}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(10,34,92,0.85)_0%,transparent_60%)]" />

				{/* Overlapping wireframe circles */}
				<div className="pointer-events-none absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
				<div className="pointer-events-none absolute top-1/2 left-1/2 size-[380px] -translate-x-[42%] -translate-y-[55%] rounded-full border border-white/[0.05]" />

				<div className="relative z-10 flex h-full flex-col px-12 py-10 xl:px-16">
					{/* Brand mark */}
					<div className="flex items-center gap-3">
						<BrandLogo />
						<div className="leading-tight">
							<p className="font-semibold text-[13px] text-white tracking-wide">
								KIEWIT CORPORATION
							</p>
							<p className="text-[10px] text-slate-400 tracking-[0.12em]">
								ENTERPRISE ATS
							</p>
						</div>
					</div>

					{/* Hero copy */}
					<div className="flex flex-1 flex-col justify-center">
						<div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5">
							<svg
								aria-hidden="true"
								className="size-3.5 text-slate-300"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.75}
							>
								<title>Secure</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 3l7 4v5c0 4.418-3.134 8.166-7 9-3.866-.834-7-4.582-7-9V7l7-4z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9.5 12l1.8 1.8L14.8 10"
								/>
							</svg>
							<span className="text-[12px] text-slate-200">
								Next-Generation Recruitment
							</span>
						</div>

						<h1 className="max-w-[20ch] font-bold text-[2.65rem] text-white leading-[1.15] tracking-tight xl:text-5xl">
							Discover and hire the{" "}
							<span className="text-[#FDB913]">world&apos;s top talent.</span>
						</h1>

						<p className="mt-6 max-w-md text-[15px] text-slate-400 leading-relaxed">
							Welcome to the centralized hub for enterprise recruitment, talent
							acquisition, and corporate onboarding.
						</p>
					</div>

					{/* Copyright */}
					<p className="text-[12px] text-slate-500">
						© 2026 Kiewit Corporation. All rights reserved.
					</p>
				</div>
			</aside>

			{/* RIGHT PANEL — form */}
			<section className="flex flex-1 items-center justify-center bg-white px-6 py-12">
				<div className="w-full max-w-[420px]">
					{/* Mobile brand */}
					<div className="mb-10 flex items-center gap-3 lg:hidden">
						<BrandLogo size="sm" />
						<div className="leading-tight">
							<p className="font-semibold text-[#020B24] text-[12px] tracking-wide">
								KIEWIT CORPORATION
							</p>
							<p className="text-[10px] text-slate-400 tracking-[0.12em]">
								ENTERPRISE ATS
							</p>
						</div>
					</div>

					<h2 className="font-bold text-[#0F172A] text-[1.75rem] tracking-tight">
						Welcome Back
					</h2>
					<p className="mt-1.5 mb-8 text-[14px] text-slate-500">
						Please enter your credentials to continue.
					</p>

					<LoginForm />
				</div>
			</section>
		</div>
	);
}
