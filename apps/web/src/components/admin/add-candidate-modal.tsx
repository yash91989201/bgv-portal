import { api } from "@bgv-portal/backend/convex/_generated/api";
import { Button } from "@bgv-portal/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@bgv-portal/ui/components/dialog";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@bgv-portal/ui/components/field";
import { Input } from "@bgv-portal/ui/components/input";
import { Separator } from "@bgv-portal/ui/components/separator";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import {
	type CreateCandidateForm,
	createCandidateFormSchema,
} from "@/lib/candidate-schemas";

type FieldName = keyof CreateCandidateForm;

type FieldItem = {
	name: FieldName;
	label: string;
	type?: string;
};

type FieldRow = {
	cols: 3;
	items: FieldItem[];
};

type FieldSection = {
	group: string;
	rows: FieldRow[];
};

const SECTIONS: FieldSection[] = [
	{
		group: "PERSONAL INFO",
		rows: [
			{
				cols: 3,
				items: [
					{ name: "fullName", label: "FULL NAME" },
					{ name: "email", label: "EMAIL ADDRESS", type: "email" },
					{ name: "mobileNumber", label: "MOBILE NUMBER" },
				],
			},
			{
				cols: 3,
				items: [{ name: "currentLocation", label: "CURRENT LOCATION" }],
			},
		],
	},
	{
		group: "PROFESSIONAL INFO",
		rows: [
			{
				cols: 3,
				items: [
					{ name: "totalExperience", label: "TOTAL EXPERIENCE" },
					{ name: "currentDesignation", label: "CURRENT DESIGNATION" },
					{ name: "currentDepartment", label: "CURRENT DEPARTMENT" },
				],
			},
			{
				cols: 3,
				items: [
					{ name: "currentSalary", label: "CURRENT SALARY", type: "number" },
				],
			},
		],
	},
	{
		group: "APPLICATION INFO",
		rows: [
			{
				cols: 3,
				items: [
					{ name: "designationAppliedFor", label: "DESIGNATION APPLIED FOR" },
					{ name: "offeredDepartment", label: "OFFERED DEPARTMENT" },
					{ name: "expectedLocation", label: "EXPECTED LOCATION" },
				],
			},
			{
				cols: 3,
				items: [
					{ name: "salaryOffered", label: "SALARY OFFERED", type: "number" },
				],
			},
		],
	},
	{
		group: "INITIAL LOGIN SETUP (OPTIONAL)",
		rows: [
			{
				cols: 3,
				items: [
					{ name: "username", label: "CANDIDATE USERNAME" },
					{
						name: "password",
						label: "CANDIDATE PASSWORD",
						type: "password",
					},
				],
			},
		],
	},
];

const gridColsClass = {
	3: "grid-cols-1 sm:grid-cols-3",
} as const;

const inputClassName =
	"h-9 rounded-md border-slate-200 bg-slate-50 text-sm focus-visible:border-slate-400 focus-visible:ring-slate-400/30";

export default function AddCandidateModal() {
	const [open, setOpen] = useState(false);
	const createCandidate = useMutation(api.candidates.createCandidate);

	const form = useForm({
		defaultValues: {
			username: "",
			password: "",
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
		} satisfies CreateCandidateForm,
		validators: { onSubmit: createCandidateFormSchema },
		onSubmit: async ({ value }) => {
			try {
				await createCandidate(value);
				toast.success("Candidate created");
				setOpen(false);
				form.reset();
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Failed to create candidate";
				toast.error(msg);
			}
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button className="rounded-full bg-slate-900 px-4 font-semibold text-white text-xs uppercase tracking-wider hover:bg-slate-800" />
				}
			>
				+ ADD CANDIDATE
			</DialogTrigger>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="shrink-0 gap-3 border-slate-200 border-b px-6 py-5">
					<DialogTitle className="font-bold text-base text-slate-900 uppercase tracking-wide">
						NEW CANDIDATE PROFILE
					</DialogTitle>
					<DialogDescription className="sr-only">
						Create a new candidate profile and account.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex min-h-0 flex-1 flex-col"
				>
					<div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
						{SECTIONS.map(({ group, rows }) => (
							<FieldSet key={group} className="gap-4">
								<div>
									<FieldLegend className="mb-0 font-bold text-slate-900 text-sm uppercase tracking-wide">
										{group}
									</FieldLegend>
									<Separator className="mt-2" />
								</div>
								{rows.map((row) => (
									<div
										key={row.items.map((i) => i.name).join("-")}
										className={`grid gap-4 ${gridColsClass[row.cols]}`}
									>
										{row.items.map(({ name, label, type }) => (
											<form.Field key={name} name={name}>
												{(field) => {
													const isInvalid =
														field.state.meta.isTouched &&
														!field.state.meta.isValid;
													return (
														<Field data-invalid={isInvalid} className="gap-1.5">
															<FieldContent>
																<FieldLabel
																	htmlFor={name}
																	className="font-medium text-[11px] text-slate-500 uppercase tracking-wider"
																>
																	{label}
																</FieldLabel>
															</FieldContent>
															<Input
																id={name}
																type={type ?? "text"}
																className={inputClassName}
																value={String(field.state.value)}
																onChange={(e) =>
																	field.handleChange(
																		(type === "number"
																			? Number(e.target.value) || 0
																			: e.target.value) as never,
																	)
																}
																onBlur={field.handleBlur}
																aria-invalid={isInvalid}
															/>
															{isInvalid &&
																field.state.meta.errors.length > 0 && (
																	<FieldError
																		errors={field.state.meta.errors.map((e) =>
																			typeof e === "string"
																				? { message: e }
																				: e,
																		)}
																	/>
																)}
														</Field>
													);
												}}
											</form.Field>
										))}
									</div>
								))}
							</FieldSet>
						))}
					</div>

					<DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-slate-200 bg-slate-50 px-6 py-4 sm:justify-end">
						<Button
							type="button"
							variant="ghost"
							className="font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-900"
							onClick={() => setOpen(false)}
						>
							CANCEL
						</Button>
						<Button
							type="submit"
							className="rounded-md bg-[#0B1B33] px-5 font-semibold text-white uppercase tracking-wider hover:bg-[#0B1B33]/90"
						>
							CREATE CANDIDATE
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
