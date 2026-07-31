import { api } from "@bgv-portal/backend/convex/_generated/api";
import type { Id } from "@bgv-portal/backend/convex/_generated/dataModel";
import { type Stage } from "@bgv-portal/backend/convex/lib/stages";
import { Avatar, AvatarFallback } from "@bgv-portal/ui/components/avatar";
import { Button } from "@bgv-portal/ui/components/button";
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
import { usePaginatedQuery } from "convex/react";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import EditCandidateModal from "./edit-candidate-modal";

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

export default function CandidateDirectory() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.candidates.listCandidates,
		{},
		{ initialNumItems: 10 },
	);

	const [editingCandidateId, setEditingCandidateId] =
		useState<Id<"candidates"> | null>(null);

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
					<div className="font-medium">
						{row.original.designationAppliedFor}
					</div>
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
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
					onClick={() => setEditingCandidateId(row.original._id)}
				>
					<IconPencil className="size-4" />
				</Button>
			),
		},
	];

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

			<EditCandidateModal
				candidateId={editingCandidateId}
				open={editingCandidateId !== null}
				onClose={() => setEditingCandidateId(null)}
			/>
		</div>
	);
}
