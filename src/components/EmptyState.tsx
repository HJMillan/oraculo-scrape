import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface EmptyStateProps {
    onRefresh: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 w-full gap-3">
            <Sparkles className="w-8 h-8 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium">Sin datos disponibles</p>
            <button
                onClick={onRefresh}
                className="text-xs text-pink-400 hover:text-pink-300 underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base outline-none"
            >
                Cargar resultados
            </button>
        </div>
    );
}
