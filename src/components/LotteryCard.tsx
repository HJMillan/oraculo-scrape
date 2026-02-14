import { useCallback } from 'react';
import Copy from 'lucide-react/dist/esm/icons/copy';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import type { LotterySection, ItemStatus } from '../hooks/useLotteryData';
import { generateSectionText, getWhatsAppUrl } from '../utils/lottery-text';
import { StatusToggle } from './StatusToggle';

interface LotteryCardProps {
    section: LotterySection;
    lastUpdated: string | null;
    statusMap: Record<string, ItemStatus>;
    onStatusChange: (itemKey: string, status: ItemStatus) => void;
    onToast: (message: string) => void;
}

/** Generates a unique key for an item within its section */
function itemKey(sectionTitle: string, itemName: string): string {
    return `${sectionTitle}::${itemName}`;
}

export function LotteryCard({ section, lastUpdated, statusMap, onStatusChange, onToast }: LotteryCardProps) {
    const handleCopy = useCallback(async () => {
        const text = generateSectionText(section, lastUpdated, statusMap);
        try {
            await navigator.clipboard.writeText(text);
            onToast(`✓ Copiado: ${section.title}`);
        } catch {
            onToast('Error al copiar');
        }
    }, [section, lastUpdated, statusMap, onToast]);

    const handleWhatsApp = useCallback(() => {
        window.open(getWhatsAppUrl(section, lastUpdated, statusMap), '_blank');
    }, [section, lastUpdated, statusMap]);

    return (
        <article
            role="listitem"
            aria-label={`Resultados de ${section.title}`}
            className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col h-full min-h-[200px] bg-surface-card border border-white/5 group hover:border-pink-500/30 transition-colors duration-300"
        >
            {/* Header */}
            <div className="bg-surface-card-header p-3 text-center relative border-b border-white/5 shrink-0 group-hover:bg-surface-card-header-hover transition-colors">
                <h2 className="text-pink-500 font-black text-base uppercase tracking-wider">
                    {section.title}
                </h2>
                <p className="text-gray-300 text-[10px] font-bold tracking-widest mt-0.5">
                    {section.date || '-'}
                </p>
            </div>

            {/* Body — Semantic definition list */}
            <dl className="bg-surface-card-body p-2 flex flex-col gap-1 grow">
                {section.items.map((item) => {
                    const key = itemKey(section.title, item.name);
                    return (
                        <div
                            key={`${item.name}-${item.value}`}
                            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr] items-center bg-white rounded border border-gray-100 py-1 px-2 shadow-sm gap-x-2 gap-y-1"
                        >
                            {/* Name */}
                            <dt className="text-pink-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate">
                                {item.name}
                            </dt>
                            {/* Value */}
                            <dd className="m-0 text-center md:text-right">
                                <span className="text-xl font-black text-gray-800 tracking-tighter tabular-nums">
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
                        </div>
                    );
                })}
            </dl>

            {/* Actions Footer */}
            <div className="bg-surface-card-footer p-2 flex gap-2 border-t border-white/5 shrink-0">
                <button
                    onClick={handleCopy}
                    aria-label={`Copiar resultados de ${section.title}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card-footer outline-none"
                >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    Copiar
                </button>
                <button
                    onClick={handleWhatsApp}
                    aria-label={`Enviar resultados de ${section.title} por WhatsApp`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded bg-green-500/10 hover:bg-green-500/20 active:scale-95 text-green-500 hover:text-green-400 transition-all text-[10px] font-bold uppercase tracking-wide border border-green-500/10 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card-footer outline-none"
                >
                    <MessageCircle className="w-3 h-3" aria-hidden="true" />
                    Enviar
                </button>
            </div>
        </article>
    );
}
