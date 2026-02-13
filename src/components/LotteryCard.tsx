import { useCallback } from 'react';
import Copy from 'lucide-react/dist/esm/icons/copy';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import type { LotterySection } from '../hooks/useLotteryData';
import { generateSectionText, getWhatsAppUrl } from '../utils/lottery-text';
import { getGifTextLabel } from '../utils/gif-map';

interface LotteryCardProps {
    section: LotterySection;
    lastUpdated: string | null;
    onToast: (message: string) => void;
}

export function LotteryCard({ section, lastUpdated, onToast }: LotteryCardProps) {
    const handleCopy = useCallback(async () => {
        const text = generateSectionText(section, lastUpdated);
        try {
            await navigator.clipboard.writeText(text);
            onToast(`✓ Copiado: ${section.title}`);
        } catch {
            onToast('Error al copiar');
        }
    }, [section, lastUpdated, onToast]);

    const handleWhatsApp = useCallback(() => {
        window.open(getWhatsAppUrl(section, lastUpdated), '_blank');
    }, [section, lastUpdated]);

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
                {section.items.map((item) => (
                    <div
                        key={`${item.name}-${item.value}`}
                        className="flex items-center bg-white rounded border border-gray-100 py-1 px-2 shadow-sm"
                    >
                        <dt className="text-pink-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate flex-shrink-0">
                            {item.name}
                        </dt>
                        <dd className="m-0 flex-1 text-right">
                            <span className="text-xl font-black text-gray-800 tracking-tighter tabular-nums">
                                {item.value}
                            </span>
                        </dd>
                        <div className="w-12 flex-shrink-0 relative">
                            {item.gifUrl && (
                                <img
                                    src={item.gifUrl}
                                    alt={getGifTextLabel(item.gifUrl)}
                                    className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-sm object-contain ${item.gifUrl.includes('8e0ebcbefac2c7ccb84860b646bf77dd') ? 'w-8 h-auto' : 'w-20 h-auto'}`}
                                    loading="lazy"
                                />
                            )}
                        </div>
                    </div>
                ))}
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
