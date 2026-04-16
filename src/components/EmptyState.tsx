import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface EmptyStateProps {
    onRefresh: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 rounded-2xl text-gray-400 w-full gap-4">
            <div className="p-4 bg-pink-500/10 rounded-full border border-pink-500/10">
                <Sparkles className="w-10 h-10 text-pink-500/60" aria-hidden="true" />
            </div>
            <div className="text-center space-y-1">
                <p className="text-base font-bold text-gray-300">Todavía no hay resultados</p>
                <p className="text-xs text-gray-500">Tocá el botón para obtener los últimos sorteos</p>
            </div>
            <button
                onClick={onRefresh}
                className="mt-1 px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base outline-none"
            >
                Actualizar
            </button>
        </div>
    );
}
