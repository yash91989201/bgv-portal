# Complex / Nested Form Implementation Instructions

This document explains how to implement **nested or multi-section forms** using **TanStack Form**, **Zod**, and **custom form components**.

---

## 📂 Project Structure

- **Schemas** → `apps/web/src/lib/schemas/`
- **Types** → `apps/web/src/lib/types/` (inferred with `z.infer`)
- **Subcomponents** → each section in its own component (optional, or inline in same file).

---

## 🧩 Schema & Types

- Define schemas in `apps/web/src/lib/schemas/`.
- Always suffix with `FormSchema` (e.g., `CreateChannelFormSchema`, `ProjectFormSchema`).
- Export inferred types in `apps/web/src/lib/types` (auto-generated from schemas):

```ts
export type CreateChannelFormType = z.infer<typeof CreateChannelFormSchema>;
```

For nested objects and arrays:

```ts
const schema = z.object({
  name: z.string().min(1),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }),
  users: z.array(z.object({
    email: z.email(),
  })).min(1).max(5),
});
```

---

## 🛠 Setup with useAppForm

At the root component:

```ts
const form = useAppForm({
  defaultValues: {
    name: "",
    users: [{ email: "" }],
  } satisfies ProjectFormType as ProjectFormType,
  validators: {
    onSubmit: ProjectFormSchema,
  },
  onSubmit: async ({ value }) => {
    // Handle submission
  },
});
```

**No useFormContext needed** - TanStack Form automatically provides context to nested fields via `form.AppField`.

---

## 🧱 Dynamic Arrays (useFieldArray pattern)

Use `form.Field` with `mode="array"` for dynamic lists:

```tsx
<form.Field mode="array" name="users">
  {(field) => (
    <div>
      <Button
        type="button"
        onClick={() => field.pushValue({ email: "" })}
      >
        Add User
      </Button>
      
      {field.state.value.map((_, index) => (
        <form.Field key={index} name={`users[${index}].email`}>
          {(innerField) => (
            <div>
              <field.Input
                label={`User ${index + 1} Email`}
              />
              <Button
                type="button"
                onClick={() => field.removeValue(index)}
              >
                Remove
              </Button>
            </div>
          )}
        </form.Field>
      ))}
    </div>
  )}
</form.Field>
```

**Important**: Always use `field.pushValue()` and `field.removeValue()` for array operations.

---

## 🔄 Mutations & Submissions

- Use `useMutation(queryUtils.*.mutationOptions())`.
- Transform form data in `onSubmit` if necessary (e.g., generating IDs, aggregating totals).
- Use `queryClient.refetchQueries()` or `queryClient.invalidateQueries()` after mutations.

```tsx
const { mutateAsync: createChannel } = useMutation(
  queryUtils.communication.channel.create.mutationOptions({
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: queryUtils.communication.channel.list.queryKey({ input: {} }),
      });
      toast.success("Channel created successfully");
      form.reset();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed");
    },
  })
);
```

---

## 🔒 UX Rules

1. **Buttons**
   - Default is submit → omit `type` when intended for form submission.
   - Use `type="button"` for add/remove/cancel actions.
   - Use `type="reset"` for resets.
2. **Nested Fields** → use dot notation: `"notifications.email"`, `"users[0].email"`.
3. **Field Grouping** → use `<FieldGroup>` and `<FieldSet>` for visual organization.
4. **Validation & Messages** → errors are automatically shown by field components.

---

## 📝 Boilerplate (Complex Form with Arrays)

```tsx
import { IconX } from "@tabler/icons-react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@work-holo/ui/components/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@work-holo/ui/components/field";
import { useAppForm } from "@work-holo/ui/components/form/hooks";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@work-holo/ui/components/input-group";
import { SelectItem } from "@work-holo/ui/components/select";
import { Spinner } from "@work-holo/ui/components/spinner";
import { queryUtils } from "@/utils/orpc";

export const PROJECT_STATUSES = ["draft", "active", "finished"] as const;

export const ProjectFormSchema = z.object({
  name: z.string().min(1),
  status: z.enum(PROJECT_STATUSES),
  description: z.string().transform((v) => v || undefined),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
  users: z
    .array(z.object({ email: z.email() }))
    .min(1, "At least one user is required")
    .max(5, "Maximum 5 users allowed"),
});

type ProjectFormType = z.infer<typeof ProjectFormSchema>;

export function ProjectForm() {
  const { mutateAsync: createProject } = useMutation(
    queryUtils.project.create.mutationOptions({
      onSuccess: () => {
        toast.success("Project created successfully");
        form.reset();
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
      users: [{ email: "" }],
      status: "draft",
      notifications: {
        email: false,
        sms: false,
        push: false,
      },
    } satisfies ProjectFormType as ProjectFormType,
    validators: {
      onSubmit: ProjectFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createProject(value);
    },
  });

  return (
    <form.AppForm>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {/* Simple text input */}
          <form.AppField name="name">
            {(field) => <field.Input label="Project Name" />}
          </form.AppField>

          {/* Select dropdown */}
          <form.AppField name="status">
            {(field) => (
              <field.Select label="Status">
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </form.AppField>

          {/* Textarea */}
          <form.AppField name="description">
            {(field) => (
              <field.Textarea
                description="Be as detailed as possible"
                label="Description"
              />
            )}
          </form.AppField>

          {/* Nested object fields (checkboxes) */}
          <FieldSet>
            <FieldContent>
              <FieldLegend>Notifications</FieldLegend>
              <FieldDescription>
                Select how you would like to receive notifications.
              </FieldDescription>
            </FieldContent>
            <FieldGroup data-slot="checkbox-group">
              <form.AppField name="notifications.email">
                {(field) => <field.Checkbox label="Email" />}
              </form.AppField>
              <form.AppField name="notifications.sms">
                {(field) => <field.Checkbox label="Text" />}
              </form.AppField>
              <form.AppField name="notifications.push">
                {(field) => <field.Checkbox label="In App" />}
              </form.AppField>
            </FieldGroup>
          </FieldSet>

          {/* Dynamic array fields */}
          <form.Field mode="array" name="users">
            {(field) => (
              <FieldSet>
                <div className="flex items-center justify-between gap-2">
                  <FieldContent>
                    <FieldLegend className="mb-0" variant="label">
                      User Email Addresses
                    </FieldLegend>
                    <FieldDescription>
                      Add up to 5 users to this project (including yourself).
                    </FieldDescription>
                    {field.state.meta.errors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldContent>
                  <Button
                    onClick={() => field.pushValue({ email: "" })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Add User
                  </Button>
                </div>
                <FieldGroup>
                  {field.state.value.map((_, index) => (
                    <form.Field
                      key={index.toString()}
                      name={`users[${index}].email`}
                    >
                      {(innerField) => {
                        const isInvalid =
                          innerField.state.meta.isTouched &&
                          !innerField.state.meta.isValid;
                        return (
                          <Field
                            data-invalid={isInvalid}
                            orientation="horizontal"
                          >
                            <FieldContent>
                              <InputGroup>
                                <InputGroupInput
                                  aria-invalid={isInvalid}
                                  aria-label={`User ${index + 1} email`}
                                  id={innerField.name}
                                  onBlur={innerField.handleBlur}
                                  onChange={(e) =>
                                    innerField.handleChange(e.target.value)
                                  }
                                  type="email"
                                  value={innerField.state.value}
                                />
                                {field.state.value.length > 1 && (
                                  <InputGroupAddon align="inline-end">
                                    <InputGroupButton
                                      aria-label={`Remove User ${index + 1}`}
                                      onClick={() => field.removeValue(index)}
                                      size="icon-xs"
                                      type="button"
                                      variant="ghost"
                                    >
                                      <IconX />
                                    </InputGroupButton>
                                  </InputGroupAddon>
                                )}
                              </InputGroup>
                              {isInvalid && (
                                <FieldError
                                  errors={innerField.state.meta.errors}
                                />
                              )}
                            </FieldContent>
                          </Field>
                        );
                      }}
                    </form.Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            )}
          </form.Field>

          {/* Submit button with loading state */}
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isValidating,
              state.isSubmitting,
            ]}
          >
            {([canSubmit, isValidating, isSubmitting]) => (
              <Button
                disabled={!canSubmit || isValidating || isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>
    </form.AppForm>
  );
}
```

---

## 🎯 Advanced Patterns

### Custom Array Item Rendering

For more complex array items, you can use custom field components or manual validation checks:

```tsx
<form.Field mode="array" name="questions">
  {(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    
    return (
      <FieldSet data-invalid={isInvalid}>
        <FieldLegend>Questions</FieldLegend>
        {field.state.value.map((_, index) => (
          <div key={index} className="space-y-2">
            <form.Field name={`questions[${index}].text`}>
              {(innerField) => <innerField.Input label={`Question ${index + 1}`} />}
            </form.Field>
            <form.Field name={`questions[${index}].type`}>
              {(innerField) => (
                <innerField.Select label="Type">
                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </innerField.Select>
              )}
            </form.Field>
            <Button type="button" onClick={() => field.removeValue(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={() => field.pushValue({ text: "", type: "multiple" })}>
          Add Question
        </Button>
      </FieldSet>
    );
  }}
</form.Field>
```

### Conditional Fields Based on State

Use `useStore` from `@tanstack/react-store` to reactively access form state:

```tsx
import { useStore } from "@tanstack/react-store";

const channelType = useStore(form.store, (state) => state.values.type);

{channelType === "team" ? (
  <TeamSelect form={form} />
) : (
  <GroupSelect form={form} />
)}
```

### Multiple Checkboxes for Array Field

When you need checkboxes to populate an array:

```tsx
<form.AppField mode="array" name="modules">
  {(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
      <FieldSet data-invalid={isInvalid}>
        <FieldLegend variant="label">Select Modules</FieldLegend>
        <div className="space-y-3" data-slot="checkbox-group">
          {availableModules.map((module) => {
            const isChecked = (field.state.value ?? []).includes(module.id);
            const checkboxId = `module-${module.id}`;

            return (
              <div className="flex items-center space-x-3" key={module.id}>
                <Checkbox
                  checked={isChecked}
                  id={checkboxId}
                  onCheckedChange={(checked) => {
                    const current = field.state.value ?? [];
                    const next = checked
                      ? [...current, module.id]
                      : current.filter((v) => v !== module.id);
                    field.handleChange(next);
                  }}
                />
                <Label className="font-normal text-sm" htmlFor={checkboxId}>
                  {module.name}
                </Label>
              </div>
            );
          })}
        </div>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    );
  }}
</form.AppField>
```
