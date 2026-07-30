import { api } from "@bgv-portal/backend/convex/_generated/api";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@bgv-portal/ui/components/card";
import { useQuery } from "convex/react";

const cards = [
	{ key: "total", title: "Total Candidates" },
	{ key: "interviewsActive", title: "Interviews Active" },
	{ key: "offersPending", title: "Offers Pending" },
	{ key: "bgvInProgress", title: "BGV In Progress" },
] as const;

export default function StatsCards() {
	const stats = useQuery(api.candidates.getPipelineStats);

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{cards.map(({ key, title }) => (
				<Card key={key}>
					<CardHeader>
						<CardTitle>{title}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats ? stats[key] : "—"}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
