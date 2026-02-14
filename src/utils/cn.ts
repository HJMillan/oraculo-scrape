/**
 * Tiny utility for conditional class names.
 * Usage: cn('base', condition && 'active', 'always')
 */
export function cn(...inputs: Array<string | false | null | undefined>): string {
    return inputs.filter(Boolean).join(' ');
}
