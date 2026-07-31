import { api } from "@bgv-portal/backend/convex/_generated/api";
import type { Id } from "@bgv-portal/backend/convex/_generated/dataModel";
import { laterStages, type Stage } from "@bgv-portal/backend/convex/lib/stages";
import { Avatar, AvatarFallback } from "@bgv-portal/ui/components/avatar";
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
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

type Candidate = {
	_id: Id<"candidates">;
	fullName: string;
	email: string;
	designationAppliedFor: string;
	offeredDepartment: string;
	expectedLocation: string;
	totalExperience: string;
	currentStage: Stage;
};

const columns: ColumnDef<Candidate, unknown>[] = [
	{
		accessorKey: "fullName",
		header: "CANDIDATE PROFILE",
		cell: ({ row }) => (
			<div className="flex items-center gap-3">
				<Avatar size="sm">
					<AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
						{row.original.fullName.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div>
					<div className="font-medium">{row.original.fullName}</div>
					<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
						{row.original.email}
					</div>
				</div>
			</div>
		),
	},
	{
		accessorKey: "designationAppliedFor",
		header: "POSITION & DEPT",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.designationAppliedFor}</div>
				<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
					{row.original.offeredDepartment}
				</div>
			</div>
		),
	},
	{
		accessorKey: "currentStage",
		header: "CURRENT STAGE",
		cell: ({ row }) => (
			<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
				<span className="h-2 w-2 rounded-full bg-blue-500" />
				{row.original.currentStage}
			</span>
		),
	},
	{
		accessorKey: "expectedLocation",
		header: "LOCATION & EXP",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.expectedLocation}</div>
				<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
					{row.original.totalExperience
						? /year/i.test(row.original.totalExperience)
							? row.original.totalExperience.toUpperCase()
							: `${row.original.totalExperience} YEARS EXP`
						: "—"}
				</div>
			</div>
		),
	},
	{
		accessorKey: "_id",
		header: "ACTIONS",
		cell: ({ row }) => (
			<StageUpdate
				candidateId={row.original._id}
				currentStage={row.original.currentStage}
			/>
		),
	},
];

export default function CandidateDirectory() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.candidates.listCandidates,
		{},
		{ initialNumItems: 10 },
	);

	const table = useReactTable({
		data: results,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

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
			<div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
				<Table>
					<TableHeader className="bg-slate-50/80">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="border-b">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} className="border-b last:border-0">
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="py-3">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
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
		return <span className="text-xs text-muted-foreground">Final stage</span>;
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
		<div className="flex items-center gap-2">
			<Select
				value={newStage}
				onValueChange={(v) => {
					if (v) setNewStage(v as Stage);
				}}
			>
				<SelectTrigger className="w-[160px]">
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
				className="w-[100px]"
			/>
			<Button size="sm" disabled={!newStage || saving} onClick={handleSave}>
				{saving ? "…" : "Save"}
			</Button>
		</div>
	);
}
