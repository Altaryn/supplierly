"use client";

import { useId, useRef } from "react";
import { IconX } from "@/components/icons";

// Entrada de categorías como chips (Enter o coma agrega; Backspace en vacío
// quita la última). Reproduce el patrón .tag-input del mockup.
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Agregar categoría…",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef("");
  const listId = useId();

  function add(raw: string) {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (tag && !value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    if (inputRef.current) inputRef.current.value = "";
    draftRef.current = "";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(e.currentTarget.value);
    } else if (e.key === "Backspace" && !e.currentTarget.value && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="tag-input" onClick={() => inputRef.current?.focus()}>
      <span className="tag-chips">
        {value.map((t, i) => (
          <span className="tag-chip" key={t + i}>
            {t}
            <button
              type="button"
              className="tag-chip-remove"
              aria-label={`Quitar ${t}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((_, idx) => idx !== i));
              }}
            >
              <IconX sw={2.5} />
            </button>
          </span>
        ))}
      </span>
      <input
        ref={inputRef}
        className="tag-input-field"
        list={listId}
        placeholder={value.length ? "" : placeholder}
        autoComplete="off"
        onKeyDown={onKeyDown}
        onChange={(e) => (draftRef.current = e.currentTarget.value)}
        onBlur={(e) => add(e.currentTarget.value)}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
