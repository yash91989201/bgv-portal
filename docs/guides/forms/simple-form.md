# Simple Form Implementation Instructions

This document explains how to implement **simple forms** (single component forms) using **TanStack Form**, **Zod**, and **custom form components**.

---

## 📂 Project Structure

- **Schemas** → `apps/web/src/lib/schemas/`
- **Types** → `apps/web/src/lib/types/` (inferred with `z.infer`)
- **Form Components** → co-located in feature folders

---

## 🧩 Schema & Types

- Define schemas in `apps/web/src/lib/schemas/`.
- Always suffix with `FormSchema` (e.g., `LogInFormSchema`, `CreateOrgFormSchema`).
- Export inferred types in `apps/web/src/lib/types` (auto-generated from schemas):

```ts
export type LogInFormType = z.infer<typeof LogInFormSchema>;
```

---

## 🛠 Setup with useAppForm

Import the custom form hook:

```ts
import { useAppForm } from "@work-holo/ui/components/form/hooks";
```

Initialize the form:

```ts
const form = useAppForm({
  defaultValues: {
    email: "",
    password: "",
  } satisfies LogInFormType as LogInFormType,
  validators: {
    onSubmit: LogInFormSchema,
  },
  onSubmit: async ({ value }) => {
    // Handle form submission
  },
});
```

Wrap with `<form.AppForm>`:

```tsx
<form.AppForm>
  <form onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}>
    {/* fields */}
  </form>
</form.AppForm>
```

---

## 🔄 Mutations & Submissions

- Always use `useMutation` with `queryUtils.*.mutationOptions()`.
- Handle side effects (`toast`, `invalidateQueries`, `navigate`) in mutation callbacks.
- For auth operations, use `authClient` directly.

---

## 🔒 UX Rules

1. **Buttons**
   - `<button>` defaults to `type="submit"`.
   - Use `type="button"` for non-submit actions (e.g., cancel, add).
   - Use `type="reset"` for reset actions.
   - Omit `type` when the button should submit the form.
2. **Validation** → errors are automatically displayed via `FormBase` wrapper.
3. **Loading state** → use `form.Subscribe` to access `canSubmit`, `isSubmitting`, `isValidating`.
4. **Reset** → call `form.reset()` after successful submission or pass handler to `onReset` prop.

---

## 📝 Available Form Field Components

The custom form wrapper provides these field components:

- `field.Input` - Text input
- `field.Textarea` - Textarea
- `field.Select` - Select dropdown
- `field.Checkbox` - Checkbox
- `field.FileInput` - File upload (single or multiple)
- `field.InputGroup` - Input with addons
- `field.InputGroupInput` - Input within InputGroup
- `field.InputGroupTextarea` - Textarea within InputGroup
- `field.InputGroupSpinner` - Shows spinner when field is validating

All field components accept:

- `label` (required) - Field label
- `description` (optional) - Help text below label
- Plus all standard HTML input props

---

## 📝 Boilerplate (Simple Form)

```tsx
import { formOptions } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@work-holo/ui/components/button";
import { FieldGroup } from "@work-holo/ui/components/field";
import { useAppForm } from "@work-holo/ui/components/form/hooks";
import { Spinner } from "@work-holo/ui/components/spinner";
import { ExampleFormSchema } from "@/lib/schemas/example";
import type { ExampleFormType } from "@/lib/types";
import { queryUtils } from "@/utils/orpc";

const formOpts = formOptions({
  defaultValues: {
    name: "",
    email: "",
  } satisfies ExampleFormType as ExampleFormType,
});

export function ExampleForm() {
  const navigate = useNavigate();

  const { mutateAsync: createExample } = useMutation(
    queryUtils.example.create.mutationOptions({
      onSuccess: () => {
        toast.success("Form submitted successfully");
        form.reset();
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Submission failed");
      },
    })
  );

  const form = useAppForm({
    ...formOpts,
    validators: {
      onSubmit: ExampleFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createExample(value);
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
          <form.AppField name="name">
            {(field) => (
              <field.Input
                label="Name"
                placeholder="Enter name"
              />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.Input
                label="Email"
                placeholder="Enter email"
                type="email"
              />
            )}
          </form.AppField>

          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isValidating,
              state.isSubmitting,
            ]}
          >
            {([canSubmit, isValidating, isSubmitting]) => (
              <Button
                className="w-full gap-1.5"
                disabled={!canSubmit || isValidating || isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Submitting...
                  </>
                ) : (
                  "Submit"
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

## 🎯 Key Patterns

### Error Handling in onSubmit

```tsx
onSubmit: async ({ value }) => {
  try {
    await createExample(value);
  } catch (err) {
    form.setFieldMeta("email", (prev) => ({
      ...prev,
      errorMap: {
        onSubmit: err instanceof Error ? err.message : "Submission failed",
      },
    }));
  }
}
```

### Async Validation

Use Zod's `.refine()` with async functions:

```ts
const schema = z.object({
  username: z.string()
    .min(3)
    .refine(async (val) => {
      const { data } = await checkAvailability(val);
      return data?.available ?? false;
    }, {
      message: "Username already taken",
    }),
});
```

### Conditional Validation

Use `.refine()` for cross-field validation:

```ts
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```
