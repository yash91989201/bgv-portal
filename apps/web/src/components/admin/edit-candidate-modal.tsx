import { api } from "@bgv-portal/backend/convex/_generated/api";
import type { Id } from "@bgv-portal/backend/convex/_generated/dataModel";
import {
	laterStages,
	STAGES,
	stageIndex,
	type Stage,
} from "@bgv-portal/backend/convex/lib/stages";
import { Button } from "@bgv-portal/ui/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@bgv-portal/ui/components/dialog";
import {
	Field,
	FieldContent,
	FieldLabel,
} from "@bgv-portal/ui/components/field";
import { Input } from "@bgv-portal/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@bgv-portal/ui/components/select";
import { Separator } from "@bgv-portal/ui/components/separator";
import { Textarea } from "@bgv-portal/ui/components/textarea";
import { IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EditForm = {
	fullName: string;
	email: string;
	mobileNumber: string;
	currentLocation: string;
	totalExperience: string;
	currentDesignation: string;
	currentDepartment: string;
	currentSalary: number;
	designationAppliedFor: string;
	offeredDepartment: string;
	expectedLocation: string;
	salaryOffered: number;
	currentStage: Stage;
	adminRemarks: string;
};

type FieldItem = {
	key: keyof EditForm;
	label: string;
	type?: string;
};

type FieldRow = FieldItem[];

type FieldSection = {
	group: string;
	rows: FieldRow[];
};

const SECTIONS: FieldSection[] = [
	{
		group: "PERSONAL INFO",
		rows: [
			[
				{ key: "fullName", label: "FULL NAME" },
				{ key: "email", label: "EMAIL ADDRESS", type: "email" },
				{ key: "mobileNumber", label: "MOBILE NUMBER" },
			],
			[{ key: "currentLocation", label: "CURRENT LOCATION" }],
		],
	},
	{
		group: "PROFESSIONAL INFO",
		rows: [
			[
				{ key: "totalExperience", label: "TOTAL EXPERIENCE" },
				{ key: "currentDesignation", label: "CURRENT DESIGNATION" },
				{ key: "currentDepartment", label: "CURRENT DEPARTMENT" },
			],
			[{ key: "currentSalary", label: "CURRENT SALARY", type: "number" }],
		],
	},
	{
		group: "APPLICATION INFO",
		rows: [
			[
				{ key: "designationAppliedFor", label: "DESIGNATION APPLIED FOR" },
				{ key: "offeredDepartment", label: "OFFERED DEPARTMENT" },
				{ key: "expectedLocation", label: "EXPECTED LOCATION" },
			],
			[{ key: "salaryOffered", label: "SALARY OFFERED", type: "number" }],
		],
	},
	{
		group: "ATS STATUS & LOGIN",
		rows: [],
	},
];

const inputClassName =
	"h-9 rounded-md border-slate-200 bg-slate-50 text-sm focus-visible:border-slate-400 focus-visible:ring-slate-400/30";

export default function EditCandidateModal({
	candidateId,
	open,
	onClose,
}: {
	candidateId: Id<"candidates"> | null;
	open: boolean;
	onClose: () => void;
}) {
	const candidate = useQuery(
		api.candidates.getCandidate,
		candidateId ? { candidateId } : "skip",
	);
	const updateCandidateInfo = useMutation(api.candidates.updateCandidateInfo);
	const updateStage = useMutation(api.candidates.updateStage);

	const [form, setForm] = useState<EditForm>({
		fullName: "",
		email: "",
		mobileNumber: "",
		currentLocation: "",
		totalExperience: "",
		currentDesignation: "",
		currentDepartment: "",
		currentSalary: 0,
		designationAppliedFor: "",
		offeredDepartment: "",
		expectedLocation: "",
		salaryOffered: 0,
		currentStage: "Application Submitted",
		adminRemarks: "",
	});
	const [saving, setSaving] = useState(false);

	// Populate form when candidate data loads
	useEffect(() => {
		if (candidate) {
			setForm({
				fullName: candidate.fullName,
				email: candidate.email,
				mobileNumber: candidate.mobileNumber,
				currentLocation: candidate.currentLocation,
				totalExperience: candidate.totalExperience,
				currentDesignation: candidate.currentDesignation,
				currentDepartment: candidate.currentDepartment,
				currentSalary: candidate.currentSalary,
				designationAppliedFor: candidate.designationAppliedFor,
				offeredDepartment: candidate.offeredDepartment,
				expectedLocation: candidate.expectedLocation,
				salaryOffered: candidate.salaryOffered,
				currentStage: candidate.currentStage,
				adminRemarks: candidate.adminRemarks ?? "",
			});
		}
	}, [candidate]);

	const availableStages = candidate ? laterStages(candidate.currentStage) : [];

	const handleChange = (key: keyof EditForm, value: string | number) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		if (!candidateId || !candidate) return;
		setSaving(true);
		try {
			await updateCandidateInfo({
				candidateId,
				fullName: form.fullName,
				email: form.email,
				mobileNumber: form.mobileNumber,
				currentLocation: form.currentLocation,
				totalExperience: form.totalExperience,
				currentDesignation: form.currentDesignation,
				currentDepartment: form.currentDepartment,
				currentSalary: form.currentSalary,
				designationAppliedFor: form.designationAppliedFor,
				offeredDepartment: form.offeredDepartment,
				expectedLocation: form.expectedLocation,
				salaryOffered: form.salaryOffered,
				adminRemarks: form.adminRemarks || undefined,
			});

			if (form.currentStage !== candidate.currentStage) {
				await updateStage({
					candidateId,
					newStage: form.currentStage,
					note: form.adminRemarks || undefined,
				});
			}

			toast.success("Profile updated");
			onClose();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update profile",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
			>
				{/* Dark blue title bar */}
				<DialogHeader className="relative shrink-0 gap-3 border-slate-900 border-b bg-slate-900 px-6 py-5">
					<DialogTitle className="font-bold text-base text-white uppercase tracking-wide">
						EDIT CANDIDATE PROFILE
					</DialogTitle>
					<DialogDescription className="sr-only">
						Edit candidate profile information.
					</DialogDescription>
					<DialogClose
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								className="absolute top-4 right-4 text-white hover:bg-white/10 hover:text-white"
							/>
						}
					>
						<IconX className="size-4" />
						<span className="sr-only">Close</span>
					</DialogClose>
				</DialogHeader>

				<div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
					{/* Info sections */}
					{SECTIONS.filter((s) => s.group !== "ATS STATUS & LOGIN").map(
						({ group, rows }) => (
							<div key={group} className="space-y-4">
								<div>
									<h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
										{group}
									</h3>
									<Separator className="mt-2" />
								</div>
								{rows.map((row, ri) => (
									<div
										key={`${group}-${ri}`}
										className="grid grid-cols-1 gap-4 sm:grid-cols-3"
									>
										{row.map(({ key, label, type }) => (
											<Field key={key} className="gap-1.5">
												<FieldContent>
													<FieldLabel
														htmlFor={key}
														className="font-medium text-[11px] text-slate-500 uppercase tracking-wider"
													>
														{label}
													</FieldLabel>
												</FieldContent>
												<Input
													id={key}
													type={type ?? "text"}
													className={inputClassName}
													value={String(form[key])}
													onChange={(e) =>
														handleChange(
															key,
															type === "number"
																? Number(e.target.value) || 0
																: e.target.value,
														)
													}
												/>
											</Field>
										))}
									</div>
								))}
							</div>
						),
					)}

					{/* ATS STATUS & LOGIN */}
					<div className="space-y-4">
						<div>
							<h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
								ATS STATUS & LOGIN
							</h3>
							<Separator className="mt-2" />
						</div>

						{/* Current Stage */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<Field className="gap-1.5">
								<FieldContent>
									<FieldLabel className="font-medium text-[11px] text-slate-500 uppercase tracking-wider">
										CURRENT STAGE
									</FieldLabel>
								</FieldContent>
								{availableStages.length > 0 ? (
									<Select
										value={form.currentStage}
										onValueChange={(v) => {
											if (v) handleChange("currentStage", v as Stage);
										}}
									>
										<SelectTrigger className={inputClassName}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STAGES.map((s) => (
												<SelectItem
													key={s}
													value={s}
													disabled={
														stageIndex(s) <
														stageIndex(candidate?.currentStage ?? s)
													}
												>
													{s}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										className={inputClassName}
										value={form.currentStage}
										disabled
									/>
								)}
							</Field>
						</div>

						{/* Admin Remarks */}
						<div className="grid grid-cols-1 gap-4">
							<Field className="gap-1.5">
								<FieldContent>
									<FieldLabel
										htmlFor="adminRemarks"
										className="font-medium text-[11px] text-slate-500 uppercase tracking-wider"
									>
										ADMIN REMARKS (INTERNAL)
									</FieldLabel>
								</FieldContent>
								<Textarea
									id="adminRemarks"
									className="min-h-20 rounded-md border-slate-200 bg-slate-50 text-sm focus-visible:border-slate-400 focus-visible:ring-slate-400/30"
									value={form.adminRemarks}
									onChange={(e) => handleChange("adminRemarks", e.target.value)}
									placeholder="Add internal notes about this candidate…"
								/>
							</Field>
						</div>
					</div>
				</div>

				<DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end">
					<Button
						type="button"
						variant="ghost"
						className="font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900"
						onClick={onClose}
					>
						CANCEL
					</Button>
					<Button
						type="button"
						className="bg-slate-900 font-semibold text-white uppercase tracking-wider hover:bg-slate-800"
						disabled={saving}
						onClick={handleSave}
					>
						{saving ? "SAVING…" : "SAVE PROFILE"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
