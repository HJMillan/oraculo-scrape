import { useState, useEffect, useCallback } from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import { useLotteryData } from '../hooks/useLotteryData';
import { LotteryHeader } from './LotteryHeader';
import { LotteryCard } from './LotteryCard';
import { EmptyState } from './EmptyState';

export function LotteryScraper() {
    const { sections, loading, error, lastUpdated, refresh } = useLotteryData();
    const [toast, setToast] = useState<string | null>(null);

    // Auto-dismiss toast after 2 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleToast = useCallback((message: string) => {
        setToast(message);
    }, []);

    return (
        <section aria-label="Resultados de lotería" className="w-full flex flex-col gap-6">

            {/* Toast notification */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-white/10 text-white rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
                    {toast}
                </div>
            )}

            <LotteryHeader loading={loading} lastUpdated={lastUpdated} onRefresh={refresh} />

            {error && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded text-xs text-center animate-in fade-in slide-in-from-top-2 w-full"
                >
                    {error}
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
                            onToast={handleToast}
                        />
                    ))}
                </div>
            ) : (
                !loading && <EmptyState />
            )}

        </section>
    );
}
