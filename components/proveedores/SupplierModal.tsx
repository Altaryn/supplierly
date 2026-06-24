"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { TagInput } from "./TagInput";
import { IconX, IconCheck, IconInfo } from "@/components/icons";
import { ESTADOS, GENEROS, PAISES } from "@/lib/constants";
import { emptyInput, toInput } from "@/lib/supplier-form";
import {
  createSupplierAction,
  updateSupplierAction,
} from "@/app/proveedores/actions";
import type { Supplier, SupplierInput } from "@/lib/types";

type Errors = Record<string, string>;

export function SupplierModal({
  open,
  initial,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: Supplier | null;
  categories: string[];
  onClose: () => void;
  onSaved: (s: Supplier, mode: "create" | "update") => void;
}) {
  const [input, setInput] = useState<SupplierInput>(emptyInput());
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const isEdit = !!initial;

  useEffect(() => {
    if (open) {
      setInput(initial ? toInput(initial) : emptyInput());
      setErrors({});
    }
  }, [open, initial]);

  function set<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  const missing: string[] = [];
  if (!input.razon_social.trim()) missing.push("Razón Social");
  if (!input.categorias.length) missing.push("Categoría");
  if (!input.contacto.trim()) missing.push("Contacto");
  if (!input.email.trim()) missing.push("Email");
  if (!input.pais.trim()) missing.push("País");
  const canSave = missing.length === 0 && !pending;

  function submit() {
    setErrors({});
    startTransition(async () => {
      const res = isEdit
        ? await updateSupplierAction(initial!.id, input)
        : await createSupplierAction(input);
      if (res.ok) {
        onSaved(res.data, isEdit ? "update" : "create");
      } else {
        setErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="prov-modal-title">
      <header className="modal-header">
        <div className="modal-title">
          <h2 id="prov-modal-title">
            {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <p>
            {isEdit
              ? "Actualiza la información del maestro de proveedores."
              : "Se guardará en tu base de datos de Supabase."}
          </p>
        </div>
        <button className="btn-icon" aria-label="Cerrar" onClick={onClose}>
          <IconX />
        </button>
      </header>

      <div className="modal-body">
        {/* ── Identificación ── */}
        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">Identificación</div>
            <div className="form-section-hint">
              Los campos con <span className="req">*</span> son obligatorios
            </div>
          </div>

          <div className="form-row">
            <Field
              label="Razón Social"
              required
              value={input.razon_social}
              error={errors.razon_social}
              onChange={(v) => set("razon_social", v)}
              placeholder="Ej: FerroPro Distribución SpA"
            />
          </div>
          <div className="form-row">
            <Field
              label="Nombre de Fantasía"
              value={input.nombre_fantasia}
              onChange={(v) => set("nombre_fantasia", v)}
              placeholder="Ej: FerroPro"
              help="Nombre comercial. Si lo dejas vacío, se usa la razón social."
            />
            <Field
              label="Código SAP"
              optional
              value={input.codigo_sap}
              onChange={(v) => set("codigo_sap", v)}
              placeholder="Ej: SAP-1001, 10002345, PROV-001"
              help="Alfanumérico. Usado en búsqueda y filtros."
            />
          </div>
          <div className="form-row three">
            <Field
              label="RUT / Tax ID"
              value={input.rut_tax_id}
              error={errors.rut_tax_id}
              onChange={(v) => set("rut_tax_id", v)}
              placeholder="76.123.456-7"
            />
            <SelectField
              label="Estado"
              value={input.estado}
              onChange={(v) => set("estado", v as Supplier["estado"])}
              options={ESTADOS}
            />
            <Field
              label="País"
              required
              value={input.pais}
              error={errors.pais}
              onChange={(v) => set("pais", v)}
              list="modal-country-list"
              placeholder="Chile"
            />
          </div>
          <datalist id="modal-country-list">
            {PAISES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </section>

        {/* ── Clasificación y contacto ── */}
        <section className="form-section">
          <div className="form-section-head">
            <div className="form-section-title">Clasificación y contacto</div>
            <div className="form-section-hint">Categoría, contacto y canales</div>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="field-label">
                Categoría <span className="req">*</span>
              </label>
              <TagInput
                value={input.categorias}
                onChange={(v) => set("categorias", v)}
                suggestions={categories}
              />
              <span className="field-help">
                Una o varias. Enter o coma para agregar.
              </span>
            </div>
          </div>

          <div className="form-row three">
            <Field
              label="Contacto"
              required
              value={input.contacto}
              error={errors.contacto}
              onChange={(v) => set("contacto", v)}
              placeholder="Nombre del contacto"
            />
            <Field
              label="Cargo"
              optional
              value={input.cargo_contacto}
              onChange={(v) => set("cargo_contacto", v)}
              placeholder="Ej: Ejecutivo de ventas"
            />
            <SelectField
              label="Género"
              value={input.genero}
              onChange={(v) => set("genero", v)}
              options={GENEROS}
              placeholder="Selecciona…"
            />
          </div>

          <div className="form-row three">
            <Field
              label="Teléfono"
              value={input.telefono}
              onChange={(v) => set("telefono", v)}
              placeholder="+56 9 1234 5678"
            />
            <Field
              label="Email"
              required
              value={input.email}
              error={errors.email}
              onChange={(v) => set("email", v)}
              placeholder="ventas@proveedor.cl"
            />
            <Field
              label="CC Email"
              optional
              value={input.cc_email}
              error={errors.cc_email}
              onChange={(v) => set("cc_email", v)}
              placeholder="cc@proveedor.cl"
            />
          </div>

          <div className="form-row">
            <Field
              label="Ciudad"
              optional
              value={input.ciudad}
              onChange={(v) => set("ciudad", v)}
              placeholder="Santiago"
            />
            <Field
              label="Web"
              optional
              value={input.web}
              onChange={(v) => set("web", v)}
              placeholder="https://proveedor.cl"
            />
          </div>
        </section>
      </div>

      <footer className="modal-footer">
        <div className="validation-hint">
          <IconInfo />
          <span>
            {missing.length
              ? `Falta: ${missing.join(", ")}`
              : "Listo para guardar"}
          </span>
        </div>
        <div className="modal-footer-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={submit}
          >
            <IconCheck />
            <span>
              {pending
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Guardar proveedor"}
            </span>
          </button>
        </div>
      </footer>
    </Modal>
  );
}

// ── Campos reutilizables ──
function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
  error,
  required,
  optional,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  list?: string;
}) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required ? <span className="req"> *</span> : null}
        {optional ? <span className="field-opt"> (opcional)</span> : null}
      </label>
      <input
        className={`input${error ? " input-error" : ""}`}
        value={value}
        list={list}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <span className="field-help" style={{ color: "var(--status-urgent)" }}>
          {error}
        </span>
      ) : help ? (
        <span className="field-help">{help}</span>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "—",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
