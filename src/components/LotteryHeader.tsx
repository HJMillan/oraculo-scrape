import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';

interface LotteryHeaderProps {
    loading: boolean;
    lastUpdated: string | null;
    onRefresh: () => void;
}

export function LotteryHeader({ loading, lastUpdated, onRefresh }: LotteryHeaderProps) {
    return (
        <header className="flex flex-row justify-between items-center w-full pb-4 border-b border-white/5 gap-4">
            {/* Logo / Título */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-xl border border-pink-500/20">
                    <BarChart3 className="w-8 h-8 text-pink-500" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-tighter drop-shadow-sm leading-none">
                        ORÁCULO
                    </h1>
                    <p className="text-gray-300 text-[10px] tracking-[0.3em] font-medium uppercase mt-1">
                        Lotería &amp; Quiniela
                    </p>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col items-end gap-1">
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    aria-label={loading ? 'Actualizando resultados' : 'Actualizar resultados de lotería'}
                    className="group relative inline-flex items-center justify-center p-3 sm:px-6 sm:py-2 overflow-hidden font-bold text-white uppercase rounded-lg bg-pink-600 hover:bg-pink-500 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait text-sm tracking-widest focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base outline-none"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" aria-hidden="true" />
                            <span className="hidden sm:inline">Actualizando</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                            <span className="hidden sm:inline">Actualizar</span>
                        </>
                    )}
                </button>

                {lastUpdated && !loading && (
                    <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                        Última: <span className="text-pink-400">{lastUpdated}</span>
                    </p>
                )}
            </div>
        </header>
    );
}
