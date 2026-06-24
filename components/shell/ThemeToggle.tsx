"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/icons";

const KEY = "supplierly.theme.v2";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    const root = document.documentElement;
    if (next) root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      /* almacenamiento no disponible */
    }
  }

  return (
    <button
      className="btn-icon"
      onClick={toggle}
      title="Cambiar tema"
      aria-label="Cambiar tema"
    >
      {light ? <IconMoon /> : <IconSun />}
    </button>
  );
}
