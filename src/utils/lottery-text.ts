import type { LotterySection, ItemStatus } from '../types/lottery';
import { WA_NUMBER } from '../config';

/** Maps status values to the display text used in copy/WhatsApp */
const STATUS_LABELS: Record<NonNullable<ItemStatus>, string> = {
    dateli: 'Dato de datelli',
    dataudio: 'Dataudio',
    perla: 'la Perla',
};

export function generateSectionText(
    section: LotterySection,
    lastUpdated: string | null,
    statusMap: Record<string, ItemStatus>,
): string {
    const textTitle = `RESULTADOS DE LAS ${section.title}`;
    let text = `*${textTitle}*\n${section.date || lastUpdated || 'Hoy'}\n\n`;

    section.items.forEach(item => {
        const key = `${section.title}::${item.name}`;
        const status = statusMap[key];
        const statusLabel = status ? ` *${STATUS_LABELS[status]}*` : '';
        text += `${item.name}: ${item.value}${statusLabel}\n`;
    });

    return text;
}

export function getWhatsAppUrl(
    section: LotterySection,
    lastUpdated: string | null,
    statusMap: Record<string, ItemStatus>,
): string {
    const text = generateSectionText(section, lastUpdated, statusMap);
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
