// Token-konformes Texteingabefeld (E-Mail-Login, "Andere Stadt").

import type { InputHTMLAttributes } from "react";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  error?: string;
}

export function TextInput({ error, ...props }: TextInputProps) {
  return (
    <div>
      <input
        {...props}
        className="t-body h-14 w-full px-4 outline-none transition-colors duration-150"
        style={{
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
          border: `1.5px solid ${error ? "var(--danger)" : "var(--line)"}`,
          color: "var(--ink)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--line)";
          props.onBlur?.(e);
        }}
      />
      {error && (
        <p className="t-footnote mt-2" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
