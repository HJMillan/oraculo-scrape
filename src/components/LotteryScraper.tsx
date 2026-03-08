import { useState, useEffect, useCallback } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
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

interface ToastData {
  message: string;
  type: ToastType;
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
  const { sections, loading, error, lastUpdated, refresh } = useLotteryData();
  const [toast, setToast] = useState<ToastData | null>(null);

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

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });
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
      setStatusMap((prev) => {
        const next = { ...prev };
        for (const name of itemNames) {
          delete next[`${sectionTitle}::${name}`];
        }
        return next;
      });
    },
    [],
  );

  // Toast rendering
  const toastStyle = toast ? TOAST_STYLES[toast.type] : TOAST_STYLES.success;
  const ToastIcon = toast ? TOAST_ICONS[toast.type] : Check;

  return (
    <section
      aria-label="Resultados de lotería"
      className="w-full flex flex-col gap-6"
    >
      {/* Toast notification — always rendered for screen reader accessibility */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg shadow-xl text-sm font-medium transition-all duration-300",
          toastStyle.bg,
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <ToastIcon
          className={cn("w-4 h-4", toastStyle.text)}
          aria-hidden="true"
        />
        {toast?.message ?? ""}
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
          className="p-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded text-xs text-center animate-in fade-in slide-in-from-top-2 w-full"
        >
          {error}
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
        <div
          role="list"
          aria-label="Secciones de sorteo"
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {sections.map((section) => (
            <LotteryCard
              key={`${section.title}-${section.date}`}
              section={section}
              lastUpdated={lastUpdated}
              statusMap={statusMap}
              onStatusChange={handleStatusChange}
              onResetSection={handleResetSection}
              onToast={handleToast}
            />
          ))}
        </div>
      ) : (
        !loading && <EmptyState onRefresh={refresh} />
      )}
    </section>
  );
}
