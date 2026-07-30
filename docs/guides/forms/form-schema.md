# Form Schema Design Instructions

This document explains how to design and organize **schemas and types** for forms using **Zod** and how they integrate with **React Hook Form**.

---

## 📂 Project Structure

- **Schemas** → `src/lib/schemas/`
- **Types** → `src/lib/types/` (inferred with `z.infer`)
- **Form Components** → reference schemas + types

---

## 🧩 Naming Conventions

- Always suffix with `FormSchema`.
  - ✅ `LogInFormSchema`
  - ✅ `CreateFeedbackFormSchema`
  - ✅ `CreateExamFormSchema`

- Corresponding inferred types should be suffixed with `FormType`.
  - ✅ `LogInFormType`
  - ✅ `CreateFeedbackFormType`
  - ✅ `CreateExamFormSchemaType`

---

## 🛠 Schema Rules

1. **Inputs**
   - Always validate inputs with `zod`.
   - Use `.min()`, `.max()`, `.nonempty()`, `.email()`, etc. for meaningful validation.

2. **Nested Structures**
   - Use nested `z.object` and `z.array` for complex forms.

3. **Form State**
   - Add auxiliary state inside schema when needed.

---

## 📝 Inferred Types

Types are **automatically generated** from schemas using the project's auto type generator:

- The generator detects all Zod schemas in `src/lib/schemas/`
- It creates TypeScript types using `z.infer<typeof SchemaName>`
- All types are consolidated in `src/lib/types.ts`
- Import types directly from `@/lib/types` - never modify this file manually

Always infer types from schemas:

```ts
export type LogInFormType = z.infer<typeof LogInFormSchema>;
export type CreateExamFormSchemaType = z.infer<typeof CreateExamFormSchema>;
```

This ensures:

- Type safety inside `useForm<T>()`.
- Autocompletion for fields.
- Types always stay in sync with schemas.

---

## 🔄 Integration with React Hook Form

When defining a form:

```ts
const form = useForm<LogInFormType>({
  resolver: standardSchemaResolver(LogInFormSchema),
});
```

This guarantees:

- All validation is synced with Zod.
- No raw `z.*` calls inside components.

---

## ✅ Best Practices Summary

- Schemas live in `src/lib/schemas/`
- Types live in `src/lib/types/`
- Always suffix with `FormSchema` and `FormType`.
- Infer types with `z.infer` (never manually type fields).
- Nested schemas allowed for arrays/objects.
- Auxiliary state may also be modeled in the schema.
- Never define schema directly in components → always import.
