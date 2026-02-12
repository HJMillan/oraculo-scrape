import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Loader2, Sparkles, Copy, MessageCircle, BarChart3 } from 'lucide-react';

interface LotteryItem {
    name: string;
    value: string;
}

interface LotterySection {
    title: string;
    date: string;
    items: LotteryItem[];
}

interface ScrapingResponse {
    success: boolean;
    data: LotterySection[];
    lastUpdated: string;
    error?: string;
}

export function LotteryScraper() {
    const [sections, setSections] = useState<LotterySection[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedSections = localStorage.getItem('oraculo_sections');
        const savedDate = localStorage.getItem('oraculo_date');

        if (savedSections) {
            try {
                setSections(JSON.parse(savedSections));
            } catch (e) {
                console.error('Error parsing stored sections', e);
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
                const newSections = response.data.data;
                setSections(newSections);

                const now = new Date().toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                setLastUpdated(now);

                localStorage.setItem('oraculo_sections', JSON.stringify(newSections));
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

    const generateSectionText = (section: LotterySection) => {
        let text = `*${section.title}*\n📅 ${section.date || lastUpdated || 'Hoy'}\n\n`;
        section.items.forEach(item => {
            text += `${item.name}: ${item.value}\n`;
        });
        return text;
    }

    const handleCopy = async (section: LotterySection) => {
        const text = generateSectionText(section);
        try {
            await navigator.clipboard.writeText(text);
            alert(`Copiado: ${section.title}`);
        } catch (err) {
            alert('Error al copiar');
        }
    };

    const handleWhatsApp = (section: LotterySection) => {
        const text = generateSectionText(section);
        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/5491125329923?text=${encodedText}`;
        window.open(url, '_blank');
    };

    return (
        <div className="w-full flex flex-col gap-6">

            {/* HEADER Horizontal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pb-4 border-b border-white/5 gap-4">

                {/* IZQUIERDA: Logo / Título */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-xl border border-pink-500/20">
                        <BarChart3 className="w-8 h-8 text-pink-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-tighter drop-shadow-sm leading-none">
                            ORÁCULO
                        </h1>
                        <p className="text-gray-400 text-[10px] tracking-[0.3em] font-medium uppercase mt-1">
                            Lotería & Quiniela
                        </p>
                    </div>
                </div>

                {/* DERECHA: Acciones */}
                <div className="flex flex-col items-end gap-1 self-end md:self-auto">
                    <button
                        onClick={fetchNumbers}
                        disabled={loading}
                        className="group relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-bold text-white uppercase rounded-lg bg-pink-600 hover:bg-pink-500 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait text-sm tracking-widest"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Actualizando
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                Actualizar
                            </>
                        )}
                    </button>

                    {lastUpdated && !loading && (
                        <p className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase">
                            Última: <span className="text-pink-400">{lastUpdated}</span>
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded text-xs text-center animate-in fade-in slide-in-from-top-2 w-full">
                    {error}
                </div>
            )}

            {/* Listado de Tablas - Grid Full Width (max-w-7xl controlled by container) */}
            {sections.length > 0 ? (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {sections.map((section, idx) => (
                        <div key={idx} className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col h-full bg-[#1a1b26] border border-white/5 group hover:border-pink-500/30 transition-colors duration-300">
                            {/* Header Tabla */}
                            <div className="bg-[#242636] p-3 text-center relative border-b border-white/5 shrink-0 group-hover:bg-[#2a2d40] transition-colors">
                                <h3 className="text-pink-500 font-black text-base uppercase tracking-wider">
                                    {section.title}
                                </h3>
                                {/* DATE DISPLAY */}
                                <p className="text-gray-400 text-[10px] font-bold tracking-widest mt-0.5">
                                    {section.date || '-'}
                                </p>
                            </div>

                            {/* Cuerpo Tabla */}
                            <div className="bg-[#fffffa] p-2 flex flex-col gap-1 grow">
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        className="flex items-center justify-between bg-white rounded border border-gray-100 py-1 px-2 shadow-sm"
                                    >
                                        <span className="text-pink-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-xl font-black text-gray-800 tracking-tighter tabular-nums">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Acciones Footer */}
                            <div className="bg-[#1f212e] p-2 flex gap-2 border-t border-white/5 shrink-0">
                                <button
                                    onClick={() => handleCopy(section)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wide"
                                    title="Copiar texto"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copiar
                                </button>
                                <button
                                    onClick={() => handleWhatsApp(section)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-500 hover:text-green-400 transition-colors text-[10px] font-bold uppercase tracking-wide border border-green-500/10"
                                    title="WhatsApp"
                                >
                                    <MessageCircle className="w-3 h-3" />
                                    Enviar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 w-full">
                        <Sparkles className="w-8 h-8 mb-3 opacity-50" />
                        <p className="text-sm">Sin datos</p>
                    </div>
                )
            )}

        </div>
    );
}
