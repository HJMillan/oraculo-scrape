import { Zap } from 'lucide-react';
import { LotteryScraper } from './components/LotteryScraper';

function App() {
    return (
        <div className="min-h-screen bg-[#0F0F11] text-white p-4 flex flex-col items-center font-sans selection:bg-purple-500 selection:text-white antialiased">

            {/* Header Premium */}
            <header className="mb-12 mt-8 text-center relative w-full max-w-4xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-center mb-6 relative">
                    <div className="relative z-10 p-4 bg-gray-900 rounded-2xl border border-white/10 shadow-2xl shadow-purple-900/20">
                        <Zap className="w-8 h-8 text-purple-400" />
                    </div>
                </div>

                <h1 className="relative z-10 text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 drop-shadow-sm mb-2">
                    ORÁCULO
                </h1>
                <p className="relative z-10 text-gray-500 text-sm tracking-[0.2em] font-medium uppercase">
                    Lotería & Quiniela
                </p>
            </header>

            {/* Componente Principal */}
            <main className="w-full flex justify-center">
                <LotteryScraper />
            </main>

            {/* Footer Simple */}
            <footer className="mt-auto py-6 text-center text-gray-600 text-xs">
                <p>© {new Date().getFullYear()} Oráculo Scraper v1.0</p>
            </footer>

        </div>
    )
}

export default App
