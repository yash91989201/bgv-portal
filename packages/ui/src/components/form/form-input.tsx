import { Input } from "../input";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type FormInputProps = React.ComponentProps<"input"> & FormControlProps;

export function FormInput(props: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Input
        {...props}
        aria-invalid={isInvalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        value={field.state.value}
      />
    </FormBase>
  );
}
