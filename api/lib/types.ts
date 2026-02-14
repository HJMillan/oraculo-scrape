// ─── Re-export shared types ───
export type { LotteryItem, LotterySection, ScrapingResponse } from '../../shared/types';

// ─── Canva bootstrap data structures (backend only) ───

export interface CanvaElement {
    'A?': string;
    A: number;   // Left (X)
    B: number;   // Top (Y)
    D: number;   // Width
    C: number;   // Height
    a?: {
        A?: Array<{ A?: string }>;
        I?: { A?: string };       // Asset/media ID reference
    };
}

export interface CanvaPage {
    E?: CanvaElement[];
}

export interface CanvaBootstrapData {
    page?: {
        A?: {
            A?: CanvaPage[];
        };
    };
    asset?: {
        A?: MediaAsset[];
    };
}

// ─── Media / GIF structures ───

export interface MediaFile {
    url: string;
    width: number;
    height: number;
    container: string;
    watermarked: boolean;
}

export interface MediaAsset {
    id: string;
    files: MediaFile[];
    contentType?: string;
}

// ─── Intermediate scraping structures ───

export interface ScrapedItem {
    text: string;
    x: number;
    y: number;
    width: number;
    centerX: number;
    centerY: number;
}

export interface GifElement {
    gifUrl: string;
    x: number;
    y: number;
    centerX: number;
    centerY: number;
}
