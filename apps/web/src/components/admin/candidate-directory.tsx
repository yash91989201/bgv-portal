import { api } from "@bgv-portal/backend/convex/_generated/api";
import type { Id } from "@bgv-portal/backend/convex/_generated/dataModel";
import { STAGES, type Stage } from "@bgv-portal/backend/convex/lib/stages";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@bgv-portal/ui/components/alert-dialog";
import { Avatar, AvatarFallback } from "@bgv-portal/ui/components/avatar";
import { Button } from "@bgv-portal/ui/components/button";
import { Checkbox } from "@bgv-portal/ui/components/checkbox";
import { Input } from "@bgv-portal/ui/components/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@bgv-portal/ui/components/pagination";
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
import { IconPencil, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import EditCandidateModal from "./edit-candidate-modal";

const Route = getRouteApi("/(app)/admin/dashboard");

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

const PAGE_SIZE = 10;

export default function CandidateDirectory() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: "/admin/dashboard" });

	const name = search.name ?? "";
	const position = search.position ?? "";
	const stage = search.stage ? (search.stage as Stage) : undefined;
	const page = search.page ?? 1;

	// Local input state for debounced fields
	const [localName, setLocalName] = useState(name);
	const [localPosition, setLocalPosition] = useState(position);

	// Sync local state when URL changes externally
	const nameRef = useRef(name);
	const posRef = useRef(position);
	useEffect(() => {
		if (name !== nameRef.current) {
			nameRef.current = name;
			setLocalName(name);
		}
	}, [name]);
	useEffect(() => {
		if (position !== posRef.current) {
			posRef.current = position;
			setLocalPosition(position);
		}
	}, [position]);

	// Debounce timers
	const nameTimerRef = useRef(-1);
	const posTimerRef = useRef(-1);

	// Cleanup debounce timers on unmount
	useEffect(() => {
		return () => {
			clearTimeout(nameTimerRef.current);
			clearTimeout(posTimerRef.current);
		};
	}, []);

	const updateSearch = useCallback(
		(partial: Record<string, unknown>) => {
			const merged = { ...search, ...partial };
			// Strip empty strings and omit page=1 (the default)
			const clean: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(merged)) {
				if (v === "" || v === undefined || v === null) continue;
				if (k === "page" && v === 1) continue;
				clean[k] = v;
			}
			navigate({ search: clean as typeof search, replace: true });
		},
		[navigate, search],
	);

	const handleNameChange = useCallback(
		(value: string) => {
			setLocalName(value);
			clearTimeout(nameTimerRef.current);
			nameTimerRef.current = window.setTimeout(() => {
				updateSearch({ name: value, page: 1 });
			}, 300);
		},
		[updateSearch],
	);

	const handlePositionChange = useCallback(
		(value: string) => {
			setLocalPosition(value);
			clearTimeout(posTimerRef.current);
			posTimerRef.current = window.setTimeout(() => {
				updateSearch({ position: value, page: 1 });
			}, 300);
		},
		[updateSearch],
	);

	const handleStageChange = useCallback(
		(value: string | null) => {
			updateSearch({
				stage: value && value !== "__all__" ? value : undefined,
				page: 1,
			});
		},
		[updateSearch],
	);
	const handleClearFilters = useCallback(() => {
		clearTimeout(nameTimerRef.current);
		clearTimeout(posTimerRef.current);
		setLocalName("");
		setLocalPosition("");
		updateSearch({
			name: undefined,
			position: undefined,
			stage: undefined,
			page: 1,
		});
	}, [updateSearch]);

	const [editingCandidateId, setEditingCandidateId] =
		useState<Id<"candidates"> | null>(null);

	// --- Delete state ---
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [deleteTarget, setDeleteTarget] = useState<{
		ids: Id<"candidates">[];
		names: string[];
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Clear selection on page/filter changes
	const filterKey = `${page}|${search.name ?? ""}|${search.position ?? ""}|${search.stage ?? ""}`;
	const filterKeyRef = useRef(filterKey);
	useEffect(() => {
		if (filterKey !== filterKeyRef.current) {
			filterKeyRef.current = filterKey;
			setRowSelection({});
		}
	}, [filterKey]);

	const result = useQuery(api.candidates.listCandidates, {
		name: search.name || undefined,
		positionDept: search.position || undefined,
		stage: (search.stage as Stage) || undefined,
		page,
		pageSize: PAGE_SIZE,
	});

	const columns: ColumnDef<Candidate, unknown>[] = useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						indeterminate={table.getIsSomePageRowsSelected()}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label={`Select ${row.original.fullName}`}
					/>
				),
				size: 40,
				enableSorting: false,
				enableHiding: false,
			},
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
							<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							{row.original.offeredDepartment}
						</div>
					</div>
				),
			},
			{
				accessorKey: "currentStage",
				header: "CURRENT STAGE",
				cell: ({ row }) => (
					<span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium text-sm">
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
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
							onClick={() => setEditingCandidateId(row.original._id)}
						>
							<IconPencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
							onClick={() =>
								setDeleteTarget({
									ids: [row.original._id],
									names: [row.original.fullName],
								})
							}
						>
							<IconTrash className="size-4" />
						</Button>
					</div>
				),
			},
		],
		[],
	);

	const isLoading = result === undefined;
	const items = result?.items ?? [];
	const totalCount = result?.totalCount ?? 0;
	const totalPages = result?.totalPages ?? 0;

	const table = useReactTable({
		data: items,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row._id,
		onRowSelectionChange: setRowSelection,
		state: { rowSelection },
	});

	const selectedRows = table.getSelectedRowModel().rows;
	const selectedCount = selectedRows.length;

	const hasActiveFilters = !!(search.name || search.position || search.stage);
	const startIdx = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const endIdx = Math.min(page * PAGE_SIZE, totalCount);

	// --- Delete mutation ---
	const deleteCandidates = useMutation(api.candidates.deleteCandidates);

	const handleConfirmDelete = async () => {
		if (!deleteTarget || isDeleting) return;
		setIsDeleting(true);
		const ids = deleteTarget.ids;
		const count = ids.length;
		try {
			await deleteCandidates({ candidateIds: ids });
			toast.success(
				`Deleted ${count === 1 ? "candidate" : `${count} candidates`}.`,
			);
			setDeleteTarget(null);
			setRowSelection({});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to delete");
			// Keep selection usable for retry
		} finally {
			setIsDeleting(false);
		}
	};

	const isBulkMode = selectedCount > 0;

	return (
		<div className="space-y-4">
			{/* Filter toolbar */}
			<div className="flex flex-col gap-3 md:flex-row md:items-center">
				<div className="relative flex-1">
					<IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name…"
						className="pl-9"
						value={localName}
						onChange={(e) => handleNameChange(e.target.value)}
					/>
				</div>
				<div className="relative flex-1">
					<IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Position or department…"
						className="pl-9"
						value={localPosition}
						onChange={(e) => handlePositionChange(e.target.value)}
					/>
				</div>
				<Select value={stage ?? "All Stages"} onValueChange={handleStageChange}>
					<SelectTrigger className="w-full md:w-[200px]">
						<SelectValue placeholder="All stages" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All stages</SelectItem>
						{STAGES.map((s) => (
							<SelectItem key={s} value={s}>
								{s}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasActiveFilters && (
					<Button
						variant="outline"
						size="sm"
						className="shrink-0"
						onClick={handleClearFilters}
					>
						<IconX className="size-4" />
						<span>Clear filters</span>
					</Button>
				)}
			</div>

			{/* Bulk action bar */}
			{isBulkMode && (
				<div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-2">
					<p className="text-slate-600 text-sm">
						<span className="font-semibold">{selectedCount}</span> selected
					</p>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => {
							const ids = selectedRows.map((r) => r.original._id);
							const names = selectedRows.map((r) => r.original.fullName);
							setDeleteTarget({ ids, names });
						}}
					>
						<IconTrash className="mr-1 size-4" />
						Delete selected
					</Button>
				</div>
			)}

			{/* Table */}
			<div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
				{isLoading ? (
					<div className="p-8 text-center text-muted-foreground">
						Loading candidates…
					</div>
				) : items.length === 0 ? (
					<div className="p-8 text-center text-muted-foreground">
						{hasActiveFilters
							? "No candidates match your filters."
							: "No candidates yet. Add one to get started."}
					</div>
				) : (
					<Table>
						<TableHeader className="bg-slate-50/80">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="border-b">
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider"
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
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			{/* Pagination */}
			{!isLoading && totalCount > 0 && (
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						Showing {startIdx}–{endIdx} of {totalCount}
					</p>
					{totalPages > 1 && (
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										text="Previous"
										onClick={() =>
											updateSearch({ page: Math.max(1, page - 1) })
										}
										aria-disabled={page <= 1}
										tabIndex={page <= 1 ? -1 : undefined}
										className={
											page <= 1
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter(
										(p) =>
											p === 1 || p === totalPages || Math.abs(p - page) <= 1,
									)
									.reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
										if (i > 0 && p - (arr[i - 1] as number) > 1) {
											acc.push("ellipsis");
										}
										acc.push(p);
										return acc;
									}, [])
									.map((item, i) =>
										item === "ellipsis" ? (
											<PaginationItem key={`e-${i}`}>
												<span className="px-2 text-muted-foreground">…</span>
											</PaginationItem>
										) : (
											<PaginationItem key={item}>
												<PaginationLink
													isActive={item === page}
													onClick={() => updateSearch({ page: item })}
													className="cursor-pointer"
												>
													{item}
												</PaginationLink>
											</PaginationItem>
										),
									)}
								<PaginationItem>
									<PaginationNext
										text="Next"
										onClick={() =>
											updateSearch({
												page: Math.min(totalPages, page + 1),
											})
										}
										aria-disabled={page >= totalPages}
										tabIndex={page >= totalPages ? -1 : undefined}
										className={
											page >= totalPages
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</div>
			)}

			<EditCandidateModal
				candidateId={editingCandidateId}
				open={editingCandidateId !== null}
				onClose={() => setEditingCandidateId(null)}
			/>

			{/* Delete confirmation dialog */}
			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						if (isDeleting) return; // block close while deleting
						setDeleteTarget(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{deleteTarget && deleteTarget.ids.length === 1
								? `Delete ${deleteTarget.names[0]}?`
								: `Delete ${deleteTarget?.ids.length ?? 0} candidates?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							Permanently removes profile, stage history, and login. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{isDeleting ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
