import { useState, useEffect, useCallback, useRef } from 'react';
import type { LotterySection, ScrapingResponse } from '../types/lottery';

export interface UseLotteryDataReturn {
    sections: LotterySection[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
    refresh: () => Promise<void>;
}

// ─── Type Guards ───

function isValidItem(item: unknown): boolean {
    return (
        typeof item === 'object' && item !== null
        && typeof (item as Record<string, unknown>).name === 'string'
        && typeof (item as Record<string, unknown>).value === 'string'
    );
}

function isValidSections(data: unknown): data is LotterySection[] {
    return (
        Array.isArray(data)
        && data.every(
            (s) =>
                typeof s === 'object' && s !== null
                && typeof s.title === 'string'
                && typeof s.date === 'string'
                && Array.isArray(s.items)
                && s.items.every(isValidItem),
        )
    );
}

function isScrapingResponse(raw: unknown): raw is ScrapingResponse {
    return (
        typeof raw === 'object' && raw !== null
        && typeof (raw as Record<string, unknown>).success === 'boolean'
        && Array.isArray((raw as Record<string, unknown>).data)
    );
}

// ─── Constants ───

const STORAGE_KEY_SECTIONS = 'oraculo_sections';
const STORAGE_KEY_DATE = 'oraculo_date';
const DEBOUNCE_MS = 500;

// ─── Hook ───

export function useLotteryData(): UseLotteryDataReturn {
    const [sections, setSections] = useState<LotterySection[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ref to guard against concurrent fetches without recreating the callback
    const loadingRef = useRef(false);

    // Restore cached data from localStorage on mount (with validation)
    useEffect(() => {
        const savedSections = localStorage.getItem(STORAGE_KEY_SECTIONS);
        const savedDate = localStorage.getItem(STORAGE_KEY_DATE);

        if (savedSections) {
            try {
                const parsed: unknown = JSON.parse(savedSections);
                if (isValidSections(parsed)) {
                    setSections(parsed);
                } else {
                    // Data shape changed between deploys — clear stale cache
                    localStorage.removeItem(STORAGE_KEY_SECTIONS);
                    localStorage.removeItem(STORAGE_KEY_DATE);
                }
            } catch {
                localStorage.removeItem(STORAGE_KEY_SECTIONS);
                localStorage.removeItem(STORAGE_KEY_DATE);
            }
        }

        if (savedDate) {
            setLastUpdated(savedDate);
        }
    }, []);

    // Debounced persistence to localStorage
    useEffect(() => {
        if (sections.length === 0) return;
        const timer = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(sections));
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [sections]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/scrape');

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const raw: unknown = await res.json();

            // Validate response shape before trusting it
            if (!isScrapingResponse(raw)) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (raw.success) {
                const newSections = raw.data;

                if (!isValidSections(newSections)) {
                    throw new Error('Datos de secciones con formato no reconocido');
                }

                setSections(newSections);

                const now = new Date().toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                });
                setLastUpdated(now);

                localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(newSections));
                localStorage.setItem(STORAGE_KEY_DATE, now);
            } else {
                throw new Error(raw.error || 'Error desconocido');
            }
        } catch (err) {
            console.error('[useLotteryData] refresh failed:', err);
            setError('No se pudo conectar con el Oráculo. Intenta nuevamente.');
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, []); // stable reference — no deps

    // Auto-fetch on mount if no cached data exists
    useEffect(() => {
        const hasCachedData = localStorage.getItem(STORAGE_KEY_SECTIONS);
        if (!hasCachedData) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { sections, loading, error, lastUpdated, refresh };
}
