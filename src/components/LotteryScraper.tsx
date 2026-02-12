import { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, RefreshCw, Loader2, Sparkles, Trophy } from 'lucide-react';

interface LotteryResult {
    name: string;
    value: string;
}

interface ScrapingResponse {
    success: boolean;
    data: LotteryResult[];
    lastUpdated: string;
    error?: string;
}

export function LotteryScraper() {
    const [results, setResults] = useState<LotteryResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedResults = localStorage.getItem('oraculo_results');
        const savedDate = localStorage.getItem('oraculo_date');

        if (savedResults) {
            try {
                setResults(JSON.parse(savedResults));
            } catch (e) {
                console.error('Error parsing stored results', e);
            }
        }
        if (savedDate) {
            setLastUpdated(savedDate);
        }
    }, []);

    const fetchNumbers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<ScrapingResponse>('/api/scrape');

            if (response.data.success) {
                const newResults = response.data.data;
                setResults(newResults);

                const now = new Date().toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                setLastUpdated(now);

                localStorage.setItem('oraculo_results', JSON.stringify(newResults));
                localStorage.setItem('oraculo_date', now);
            } else {
                throw new Error(response.data.error || 'Error desconocido');
            }
        } catch (err) {
            console.error(err);
            setError('No se pudo conectar con el Oráculo. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (results.length === 0) return;

        let shareText = `*🔮 Resultados Oráculo* - ${lastUpdated || 'Hoy'}\n\n`;

        results.forEach((item) => {
            // Formato: 📍 PROVINCIA: *1234*
            shareText += `📍 ${item.name}: *${item.value}*\n`;
        });

        shareText += `\n🍀 ¡Mucha suerte!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Resultados Oráculo',
                    text: shareText,
                });
            } catch (err) {
                console.log('Error al compartir:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                alert('¡Resultados copiados al portapapeles!');
            } catch (err) {
                alert('No se pudo copiar automáticamente.');
            }
        }
    };

    // Helper para asignar colores según el nombre (opcional para dar variedad)
    const getGradient = (index: number) => {
        const gradients = [
            'from-purple-500/10 to-transparent',
            'from-blue-500/10 to-transparent',
            'from-pink-500/10 to-transparent',
            'from-indigo-500/10 to-transparent'
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">

            {/* Panel de Control */}
            <div className="flex flex-col items-center gap-4 w-full">
                <button
                    onClick={fetchNumbers}
                    disabled={loading}
                    className="group relative inline-flex items-center justify-center px-8 py-3 w-full sm:w-auto overflow-hidden font-bold text-white uppercase rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                >
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></span>

                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Consultando Oráculo...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                            Actualizar Números
                        </>
                    )}
                </button>

                {lastUpdated && !loading && (
                    <p className="text-xs font-semibold text-gray-400 tracking-wider">
                        ÚLTIMA LECTURA: <span className="text-purple-300">{lastUpdated}</span>
                    </p>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
            </div>

            {/* Grid de Resultados */}
            {results.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-in fade-in zoom-in duration-500">
                    {results.map((item, idx) => (
                        <div
                            key={`${item.name}-${idx}`}
                            className="relative group bg-gray-800/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-gray-800/60 hover:-translate-y-1 overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-tr ${getGradient(idx)} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                            <div className="flex items-center gap-2 mb-2 w-full justify-center border-b border-white/5 pb-2">
                                <Trophy className="w-3 h-3 text-yellow-500/50" />
                                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase truncate max-w-[80%] text-center">
                                    {item.name}
                                </span>
                            </div>

                            <span className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 group-hover:from-purple-200 group-hover:to-white transition-all">
                                {item.value}
                            </span>

                            <Sparkles className="absolute top-2 right-2 w-3 h-3 text-yellow-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500">
                        <Sparkles className="w-10 h-10 mb-4 text-gray-600" />
                        <p>El oráculo espera tu consulta.</p>
                    </div>
                )
            )}

            {/* Compartir */}
            <div className="mt-4 pb-8 w-full flex justify-center border-t border-white/5 pt-8">
                <button
                    onClick={handleShare}
                    disabled={results.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10 hover:border-green-500/40 hover:text-green-300 transition-all disabled:opacity-30 disabled:hover:bg-transparent font-medium tracking-wide uppercase text-sm shadow-lg shadow-green-900/10"
                >
                    <Share2 className="w-4 h-4" />
                    Compartir en WhatsApp
                </button>
            </div>

        </div>
    );
}
