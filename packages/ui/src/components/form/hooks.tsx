import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormCheckbox } from "./form-checkbox";
import { FormFileInput } from "./form-file-input";
import { FormInput } from "./form-input";
import {
  FormInputGroup,
  FormInputGroupInput,
  FormInputGroupSpinner,
  FormInputGroupTextarea,
} from "./form-input-group";
import { FormSelect } from "./form-select";
import { FormTextarea } from "./form-textarea";

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    Input: FormInput,
    InputGroup: FormInputGroup,
    InputGroupInput: FormInputGroupInput,
    InputGroupSpinner: FormInputGroupSpinner,
    InputGroupTextarea: FormInputGroupTextarea,
    Textarea: FormTextarea,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    FileInput: FormFileInput,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export {
  useAppForm,
  useFieldContext,
  useFormContext,
  withFieldGroup,
  withForm,
};
