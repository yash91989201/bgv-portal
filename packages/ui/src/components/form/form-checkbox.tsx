import type * as React from "react";
import { Checkbox } from "../checkbox";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type FormCheckboxProps = React.ComponentProps<typeof Checkbox> &
  FormControlProps;

export function FormCheckbox(props: FormCheckboxProps) {
  const field = useFieldContext<boolean>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const { description, label, ...checkboxProps } = props;

  return (
    <FormBase controlFirst description={description} horizontal label={label}>
      <Checkbox
        {...checkboxProps}
        aria-invalid={isInvalid}
        checked={field.state.value}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onCheckedChange={(e) => field.handleChange(e === true)}
      />
    </FormBase>
  );
}
