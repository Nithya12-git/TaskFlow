"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}

function FieldShell({ label, error, hint, htmlFor, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const errorClass = "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/15";

interface Shared {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Shared & React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ label, error, hint, className, id, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn("field", error && errorClass, className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, Shared & React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ label, error, hint, className, id, children, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={inputId}>
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn("field", error && errorClass, className)}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, Shared & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, hint, className, id, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} error={error} hint={hint} htmlFor={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn("field min-h-[96px] resize-y", error && errorClass, className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);