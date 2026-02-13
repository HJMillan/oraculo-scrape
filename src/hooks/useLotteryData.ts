import { useState, useEffect, useCallback } from 'react';

export interface LotteryItem {
    name: string;
    value: string;
    gifUrl?: string;
}

export interface LotterySection {
    title: string;
    date: string;
    items: LotteryItem[];
}

interface ScrapingResponse {
    success: boolean;
    data: LotterySection[];
    lastUpdated: string;
    error?: string;
}

export interface UseLotteryDataReturn {
    sections: LotterySection[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
    refresh: () => Promise<void>;
}

export function useLotteryData(): UseLotteryDataReturn {
    const [sections, setSections] = useState<LotterySection[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedSections = localStorage.getItem('oraculo_sections');
        const savedDate = localStorage.getItem('oraculo_date');

        if (savedSections) {
            try {
                setSections(JSON.parse(savedSections));
            } catch {
                localStorage.removeItem('oraculo_sections');
            }
        }
        if (savedDate) {
            setLastUpdated(savedDate);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/scrape');

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json: ScrapingResponse = await res.json();

            if (json.success) {
                const newSections = json.data;
                setSections(newSections);

                const now = new Date().toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                setLastUpdated(now);

                localStorage.setItem('oraculo_sections', JSON.stringify(newSections));
                localStorage.setItem('oraculo_date', now);
            } else {
                throw new Error(json.error || 'Error desconocido');
            }
        } catch {
            setError('No se pudo conectar con el Oráculo. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [loading]);

    return { sections, loading, error, lastUpdated, refresh };
}
