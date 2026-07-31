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
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import {
	createCandidateFormSchema,
	type CreateCandidateForm,
} from "@/lib/candidate-schemas";

type FieldName = keyof CreateCandidateForm;

const FIELDS: {
	group: string;
	items: { name: FieldName; label: string; type?: string }[];
}[] = [
	{
		group: "Credentials",
		items: [
			{ name: "username", label: "Username" },
			{ name: "password", label: "Password", type: "password" },
		],
	},
	{
		group: "Personal Information",
		items: [
			{ name: "fullName", label: "Full Name" },
			{ name: "email", label: "Email", type: "email" },
			{ name: "mobileNumber", label: "Mobile Number" },
			{ name: "currentLocation", label: "Current Location" },
		],
	},
	{
		group: "Professional Information",
		items: [
			{ name: "totalExperience", label: "Total Experience" },
			{ name: "currentDesignation", label: "Current Designation" },
			{ name: "currentDepartment", label: "Current Department" },
			{ name: "currentSalary", label: "Current Salary", type: "number" },
		],
	},
	{
		group: "Application Details",
		items: [
			{ name: "designationAppliedFor", label: "Designation Applied For" },
			{ name: "offeredDepartment", label: "Offered Department" },
			{ name: "expectedLocation", label: "Expected Location" },
			{ name: "salaryOffered", label: "Salary Offered", type: "number" },
		],
	},
];

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
					<Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-4 text-xs font-semibold uppercase tracking-wider" />
				}
			>
				+ ADD CANDIDATE
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add Candidate</DialogTitle>
					<DialogDescription>
						Create a new candidate profile and account.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-6"
				>
					{FIELDS.map(({ group, items }) => (
						<FieldSet key={group}>
							<FieldLegend>{group}</FieldLegend>
							{items.map(({ name, label, type }) => (
								<form.Field key={name} name={name}>
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldContent>
													<FieldLabel htmlFor={name}>{label}</FieldLabel>
												</FieldContent>
												<Input
													id={name}
													type={type ?? "text"}
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
												{isInvalid && field.state.meta.errors.length > 0 && (
													<FieldError
														errors={field.state.meta.errors.map((e) =>
															typeof e === "string" ? { message: e } : e,
														)}
													/>
												)}
											</Field>
										);
									}}
								</form.Field>
							))}
						</FieldSet>
					))}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Create</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
