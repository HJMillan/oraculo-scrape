import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 w-full">
            <Sparkles className="w-8 h-8 mb-3 opacity-50" aria-hidden="true" />
            <p className="text-sm">Sin datos</p>
        </div>
    );
}
