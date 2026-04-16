import { useState, useEffect, useCallback, useRef } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import X from "lucide-react/dist/esm/icons/x";
import { useLotteryData } from "../hooks/useLotteryData";
import type { ItemStatus } from "../types/lottery";
import { cn } from "../utils/cn";
import { LotteryHeader } from "./LotteryHeader";
import { LotteryCard } from "./LotteryCard";
import { EmptyState } from "./EmptyState";
import { SkeletonCard } from "./SkeletonCard";

const STATUS_STORAGE_KEY = "oraculo_statuses";
const SKELETON_COUNT = 5;

type ToastType = "success" | "warning" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastData {
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

const TOAST_STYLES: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: "bg-gray-800 border-green-500/20", text: "text-green-400" },
  warning: { bg: "bg-gray-800 border-yellow-500/20", text: "text-yellow-400" },
  error: { bg: "bg-gray-800 border-red-500/20", text: "text-red-400" },
};

const TOAST_ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
};

export function LotteryScraper() {
  const { sections, loading, error, lastUpdated, refresh, clearError } = useLotteryData();
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status map: itemKey → ItemStatus, persisted to localStorage
  const [statusMap, setStatusMap] = useState<Record<string, ItemStatus>>(() => {
    try {
      const saved = localStorage.getItem(STATUS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Debounced persistence of status changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statusMap));
    }, 500);
    return () => clearTimeout(timer);
  }, [statusMap]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const duration = toast.duration ?? 2000;
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  const handleToast = useCallback(
    (message: string, type: ToastType = "success", action?: ToastAction, duration?: number) => {
      setToast({ message, type, action, duration });
    },
    [],
  );

  const handleStatusChange = useCallback(
    (itemKey: string, status: ItemStatus) => {
      setStatusMap((prev) => {
        const next = { ...prev };
        if (status === null) {
          delete next[itemKey];
        } else {
          next[itemKey] = status;
        }
        return next;
      });
    },
    [],
  );

  const handleResetSection = useCallback(
    (sectionTitle: string, itemNames: string[]) => {
      // Snapshot current states for undo
      const snapshot: Record<string, ItemStatus> = {};
      let hasAny = false;
      for (const name of itemNames) {
        const key = `${sectionTitle}::${name}`;
        const val = statusMap[key];
        if (val != null) {
          snapshot[key] = val;
          hasAny = true;
        }
      }
      if (!hasAny) return;

      setStatusMap((prev) => {
        const next = { ...prev };
        for (const name of itemNames) {
          delete next[`${sectionTitle}::${name}`];
        }
        return next;
      });

      // Undo toast
      handleToast(
        `✓ Estados limpiados: ${sectionTitle}`,
        "success",
        {
          label: "Deshacer",
          onClick: () => {
            setStatusMap((prev) => ({ ...prev, ...snapshot }));
            setToast(null);
          },
        },
        5000,
      );
    },
    [statusMap, handleToast],
  );

  // Toast rendering
  const toastStyle = toast ? TOAST_STYLES[toast.type] : TOAST_STYLES.success;
  const ToastIcon = toast ? TOAST_ICONS[toast.type] : Check;

  return (
    <section
      aria-label="Resultados de lotería"
      className="w-full flex flex-col gap-6"
    >
      {/* Toast notification — bottom-center snackbar */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg shadow-xl text-sm font-medium transition-all duration-300 max-w-[90vw]",
          toastStyle.bg,
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        <ToastIcon
          className={cn("w-4 h-4 shrink-0", toastStyle.text)}
          aria-hidden="true"
        />
        <span className="truncate">{toast?.message ?? ""}</span>
        {toast?.action && (
          <button
            onClick={toast.action.onClick}
            className="ml-2 shrink-0 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <LotteryHeader
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded text-xs text-center animate-in fade-in slide-in-from-top-2 w-full flex items-center justify-center gap-2"
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            aria-label="Cerrar error"
            className="shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Skeleton loading state */}
      {loading && sections.length === 0 && (
        <div
          aria-label="Cargando resultados"
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start"
        >
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {sections.length > 0 ? (
        <ul
          aria-label="Secciones de sorteo"
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 list-none p-0 m-0"
        >
          {sections.map((section, idx) => (
            <LotteryCard
              key={`${section.title}-${section.date}`}
              section={section}
              lastUpdated={lastUpdated}
              statusMap={statusMap}
              onStatusChange={handleStatusChange}
              onResetSection={handleResetSection}
              onToast={handleToast}
              isFirst={idx === 0}
            />
          ))}
        </ul>
      ) : (
        !loading && <EmptyState onRefresh={refresh} />
      )}
    </section>
  );
}
