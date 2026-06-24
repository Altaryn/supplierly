// Eventos del navegador para acciones globales del topbar que dispara la
// pantalla de Proveedores (desacopla el shell de la pantalla con estado).
export const EVT = {
  newSupplier: "supplierly:new-supplier",
  focusSearch: "supplierly:focus-search",
} as const;
