import {
  IconArrowLeftRight,
  IconFilesFilled,
  IconTrash,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Dropzone, DropzoneEmptyState, type DropzoneProps } from "../dropzone";
import { FormBase, type FormControlProps } from "./form-base";
import { useFieldContext } from "./hooks";

type RenderEmptyState = ReactNode | (() => ReactNode);

type FileRenderContext = {
  file: File;
  index: number;
  remove: () => void;
  replace: () => void;
};

export type FormFileInputProps = FormControlProps &
  Omit<
    DropzoneProps,
    "src" | "children" | "onDrop" | "inputProps" | "multiple" | "maxFiles"
  > & {
    selectionMode?: "single" | "multiple";
    renderFile?: (context: FileRenderContext) => ReactNode;
    emptyState?: RenderEmptyState;
    onDrop?: DropzoneProps["onDrop"];
    maxFiles?: number;
  };

const formatBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)}${units[unitIndex]}`;
};

const isImageFile = (file: File) => file.type.startsWith("image/");

type DefaultFilePreviewProps = {
  file: File;
  onRemove: () => void;
  onReplace: () => void;
};

const SingleFilePreview = ({
  file,
  onRemove,
  onReplace,
}: DefaultFilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImageFile(file)) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/20 shadow-sm transition-all duration-200 hover:border-border/80 hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-muted/50 to-muted/30 shadow-inner ring-1 ring-border/20">
          {previewUrl ? (
            <img
              alt={file.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={previewUrl}
            />
          ) : (
            <IconFilesFilled className="size-6 text-muted-foreground/70" />
          )}
          {previewUrl && (
            <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 truncate font-semibold text-sm leading-tight transition-colors duration-200 group-hover:text-primary">
            {file.name}
          </p>
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span className="font-medium">{formatBytes(file.size)}</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-30" />
            <span>{file.type || "Unknown type"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <Button
            aria-label="Replace file"
            className="h-8 w-8 rounded-lg border-border/60 bg-background/80 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-background hover:text-primary"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onReplace();
            }}
            size="icon-sm"
            title="Replace"
            type="button"
            variant="outline"
          >
            <IconArrowLeftRight className="size-4" />
          </Button>
          <Button
            aria-label="Remove file"
            className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            size="icon-sm"
            title="Remove"
            type="button"
            variant="ghost"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>

      <div className="h-1 bg-linear-to-r from-primary/20 via-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

const MultiFilePreview = ({
  file,
  onRemove,
  onReplace,
}: DefaultFilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImageFile(file)) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-linear-to-br from-background to-muted/10 shadow-sm transition-all duration-200 hover:border-border/70 hover:bg-muted/20 hover:shadow-md">
      <div className="flex items-center gap-3 p-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-muted/40 to-muted/20 shadow-inner ring-1 ring-border/10">
          {previewUrl ? (
            <img
              alt={file.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={previewUrl}
            />
          ) : (
            <IconFilesFilled className="size-5 text-muted-foreground/60" />
          )}
          {previewUrl && (
            <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-0.5 truncate font-medium text-sm leading-tight transition-colors duration-200 group-hover:text-primary">
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{formatBytes(file.size)}</span>
            {file.type && (
              <>
                <span className="h-1 w-1 rounded-full bg-current opacity-30" />
                <span className="max-w-24 truncate">{file.type}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <Button
            aria-label="Replace file"
            className="h-7 w-7 rounded-md transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onReplace();
            }}
            size="icon-sm"
            title="Replace"
            type="button"
            variant="ghost"
          >
            <IconArrowLeftRight className="size-3.5" />
          </Button>
          <Button
            aria-label="Remove file"
            className="h-7 w-7 rounded-md transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            size="icon-sm"
            title="Remove"
            type="button"
            variant="ghost"
          >
            <IconTrash className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-0.5 bg-linear-to-r from-primary/10 via-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

export function FormFileInput({
  label,
  description,
  className,
  emptyState,
  renderFile,
  selectionMode = "single",
  disabled,
  onDrop,
  maxFiles,
  ...dropzoneProps
}: FormFileInputProps) {
  const field = useFieldContext<File | File[] | undefined>();
  const replaceIndexRef = useRef<number | null>(null);
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const value = field.state.value;
  const files = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }

    if (value instanceof File) {
      return [value];
    }

    return [];
  }, [value]);

  const limit =
    selectionMode === "single"
      ? 1
      : typeof maxFiles === "number" && maxFiles > 0
        ? maxFiles
        : 0; // 0 === unlimited for dropzone

  const remainingSlots =
    selectionMode === "multiple" && limit > 0
      ? Math.max(limit - files.length, 0)
      : undefined;

  const resolvedMaxFiles =
    selectionMode === "single"
      ? 1
      : limit === 0
        ? 0
        : Math.max(remainingSlots ?? 0, 1);

  const allowMultiple =
    selectionMode === "multiple" && (limit === 0 || (remainingSlots ?? 0) > 1);
  const PreviewComponent =
    selectionMode === "single" ? SingleFilePreview : MultiFilePreview;

  const triggerFileDialog = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const input = document.getElementById(
      field.name
    ) as HTMLInputElement | null;
    input?.click();
  }, [field.name]);

  const handleRemove = useCallback(
    (index: number) => {
      if (selectionMode === "single") {
        field.handleChange(undefined);
      } else {
        const next = files.filter((_, fileIndex) => fileIndex !== index);
        field.handleChange(next);
      }

      field.handleBlur();
    },
    [field, files, selectionMode]
  );

  const handleDrop = useCallback<NonNullable<DropzoneProps["onDrop"]>>(
    (accepted, rejections, event) => {
      const replaceIndex = replaceIndexRef.current;

      if (selectionMode === "single") {
        if (accepted.length > 0) {
          field.handleChange(accepted.at(-1));
        }
      } else {
        const current = Array.isArray(field.state.value)
          ? [...field.state.value]
          : field.state.value
            ? [field.state.value]
            : [];

        if (replaceIndex !== null && replaceIndex < current.length) {
          if (accepted.length > 0) {
            current[replaceIndex] = accepted[0];
            field.handleChange(current);
          }
        } else if (accepted.length > 0) {
          const slotsRemaining =
            limit === 0
              ? Number.POSITIVE_INFINITY
              : Math.max(limit - current.length, 0);

          if (slotsRemaining > 0) {
            const additions =
              slotsRemaining === Number.POSITIVE_INFINITY
                ? accepted
                : accepted.slice(0, slotsRemaining);

            field.handleChange([...current, ...additions]);
          }
        }
      }

      replaceIndexRef.current = null;
      field.handleBlur();
      onDrop?.(accepted, rejections, event);
    },
    [field, limit, onDrop, selectionMode]
  );

  const resolveEmptyState = useCallback(() => {
    if (typeof emptyState === "function") {
      return emptyState();
    }

    if (emptyState) {
      return emptyState;
    }

    return <DropzoneEmptyState />;
  }, [emptyState]);

  return (
    <FormBase description={description} label={label}>
      <Dropzone
        {...dropzoneProps}
        accept={dropzoneProps.accept}
        className={cn(
          className,
          "items-stretch gap-4 transition-all duration-200",
          isInvalid &&
            "border-destructive/60 hover:border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20"
        )}
        disabled={disabled}
        inputProps={{
          id: field.name,
          name: field.name,
          "aria-invalid": isInvalid || undefined,
          multiple: allowMultiple,
        }}
        maxFiles={resolvedMaxFiles}
        multiple={allowMultiple}
        onDrop={handleDrop}
        onRootClick={() => {
          replaceIndexRef.current = null;
        }}
        src={files.length > 0 ? files : undefined}
      >
        <div className="flex w-full flex-col gap-4">
          {files.length > 0 ? (
            <div className="space-y-3">
              <ul className="flex flex-col gap-3">
                {files.map((file, index) => {
                  const remove = () => handleRemove(index);
                  const replace = () => {
                    replaceIndexRef.current = index;
                    triggerFileDialog();
                  };

                  return (
                    <li
                      className="fade-in-0 slide-in-from-2 animate-in duration-300"
                      key={`${file.name}-${index}`}
                    >
                      {renderFile ? (
                        renderFile({
                          file,
                          index,
                          remove,
                          replace,
                        })
                      ) : (
                        <PreviewComponent
                          file={file}
                          onRemove={remove}
                          onReplace={replace}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="fade-in-0 animate-in duration-200">
              {resolveEmptyState()}
            </div>
          )}
          {selectionMode === "multiple" && limit > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <p className="font-medium text-muted-foreground text-sm">
                  {files.length} of {limit} files selected
                </p>
              </div>
              {files.length > 0 && (
                <Button
                  className="h-7 px-2 text-muted-foreground text-xs transition-all duration-200 hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => {
                    files.forEach((_, index) => handleRemove(index));
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Clear all
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </Dropzone>
    </FormBase>
  );
}
