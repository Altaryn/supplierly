"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { SupplierModal } from "./SupplierModal";
import { SupplierDrawer } from "./SupplierDrawer";
import { ConfirmDialog } from "./ConfirmDialog";
import { FichaModal } from "./FichaModal";
import { ImportModal } from "./ImportModal";
import { StatusBadge } from "./StatusBadge";
import {
  IconSearch,
  IconUpload,
  IconFile,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
} from "@/components/icons";
import { ESTADOS } from "@/lib/constants";
import { EVT } from "@/lib/events";
import { initials, joinCategories } from "@/lib/format";
import { allCategories, filterSuppliers } from "@/lib/supplier-form";
import {
  deleteSupplierAction,
  refreshSuppliersAction,
} from "@/app/proveedores/actions";
import type { Supplier } from "@/lib/types";

const byName = (a: Supplier, b: Supplier) =>
  a.razon_social.localeCompare(b.razon_social, "es");

export function ProveedoresScreen({
  initialSuppliers,
  isLive,
}: {
  initialSuppliers: Supplier[];
  isLive: boolean;
}) {
  return (
    <ToastProvider>
      <Inner initialSuppliers={initialSuppliers} isLive={isLive} />
    </ToastProvider>
  );
}

function Inner({
  initialSuppliers,
  isLive,
}: {
  initialSuppliers: Supplier[];
  isLive: boolean;
}) {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    [...initialSuppliers].sort(byName),
  );
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [estado, setEstado] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [drawer, setDrawer] = useState<Supplier | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Supplier | null>(null);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaTarget, setFichaTarget] = useState<Supplier | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce de búsqueda (≈180ms) para que el filtrado se sienta instantáneo.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 180);
    return () => clearTimeout(t);
  }, [search]);

  // Acciones globales lanzadas desde el topbar.
  useEffect(() => {
    const onNew = () => openNew();
    const onFocus = () => searchRef.current?.focus();
    window.addEventListener(EVT.newSupplier, onNew);
    window.addEventListener(EVT.focusSearch, onFocus);
    return () => {
      window.removeEventListener(EVT.newSupplier, onNew);
      window.removeEventListener(EVT.focusSearch, onFocus);
    };
  }, []);

  const categories = useMemo(() => allCategories(suppliers), [suppliers]);
  const filtered = useMemo(
    () => filterSuppliers(suppliers, { search: query, cat, estado }),
    [suppliers, query, cat, estado],
  );

  function upsert(s: Supplier, mode: "create" | "update") {
    setSuppliers((list) => {
      const next =
        mode === "create"
          ? [s, ...list.filter((x) => x.id !== s.id)]
          : list.map((x) => (x.id === s.id ? s : x));
      return next.sort(byName);
    });
    if (drawer && drawer.id === s.id) setDrawer(s);
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setModalOpen(true);
  }
  function openDrawer(s: Supplier) {
    setDrawer(s);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setDrawer(null), 220);
  }

  async function doDelete() {
    const target = confirmTarget;
    if (!target) return;
    const res = await deleteSupplierAction(target.id, target.razon_social);
    if (res.ok) {
      setSuppliers((list) => list.filter((x) => x.id !== target.id));
      setConfirmTarget(null);
      if (drawer?.id === target.id) closeDrawer();
      toast("success", "Proveedor eliminado", res.demo ? "Modo demo." : undefined);
    } else {
      toast("error", "No se pudo eliminar", res.error);
    }
  }

  function copySap(sap: string) {
    if (!sap) return;
    navigator.clipboard?.writeText(sap).then(
      () => toast("success", "Código SAP copiado", sap),
      () => toast("error", "No se pudo copiar", "El navegador bloqueó el portapapeles."),
    );
  }

  function refresh() {
    refreshSuppliersAction().then((res) => {
      if (res.ok) {
        setSuppliers([...res.data].sort(byName));
        toast(
          "info",
          "Sincronizado",
          res.demo
            ? "Datos demo recargados."
            : `${res.data.length} proveedores desde Supabase.`,
        );
      } else {
        toast("error", "No se pudo sincronizar", res.error);
      }
    });
  }

  return (
    <div className="view" id="view-proveedores">
      {/* Banner de conexión */}
      <div className="prov-banner" data-mode={isLive ? "live" : "demo"}>
        <div className="prov-banner-main">
          <span className="prov-banner-dot" />
          <span>
            {isLive ? (
              <>
                <strong>Conectado a Supabase</strong> · {suppliers.length}{" "}
                proveedores
              </>
            ) : (
              <>
                <strong>Modo demo</strong> · sin conexión a Supabase. Las
                escrituras no se persisten.
              </>
            )}
          </span>
        </div>
        {!isLive && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              toast(
                "info",
                "Cómo conectar",
                "Define NEXT_PUBLIC_SUPABASE_URL, ANON_KEY y SERVICE_ROLE_KEY en .env.local (ver README).",
              )
            }
          >
            ¿Cómo conectar?
          </button>
        )}
      </div>

      {/* Toolbar */}
      <section className="toolbar">
        <div className="toolbar-left-filters">
          <div className="search-inline">
            <IconSearch />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar razón social, fantasía, SAP, RUT, email…"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select prov-cat-filter"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="select prov-estado-filter"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setImportOpen(true)}
            title="Importar ficha .xlsx de un proveedor"
          >
            <IconUpload />
            <span>Importar</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFichaTarget(null);
              setFichaOpen(true);
            }}
            title="Generar ficha de registro"
          >
            <IconFile />
            <span>Nueva Ficha</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            title="Recargar desde Supabase"
          >
            <IconRefresh />
            <span>Sincronizar</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <IconPlus sw={2.25} />
            <span>Nuevo proveedor</span>
          </button>
        </div>
      </section>

      {/* Tabla (desktop / tablet) */}
      <section className="table-wrap">
        <table className="table prov-table">
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>Nombre de Fantasía</th>
              <th>Empresa</th>
              <th>RUT / Tax ID</th>
              <th>Código SAP</th>
              <th>Categoría</th>
              <th>País</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th aria-label="acciones" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => openDrawer(s)} style={{ cursor: "pointer" }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="company-icon">{initials(s.razon_social)}</span>
                    <span style={{ fontWeight: 500 }}>{s.razon_social}</span>
                  </div>
                </td>
                <td>{s.nombre_fantasia || "—"}</td>
                <td>
                  {s.empresa ? (
                    <span className="badge category">{s.empresa}</span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>
                <td>
                  {s.rut_tax_id ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)" }}>
                      {s.rut_tax_id}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>
                <td>
                  {s.codigo_sap ? (
                    <button
                      type="button"
                      className="sap-copy"
                      title="Copiar Código SAP"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-sm)",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "inherit",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copySap(s.codigo_sap);
                      }}
                    >
                      {s.codigo_sap}
                    </button>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {s.categorias.length ? (
                      s.categorias.map((c) => (
                        <span className="badge category" key={c}>
                          {c}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </div>
                </td>
                <td>{s.pais || "—"}</td>
                <td>{s.contacto || "—"}</td>
                <td>
                  <StatusBadge estado={s.estado} />
                </td>
                <td>
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      title="Generar ficha"
                      onClick={() => {
                        setFichaTarget(s);
                        setFichaOpen(true);
                      }}
                    >
                      <IconFile />
                    </button>
                    <button className="btn-icon" title="Editar" onClick={() => openEdit(s)}>
                      <IconEdit />
                    </button>
                    <button
                      className="btn-icon"
                      title="Eliminar"
                      onClick={() => setConfirmTarget(s)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <EmptyState hasSuppliers={suppliers.length > 0} />}
      </section>

      {/* Tarjetas (móvil) */}
      <section className="card-list">
        {filtered.map((s) => (
          <div className="rfq-card prov-card" key={s.id} onClick={() => openDrawer(s)}>
            <div className="rfq-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span className="company-icon">{initials(s.razon_social)}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="prov-card-name">{s.razon_social}</div>
                  <div className="prov-card-sub">
                    {s.nombre_fantasia}
                    {s.codigo_sap ? ` · ${s.codigo_sap}` : ""}
                  </div>
                </div>
              </div>
              <StatusBadge estado={s.estado} />
            </div>
            <div className="rfq-card-meta">
              {s.empresa ? <span className="badge category">{s.empresa}</span> : null}
              {s.categorias.map((c) => (
                <span className="badge category" key={c}>
                  {c}
                </span>
              ))}
              <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-sm)" }}>
                {[s.pais, s.contacto].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState hasSuppliers={suppliers.length > 0} />}
      </section>

      {/* Modales y drawer */}
      <SupplierModal
        open={modalOpen}
        initial={editing}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={(s, mode) => {
          upsert(s, mode);
          setModalOpen(false);
          toast("success", mode === "create" ? "Proveedor creado" : "Cambios guardados");
        }}
      />

      <SupplierDrawer
        open={drawerOpen}
        supplier={drawer}
        categories={categories}
        onClose={closeDrawer}
        onSaved={(s) => upsert(s, "update")}
        onRequestDelete={(s) => setConfirmTarget(s)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Eliminar proveedor"
        message={`¿Seguro que deseas eliminar a ${confirmTarget?.razon_social ?? "este proveedor"}? Se borrará también su documentación.`}
        onConfirm={doDelete}
        onClose={() => setConfirmTarget(null)}
      />

      <FichaModal
        open={fichaOpen}
        supplier={fichaTarget}
        onClose={() => setFichaOpen(false)}
      />

      <ImportModal
        open={importOpen}
        categories={categories}
        onClose={() => setImportOpen(false)}
        onImported={(s, status) => upsert(s, status === "created" ? "create" : "update")}
      />
    </div>
  );
}

function EmptyState({ hasSuppliers }: { hasSuppliers: boolean }) {
  return (
    <div className="empty">
      <div className="empty-illus">
        <IconUsers sw={1.5} />
      </div>
      <div className="empty-title">
        {hasSuppliers ? "Sin resultados" : "Sin proveedores"}
      </div>
      <div className="empty-sub">
        {hasSuppliers
          ? "Ajusta la búsqueda o los filtros."
          : "Agrega tu primer proveedor o importa una ficha .xlsx."}
      </div>
    </div>
  );
}
