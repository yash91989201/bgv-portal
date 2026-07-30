import type { ReactNode } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "../select";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type SelectItemData = {
  value: string;
  label: ReactNode;
};

type FormSelectProps = FormControlProps & {
  children: ReactNode;
  className?: string;
  size?: "sm" | "default";
  placeholder?: string;
  items?: SelectItemData[];
};

export function FormSelect({
  children,
  className,
  size,
  placeholder,
  items,
  ...props
}: FormSelectProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Select
        items={items}
        onValueChange={(value) => {
          if (value === null) return;
          field.handleChange(value);
        }}
        value={field.state.value}
      >
        <SelectTrigger
          aria-invalid={isInvalid}
          className={className}
          id={field.name}
          onBlur={field.handleBlur}
          size={size}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormBase>
  );
}
