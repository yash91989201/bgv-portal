import { Textarea } from "../textarea";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type FormTextareaProps = React.ComponentProps<"textarea"> & FormControlProps;

export function FormTextarea(props: FormTextareaProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const { description, label, ...textareaProps } = props;

  return (
    <FormBase description={description} label={label}>
      <Textarea
        {...textareaProps}
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
