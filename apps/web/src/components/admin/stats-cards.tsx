import { api } from "@bgv-portal/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Users, Activity, CircleCheck, Clock } from "lucide-react";

const cards = [
	{
		key: "total" as const,
		title: "TOTAL CANDIDATES",
		icon: Users,
		iconBg: "bg-slate-100 text-slate-600",
	},
	{
		key: "interviewsActive" as const,
		title: "ACTIVE PIPELINE",
		icon: Activity,
		iconBg: "bg-blue-100 text-blue-600",
	},
	{
		key: "offersPending" as const,
		title: "OFFERS PENDING",
		icon: CircleCheck,
		iconBg: "bg-amber-100 text-amber-600",
	},
	{
		key: "bgvInProgress" as const,
		title: "BGV IN PROGRESS",
		icon: Clock,
		iconBg: "bg-cyan-100 text-cyan-600",
	},
];

export default function StatsCards() {
	const stats = useQuery(api.candidates.getPipelineStats);

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{cards.map(({ key, title, icon: Icon, iconBg }) => (
				<div
					key={key}
					className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm"
				>
					<div className="flex items-center gap-3">
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
						>
							<Icon className="h-5 w-5" />
						</div>
						<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{title}
						</span>
					</div>
					<div className="text-3xl font-bold tracking-tight">
						{stats ? stats[key] : "—"}
					</div>
				</div>
			))}
		</div>
	);
}
