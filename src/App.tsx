import React from 'react';
import { LotteryScraper } from './components/LotteryScraper';

function App() {
    return (
        <div className="min-h-screen bg-[#0a0b14] text-white flex flex-col w-full">
            <main className="w-full flex-grow flex flex-col items-center p-4">
                <div className="w-full max-w-7xl">
                    <LotteryScraper />
                </div>
            </main>

            <footer className="text-center p-6 text-gray-600 text-xs tracking-wider border-t border-white/5 mt-auto w-full">
                <p>© {new Date().getFullYear()} - Datos extraídos del Oráculo Semanal</p>
            </footer>
        </div>
    );
}

export default App;
