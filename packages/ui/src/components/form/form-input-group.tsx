import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "../input-group";
import { Spinner } from "../spinner";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

export {
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "../input-group";

type FormInputGroupProps = FormControlProps & {
  children: ReactNode;
  className?: string;
};

function FormInputGroup({
  children,
  className,
  ...props
}: FormInputGroupProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <InputGroup className={cn("overflow-hidden")} data-invalid={isInvalid}>
        {children}
      </InputGroup>
    </FormBase>
  );
}

type FormInputGroupInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "value" | "onChange" | "onBlur" | "name" | "id"
>;

function FormInputGroupInput(props: FormInputGroupInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <InputGroupInput
      {...props}
      aria-invalid={isInvalid}
      id={field.name}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      value={field.state.value}
    />
  );
}

type FormInputGroupTextareaProps = Omit<
  React.ComponentProps<typeof InputGroupTextarea>,
  "value" | "onChange" | "onBlur" | "name" | "id"
>;

function FormInputGroupTextarea(props: FormInputGroupTextareaProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <InputGroupTextarea
      {...props}
      aria-invalid={isInvalid}
      id={field.name}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      value={field.state.value}
    />
  );
}

function FormInputGroupSpinner() {
  const field = useFieldContext<string>();

  if (!field.state.meta.isValidating) {
    return null;
  }

  return (
    <InputGroupAddon align="inline-end">
      <Spinner />
    </InputGroupAddon>
  );
}

export {
  FormInputGroup,
  FormInputGroupInput,
  FormInputGroupSpinner,
  FormInputGroupTextarea,
};
