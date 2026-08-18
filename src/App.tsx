import { LotteryScraper } from './components/LotteryScraper';

function App() {
    return (
        <div className="min-h-screen bg-surface-base text-white grid grid-rows-[1fr_auto] w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
            <main className="w-full flex flex-col items-center p-4">
                <div className="w-full">
                    <LotteryScraper />
                </div>
            </main>

            <footer className="text-center p-6 text-gray-400 text-xs tracking-wider border-t border-white/5 w-full">
                <p>© {new Date().getFullYear()} - Datos extraídos del Oráculo Semanal</p>
                <p className="mt-2 font-mono-nums text-[10px] text-gray-500 tracking-normal">
                    <span className="text-pink-400">v{__APP_VERSION__}</span>
                    <span className="mx-1.5 text-gray-600">·</span>
                    <span>{__APP_COMMIT__}</span>
                </p>
            </footer>
        </div>
    );
}

export default App;
