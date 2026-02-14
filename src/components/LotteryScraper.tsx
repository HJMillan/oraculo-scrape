import { useState, useEffect, useCallback } from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import { useLotteryData } from '../hooks/useLotteryData';
import type { ItemStatus } from '../hooks/useLotteryData';
import { LotteryHeader } from './LotteryHeader';
import { LotteryCard } from './LotteryCard';
import { EmptyState } from './EmptyState';

const STATUS_STORAGE_KEY = 'oraculo_statuses';

export function LotteryScraper() {
    const { sections, loading, error, lastUpdated, refresh } = useLotteryData();
    const [toast, setToast] = useState<string | null>(null);

    // Status map: itemKey → ItemStatus, persisted to localStorage
    const [statusMap, setStatusMap] = useState<Record<string, ItemStatus>>(() => {
        try {
            const saved = localStorage.getItem(STATUS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Persist status changes
    useEffect(() => {
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statusMap));
    }, [statusMap]);

    // Auto-dismiss toast after 2 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleToast = useCallback((message: string) => {
        setToast(message);
    }, []);

    const handleStatusChange = useCallback((itemKey: string, status: ItemStatus) => {
        setStatusMap(prev => {
            const next = { ...prev };
            if (status === null) {
                delete next[itemKey];
            } else {
                next[itemKey] = status;
            }
            return next;
        });
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
                            statusMap={statusMap}
                            onStatusChange={handleStatusChange}
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
