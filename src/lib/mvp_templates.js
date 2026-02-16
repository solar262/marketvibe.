/**
 * 🛠️ MarketVibe MVP Template Engine
 * High-fidelity React/Tailwind string literals for programmatic building.
 */

export const generateMVPCode = (projectData) => {
    const { name, landingPage, revenueForecast } = projectData;
    const { headline, subheadline, features, cta } = landingPage;

    return `
import React from 'react';

// 🚀 Programmatically Generated MVP by MarketVibe
// Built for ${name}

const App = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-indigo-500/30">
            {/* ✨ Gradient Glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>

            {/* 🧭 Navigation */}
            <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-2xl font-black tracking-tighter text-white">
                        ${name.toUpperCase()}<span className="text-indigo-500">.</span>
                    </div>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-sm font-medium transition-all">
                        Login
                    </button>
                </div>
            </nav>

            {/* 🛰️ Hero Section */}
            <header className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
                <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase">
                    Now in Private Alpha
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                    ${headline}
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                    ${subheadline}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                        ${cta}
                    </button>
                    <button className="px-10 py-4 rounded-2xl font-bold text-lg text-slate-300 hover:text-white transition-all">
                        View Demo
                    </button>
                </div>
            </header>

            {/* 🛡️ Features Grid */}
            <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${features.map(f => `
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                            <div className="w-12 h-12 mb-6 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                ✨
                            </div>
                            <h3 className="text-xl font-bold mb-4">${f.title}</h3>
                            <p className="text-slate-400 leading-relaxed">${f.detail}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            {/* 💰 Revenue Intelligence Mockup */}
            <section className="bg-indigo-600/5 py-32 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">Market Proven Logic.</h2>
                    <p className="text-slate-400 mb-16 max-w-xl mx-auto">
                        Validated with a $${revenueForecast.estimatedAnnualRevenue} annual market potential. Built to scale from day one.
                    </p>
                    <div className="max-w-4xl mx-auto p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 overflow-hidden">
                        <div className="bg-[#020617] rounded-[calc(1.5rem-1px)] p-8 text-left h-[400px] flex items-center justify-center italic text-slate-500">
                           [ Screenshot or App Interface Preview Placeholder ]
                        </div>
                    </div>
                </div>
            </section>

            {/* 🏁 Footer */}
            <footer className="py-20 border-t border-white/5 text-center text-slate-500 text-sm">
                <p>&copy; 2026 ${name}. Built by Founders, for Builders.</p>
            </footer>
        </div>
    );
};

export default App;
`.trim();
};
