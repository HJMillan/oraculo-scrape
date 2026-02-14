// ─── Shared type definitions (Frontend + Backend) ───

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

export interface ScrapingResponse {
    success: boolean;
    data: LotterySection[];
    lastUpdated: string;
    error?: string;
    warning?: string;
}

export type ItemStatus = 'dateli' | 'dataudio' | 'perla' | null;
