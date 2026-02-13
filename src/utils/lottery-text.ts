import type { LotterySection } from '../hooks/useLotteryData';
import { getGifTextLabel } from './gif-map';

export function generateSectionText(section: LotterySection, lastUpdated: string | null): string {
    const textTitle = `RESULTADOS DE LAS ${section.title}`;
    let text = `*${textTitle}*\n${section.date || lastUpdated || 'Hoy'}\n\n`;
    section.items.forEach(item => {
        const gifLabel = item.gifUrl ? ` *${getGifTextLabel(item.gifUrl)}*` : '';
        text += `${item.name}: ${item.value}${gifLabel}\n`;
    });
    return text;
}

const WA_NUMBER = '5491125329923';

export function getWhatsAppUrl(section: LotterySection, lastUpdated: string | null): string {
    const text = generateSectionText(section, lastUpdated);
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
