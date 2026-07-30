import { api } from "@bgv-portal/backend/convex/_generated/api";
import type { Id } from "@bgv-portal/backend/convex/_generated/dataModel";
import { laterStages, type Stage } from "@bgv-portal/backend/convex/lib/stages";
import { Badge } from "@bgv-portal/ui/components/badge";
import { Button } from "@bgv-portal/ui/components/button";
import { Input } from "@bgv-portal/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@bgv-portal/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@bgv-portal/ui/components/table";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function CandidateDirectory() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.candidates.listCandidates,
		{},
		{ initialNumItems: 10 },
	);

	if (status === "LoadingFirstPage") {
		return (
			<div className="text-muted-foreground py-4">Loading candidates…</div>
		);
	}

	if (results.length === 0) {
		return (
			<div className="text-muted-foreground py-4">
				No candidates yet. Add one to get started.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Designation Applied</TableHead>
							<TableHead>Stage</TableHead>
							<TableHead>Expected Location</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.map((c) => (
							<TableRow key={c._id}>
								<TableCell className="font-medium">{c.fullName}</TableCell>
								<TableCell>{c.designationAppliedFor}</TableCell>
								<TableCell>
									<Badge variant="secondary">{c.currentStage}</Badge>
								</TableCell>
								<TableCell>{c.expectedLocation}</TableCell>
								<TableCell className="text-right">
									<StageUpdate
										candidateId={c._id}
										currentStage={c.currentStage}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{status === "CanLoadMore" && (
				<Button variant="outline" onClick={() => loadMore(10)}>
					Load More
				</Button>
			)}
		</div>
	);
}

function StageUpdate({
	candidateId,
	currentStage,
}: {
	candidateId: Id<"candidates">;
	currentStage: Stage;
}) {
	const updateStage = useMutation(api.candidates.updateStage);
	const [newStage, setNewStage] = useState<Stage | "">("");
	const [note, setNote] = useState("");
	const [saving, setSaving] = useState(false);

	const stages = laterStages(currentStage);
	if (stages.length === 0) {
		return <Badge variant="outline">Final stage</Badge>;
	}

	const handleSave = async () => {
		if (!newStage) return;
		setSaving(true);
		try {
			await updateStage({
				candidateId,
				newStage,
				note: note || undefined,
			});
			toast.success(`Stage → ${newStage}`);
			setNewStage("");
			setNote("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update stage",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex items-center gap-2 justify-end">
			<Select
				value={newStage}
				onValueChange={(v) => {
					if (v) setNewStage(v as Stage);
				}}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Move to…" />
				</SelectTrigger>
				<SelectContent>
					{stages.map((s) => (
						<SelectItem key={s} value={s}>
							{s}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Input
				placeholder="Note…"
				value={note}
				onChange={(e) => setNote(e.target.value)}
				className="w-[120px]"
			/>
			<Button size="sm" disabled={!newStage || saving} onClick={handleSave}>
				{saving ? "…" : "Save"}
			</Button>
		</div>
	);
}
