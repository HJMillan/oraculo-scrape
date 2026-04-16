import { useCallback, useRef, useState, useEffect } from "react";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import type { LotterySection, ItemStatus } from "../types/lottery";
import { generateSectionText, getWhatsAppUrl } from "../utils/lottery-text";
import { cn } from "../utils/cn";
import { StatusToggle } from "./StatusToggle";

interface LotteryCardProps {
  section: LotterySection;
  lastUpdated: string | null;
  statusMap: Record<string, ItemStatus>;
  onStatusChange: (itemKey: string, status: ItemStatus) => void;
  onResetSection: (sectionTitle: string, itemNames: string[]) => void;
  onToast: (message: string, type?: "success" | "warning" | "error") => void;
  /** Whether this is the first card — used for swipe hint */
  isFirst?: boolean;
}

/** Generates a unique key for an item within its section */
function itemKey(sectionTitle: string, itemName: string): string {
  return `${sectionTitle}::${itemName}`;
}

/** Status cycle for swipe navigation */
const STATUS_CYCLE: Array<ItemStatus> = [null, "dateli", "dataudio", "perla"];

function cycleStatus(
  current: ItemStatus,
  direction: "forward" | "backward",
): ItemStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  if (direction === "forward") {
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  }
  return STATUS_CYCLE[(idx - 1 + STATUS_CYCLE.length) % STATUS_CYCLE.length];
}

export function LotteryCard({
  section,
  lastUpdated,
  statusMap,
  onStatusChange,
  onResetSection,
  onToast,
  isFirst = false,
}: Readonly<LotteryCardProps>) {
  const [copied, setCopied] = useState(false);

  // Auto-revert copied state
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const text = generateSectionText(section, lastUpdated, statusMap);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast(`✓ Copiado: ${section.title}`, "success");
    } catch {
      onToast(
        "⚠ No se pudo copiar. Verifica los permisos del navegador.",
        "warning",
      );
    }
  }, [section, lastUpdated, statusMap, onToast]);

  const handleWhatsApp = useCallback(() => {
    try {
      const url = getWhatsAppUrl(section, lastUpdated, statusMap);
      const win = globalThis.open(url, "_blank");
      if (!win) {
        onToast(
          "⚠ Permite las ventanas emergentes para enviar por WhatsApp",
          "warning",
        );
      }
    } catch {
      onToast("⚠ Error al abrir WhatsApp", "error");
    }
  }, [section, lastUpdated, statusMap, onToast]);

  const handleReset = useCallback(() => {
    const names = section.items.map((item) => item.name);
    onResetSection(section.title, names);
  }, [section, onResetSection]);

  return (
    <li
      aria-label={`Resultados de ${section.title}`}
      className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col h-full min-h-[200px] bg-surface-card border border-white/5 group hover:border-pink-500/30 transition-colors duration-300 list-none"
    >
      {/* Header */}
      <div className="bg-surface-card-header py-1.5 px-3 text-center relative border-b border-white/5 shrink-0 group-hover:bg-surface-card-header-hover transition-colors flex flex-col md:flex-row md:justify-between md:items-center">
        <h2 className="text-pink-500 font-black text-base uppercase tracking-wider">
          {section.title}
        </h2>
        <p className="text-gray-300 text-[10px] font-bold tracking-widest md:mt-0">
          {section.date || "-"}
        </p>
      </div>

      {/* Body — Semantic definition list */}
      <dl className="bg-surface-card-body p-2 flex flex-col gap-1 grow">
        {/* Swipe hint — one-shot for first card on touch devices */}
        {isFirst && <SwipeHintBanner />}
        {section.items.map((item, index) => {
          const key = itemKey(section.title, item.name);
          return (
            <SwipeableItem
              key={`${item.name}-${item.value}`}
              index={index}
              currentStatus={statusMap[key] ?? null}
              onStatusChange={(status) => onStatusChange(key, status)}
            >
              {/* Name */}
              <dt className="text-pink-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate">
                {item.name}
              </dt>
              {/* Value */}
              <dd className="m-0 text-center md:text-right">
                <span className="text-2xl sm:text-xl font-black text-white tracking-tighter tabular-nums font-mono-nums drop-shadow-[0_0_6px_rgba(236,72,153,0.12)]">
                  {item.value}
                </span>
              </dd>
              {/* Toggle — on desktop spans full row below */}
              <div className="md:col-span-2">
                <StatusToggle
                  value={statusMap[key] ?? null}
                  onChange={(status) => onStatusChange(key, status)}
                />
              </div>
            </SwipeableItem>
          );
        })}
      </dl>

      {/* Actions Footer */}
      <div className="bg-surface-card-footer p-2 flex gap-2 border-t border-white/5 shrink-0">
        <button
          onClick={handleCopy}
          aria-label={`Copiar resultados de ${section.title}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-1.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition-all text-xs sm:text-[10px] font-bold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card-footer outline-none"
        >
          {copied ? (
            <Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-400" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 sm:w-3 sm:h-3" aria-hidden="true" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button
          onClick={handleReset}
          aria-label={`Limpiar estados de ${section.title}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-1.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition-all text-xs sm:text-[10px] font-bold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card-footer outline-none"
        >
          <RotateCcw className="w-4 h-4 sm:w-3 sm:h-3" aria-hidden="true" />
          Limpiar
        </button>
        <button
          onClick={handleWhatsApp}
          aria-label={`Enviar resultados de ${section.title} por WhatsApp`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 active:scale-95 text-green-500 hover:text-green-400 transition-all text-xs sm:text-[10px] font-bold uppercase tracking-wide border border-green-500/10 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card-footer outline-none"
        >
          <MessageCircle className="w-4 h-4 sm:w-3 sm:h-3" aria-hidden="true" />
          Enviar
        </button>
      </div>
    </li>
  );
}

// ─── Swipeable Item Wrapper ───

const SWIPE_THRESHOLD = 60;

interface SwipeableItemProps {
  index: number;
  currentStatus: ItemStatus;
  onStatusChange: (status: ItemStatus) => void;
  children: React.ReactNode;
}

function SwipeableItem({
  index,
  currentStatus,
  onStatusChange,
  children,
}: Readonly<SwipeableItemProps>) {
  const touchStartX = useRef<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

      const direction = deltaX > 0 ? "forward" : "backward";
      onStatusChange(cycleStatus(currentStatus, direction));

      // Brief visual feedback
      if (itemRef.current) {
        itemRef.current.style.transform = `translateX(${deltaX > 0 ? 4 : -4}px)`;
        requestAnimationFrame(() => {
          if (itemRef.current) {
            itemRef.current.style.transform = "";
          }
        });
      }
    },
    [currentStatus, onStatusChange],
  );

  // Zebra striping: desktop → subtle background alternation, mobile → left border accent on even rows
  const isEven = index % 2 === 0;

  return (
    <div
      ref={itemRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr] items-center bg-surface-item rounded border border-white/5 py-0.5 px-2 shadow-sm gap-x-2 gap-y-1 transition-transform duration-150",
        // Zebra — mobile: left accent border on even rows
        isEven &&
          "border-l-2 border-l-pink-500/40 md:border-l md:border-l-white/5",
        // Zebra — background alternation on even rows (all sizes)
        isEven && "bg-white/8",
      )}
    >
      {children}
    </div>
  );
}

// ─── Swipe Hint Banner (one-shot) ───

const SWIPE_HINT_KEY = "oraculo_swipe_hint_seen";

function SwipeHintBanner() {
  const [visible, setVisible] = useState(() => {
    // Only show on touch devices that haven't seen it
    if (globalThis.window === undefined) return false;
    if (!("ontouchstart" in globalThis)) return false;
    return !localStorage.getItem(SWIPE_HINT_KEY);
  });

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(SWIPE_HINT_KEY, "1");
    }, 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(SWIPE_HINT_KEY, "1");
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={dismiss}
      onTouchStart={dismiss}
      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[11px] font-bold tracking-wide cursor-pointer animate-swipe-hint select-none"
    >
      <span>←</span>
      <span>Deslizá para marcar</span>
      <span>→</span>
    </button>
  );
}

