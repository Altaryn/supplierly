"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { IconCheck, IconAlert, IconInfo } from "@/components/icons";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  sub?: string;
  leaving?: boolean;
}

type ToastFn = (type: ToastType, title: string, sub?: string) => void;

const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const toast = useCallback<ToastFn>(
    (type, title, sub) => {
      const id = ++seq.current;
      setItems((list) => [...list, { id, type, title, sub }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}${t.leaving ? " leaving" : ""}`}
            onClick={() => remove(t.id)}
          >
            <div className="toast-icon">
              {t.type === "success" ? (
                <IconCheck />
              ) : t.type === "error" ? (
                <IconAlert />
              ) : (
                <IconInfo />
              )}
            </div>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.sub ? <div className="toast-sub">{t.sub}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
