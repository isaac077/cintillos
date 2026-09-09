import React from 'react';
import { Crop, Sparkles, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onLoadDemo: () => void;
  photosCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoadDemo, photosCount }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                FotoCrop & Cintillo
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                100% Calidad Original (Local)
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
              Recorte en 1:1, 4:5, 5:4 y más con cintillos personalizados en alta resolución
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {photosCount === 0 && (
            <button
              id="btn-load-demo"
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Probar con Demo
            </button>
          )}

          <div className="text-xs text-slate-500 hidden md:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sin compresión en servidor
          </div>
        </div>
      </div>
    </header>
  );
};
