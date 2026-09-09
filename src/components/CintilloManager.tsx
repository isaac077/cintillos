import React, { useRef, useState } from 'react';
import { CintilloConfig, CintilloPosition, CornerPosition, OverlayMode } from '../types';
import { 
  Image as ImageIcon, Upload, Trash2, Sliders, ArrowDown, 
  ArrowUp, Move, Sparkles, CheckCircle2, Layers, 
  Stamp, Crosshair, Copy, Compass
} from 'lucide-react';
import { createDemoAssets } from '../utils/cropUtils';

interface CintilloManagerProps {
  cintillo: CintilloConfig;
  onChange: (updated: CintilloConfig) => void;
  onClear: () => void;
}

export const CintilloManager: React.FC<CintilloManagerProps> = ({
  cintillo,
  onChange,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const horizFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab when in 'both' mode
  const [bothActiveTab, setBothActiveTab] = useState<'banner' | 'logo'>('banner');

  // Load banner file
  const handleBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onChange({
        ...cintillo,
        file,
        objectUrl: url,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
      });
    };
    img.src = url;
  };

  // Load horizontal banner file
  const handleHorizBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onChange({
        ...cintillo,
        separateByOrientation: true,
        horizontalCintillo: {
          file,
          objectUrl: url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
        },
      });
    };
    img.src = url;
  };

  // Load corner logo / watermark file
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onChange({
        ...cintillo,
        watermark: {
          ...cintillo.watermark,
          enabled: true,
          file,
          objectUrl: url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
        },
      });
    };
    img.src = url;
  };

  // Copy current banner image as logo or vice versa
  const handleCopyImageToLogo = () => {
    if (!cintillo.file || !cintillo.objectUrl) return;
    onChange({
      ...cintillo,
      watermark: {
        ...cintillo.watermark,
        enabled: true,
        file: cintillo.file,
        objectUrl: cintillo.objectUrl,
        originalWidth: cintillo.originalWidth,
        originalHeight: cintillo.originalHeight,
      },
    });
  };

  const handleCopyLogoToBanner = () => {
    if (!cintillo.watermark.file || !cintillo.watermark.objectUrl) return;
    onChange({
      ...cintillo,
      file: cintillo.watermark.file,
      objectUrl: cintillo.watermark.objectUrl,
      originalWidth: cintillo.watermark.originalWidth,
      originalHeight: cintillo.watermark.originalHeight,
    });
  };

  // Quick load demo assets
  const handleLoadSampleAssets = async () => {
    const { sampleCintilloFile, sampleLogoFile } = await createDemoAssets();
    const cintilloUrl = URL.createObjectURL(sampleCintilloFile);
    const logoUrl = URL.createObjectURL(sampleLogoFile);

    const cImg = new Image();
    cImg.onload = () => {
      const lImg = new Image();
      lImg.onload = () => {
        onChange({
          ...cintillo,
          overlayMode: cintillo.overlayMode || 'both',
          file: sampleCintilloFile,
          objectUrl: cintilloUrl,
          originalWidth: cImg.naturalWidth,
          originalHeight: cImg.naturalHeight,
          watermark: {
            ...cintillo.watermark,
            enabled: true,
            file: sampleLogoFile,
            objectUrl: logoUrl,
            originalWidth: lImg.naturalWidth,
            originalHeight: lImg.naturalHeight,
            position: cintillo.watermark?.position || 'top-right',
            scalePercent: 18,
            opacity: 0.9,
            marginPx: 20,
          },
        });
      };
      lImg.src = logoUrl;
    };
    cImg.src = cintilloUrl;
  };

  const mode = cintillo.overlayMode || 'banner';

  const hasBanner = !!cintillo.objectUrl;
  const hasLogo = !!(cintillo.watermark?.objectUrl || (mode === 'corner-logo' && cintillo.objectUrl));
  const activeLogoUrl = cintillo.watermark?.objectUrl || (mode === 'corner-logo' ? cintillo.objectUrl : null);

  const cornerPositions: { id: CornerPosition; label: string; short: string }[] = [
    { id: 'top-left', label: 'Superior Izquierda', short: 'Sup. Izq' },
    { id: 'top-right', label: 'Superior Derecha', short: 'Sup. Der' },
    { id: 'center', label: 'Centro', short: 'Centro' },
    { id: 'bottom-left', label: 'Inferior Izquierda', short: 'Inf. Izq' },
    { id: 'bottom-right', label: 'Inferior Derecha', short: 'Inf. Der' },
  ];

  return (
    <section id="cintillo-section" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              Superposiciones Gráficas
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.5 rounded-md">
                Cintillo • Logo • Marca de Agua
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Aplica un cintillo faldón, un logo/marca de agua en la esquina, o ambos a la vez
            </p>
          </div>
        </div>

        {(hasBanner || hasLogo) && (
          <button
            id="btn-remove-cintillo"
            type="button"
            onClick={onClear}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors self-start md:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar Elementos
          </button>
        )}
      </div>

      {/* Main Mode Selector: Cintillo | Logo en Esquina | Ambos */}
      <div className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onChange({ ...cintillo, overlayMode: 'banner' })}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'banner'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Solo Cintillo / Banner</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...cintillo, overlayMode: 'corner-logo' })}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'corner-logo'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stamp className="w-3.5 h-3.5 text-amber-500" />
          <span>Solo Logo en Esquina</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...cintillo, overlayMode: 'both' })}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'both'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>✨ Ambos a la vez</span>
        </button>
      </div>

      {/* Sub-navigation if in 'both' mode */}
      {mode === 'both' && (
        <div className="flex items-center justify-between bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-indigo-950">
            <span className="font-bold">Modo Combinado:</span> Configurando:
          </div>
          <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-indigo-200">
            <button
              type="button"
              onClick={() => setBothActiveTab('banner')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                bothActiveTab === 'banner'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              1. Cintillo / Banner
            </button>
            <button
              type="button"
              onClick={() => setBothActiveTab('logo')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                bothActiveTab === 'logo'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              2. Logo en Esquina
            </button>
          </div>
        </div>
      )}

      {/* CONTENT: BANNER SETTINGS (when mode is banner or both with bothActiveTab === banner) */}
      {(mode === 'banner' || (mode === 'both' && bothActiveTab === 'banner')) && (
        <div className="space-y-4">
          {!cintillo.objectUrl ? (
            <div
              id="cintillo-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleBannerFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleBannerFile(e.target.files[0])}
              />
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Haz clic o arrastra tu cintillo / banner aquí (PNG transparente recomendado)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Se adaptará con proporción áurea en fotos verticales y horizontales
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleAssets();
                  }}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs hover:bg-indigo-50"
                >
                  <Sparkles className="w-3 h-3" />
                  Cargar cintillo prediseñado de muestra
                </button>

                {cintillo.watermark?.objectUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLogoToBanner();
                    }}
                    className="text-[11px] font-medium text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs hover:bg-slate-50"
                  >
                    <Copy className="w-3 h-3" />
                    Usar el mismo archivo del logo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner Info Bar */}
              <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between gap-4 border border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 min-w-16 bg-slate-800/80 rounded border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={cintillo.objectUrl}
                      alt="Cintillo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {cintillo.file?.name || 'Cintillo cargado'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {cintillo.originalWidth} × {cintillo.originalHeight} px • Cintillo / Faldón
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-300 hover:text-white font-medium underline px-2 py-1"
                  >
                    Cambiar imagen
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleBannerFile(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* Position */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Move className="w-3 h-3 text-slate-500" />
                    Posición del Cintillo
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                    {(['bottom', 'top', 'center'] as CintilloPosition[]).map((pos) => {
                      const isActive = cintillo.position === pos;
                      const label = pos === 'bottom' ? 'Abajo' : pos === 'top' ? 'Arriba' : 'Centro';
                      const Icon = pos === 'bottom' ? ArrowDown : pos === 'top' ? ArrowUp : Move;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => onChange({ ...cintillo, position: pos })}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md transition-all ${
                            isActive
                              ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizing Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-500" />
                    Ajuste de Escala
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => onChange({ ...cintillo, fitMode: 'full-width' })}
                      className={`py-1.5 px-1.5 rounded-md text-center transition-all ${
                        cintillo.fitMode === 'full-width'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ancho completo
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...cintillo, fitMode: 'scale' })}
                      className={`py-1.5 px-1.5 rounded-md text-center transition-all ${
                        cintillo.fitMode === 'scale'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      100% Real (1:1)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...cintillo, fitMode: 'height-percent' })}
                      className={`py-1.5 px-1.5 rounded-md text-center transition-all ${
                        cintillo.fitMode === 'height-percent'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      % Altura foto
                    </button>
                  </div>
                </div>

                {/* Sizing Slider based on fitMode */}
                {cintillo.fitMode === 'scale' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Escala del cintillo</span>
                      <span className={`font-bold ${cintillo.scalePercent === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {cintillo.scalePercent || 100}% {cintillo.scalePercent === 100 ? '(Tamaño Real 1:1)' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="1"
                      value={cintillo.scalePercent || 100}
                      onChange={(e) => onChange({ ...cintillo, scalePercent: Number(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={() => onChange({ ...cintillo, scalePercent: 100 })}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        [Restablecer 100% Real]
                      </button>
                      <span className="text-slate-400">10% a 200%</span>
                    </div>
                  </div>
                ) : cintillo.fitMode === 'height-percent' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Altura del cintillo</span>
                      <span className="font-bold text-indigo-600">{cintillo.heightPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={cintillo.heightPercent}
                      onChange={(e) => onChange({ ...cintillo, heightPercent: Number(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Sutil (5%)</span>
                      <span>Prominente (35%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Margen del borde</span>
                      <span className="font-bold text-indigo-600">{cintillo.marginPx} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="2"
                      value={cintillo.marginPx}
                      onChange={(e) => onChange({ ...cintillo, marginPx: Number(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Pegado (0px)</span>
                      <span>Espaciado (50px)</span>
                    </div>
                  </div>
                )}

                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Opacidad del Cintillo</span>
                    <span className="font-bold text-indigo-600">{Math.round(cintillo.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={cintillo.opacity}
                    onChange={(e) => onChange({ ...cintillo, opacity: Number(e.target.value) })}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Translúcido</span>
                    <span>Opaco (100%)</span>
                  </div>
                </div>
              </div>

              {/* Advanced: Optional separate horizontal banner */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    id="check-separate-cintillo"
                    type="checkbox"
                    checked={!!cintillo.separateByOrientation}
                    onChange={(e) =>
                      onChange({
                        ...cintillo,
                        separateByOrientation: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="check-separate-cintillo" className="font-medium text-slate-700 cursor-pointer">
                    Tengo un cintillo diferente para fotos horizontales (opcional)
                  </label>
                </div>

                {cintillo.separateByOrientation && (
                  <div className="flex items-center gap-2">
                    {cintillo.horizontalCintillo?.objectUrl ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Cintillo horizontal listo
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Falta subir banner horizontal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => horizFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-md border border-slate-200"
                    >
                      {cintillo.horizontalCintillo?.objectUrl ? 'Reemplazar' : 'Subir cintillo horizontal'}
                    </button>
                    <input
                      ref={horizFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleHorizBannerFile(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: CORNER LOGO / WATERMARK SETTINGS (when mode is corner-logo or both with bothActiveTab === logo) */}
      {(mode === 'corner-logo' || (mode === 'both' && bothActiveTab === 'logo')) && (
        <div className="space-y-4">
          {!activeLogoUrl ? (
            <div
              id="logo-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]);
              }}
              onClick={() => logoFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
              />
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-amber-600 group-hover:scale-105 transition-transform">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Haz clic o arrastra tu Logo o Marca de agua aquí (PNG transparente)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Puedes colocarlo en cualquiera de las 4 esquinas o al centro con opacidad regulable
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleAssets();
                  }}
                  className="text-[11px] font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-amber-200 shadow-2xs hover:bg-amber-50"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Cargar sello/logo de muestra
                </button>

                {cintillo.objectUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyImageToLogo();
                    }}
                    className="text-[11px] font-medium text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs hover:bg-slate-50"
                  >
                    <Copy className="w-3 h-3" />
                    Usar la imagen del cintillo como logo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Logo Info Bar */}
              <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between gap-4 border border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-12 bg-slate-800/80 rounded border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={activeLogoUrl}
                      alt="Logo / Marca de agua"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {cintillo.watermark?.file?.name || cintillo.file?.name || 'Logo cargado'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Logo en Esquina • Posición:{' '}
                      {cornerPositions.find((c) => c.id === (cintillo.watermark?.position || 'top-right'))?.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="text-xs text-amber-300 hover:text-white font-medium underline px-2 py-1"
                  >
                    Cambiar logo
                  </button>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Corner Selection Matrix & Size Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                {/* Visual 5-Corner Matrix */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    Elige la Esquina de Ubicación
                  </label>
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...cintillo,
                            watermark: { ...cintillo.watermark, position: 'top-left' },
                          })
                        }
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-1.5 transition-all ${
                          (cintillo.watermark?.position || 'top-right') === 'top-left'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Sup. Izquierda
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...cintillo,
                            watermark: { ...cintillo.watermark, position: 'top-right' },
                          })
                        }
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-end gap-1.5 transition-all ${
                          (cintillo.watermark?.position || 'top-right') === 'top-right'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        Sup. Derecha
                        <span className="w-2 h-2 rounded-full bg-current" />
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...cintillo,
                            watermark: { ...cintillo.watermark, position: 'center' },
                          })
                        }
                        className={`py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          cintillo.watermark?.position === 'center'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <Crosshair className="w-3 h-3" />
                        Al Centro
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...cintillo,
                            watermark: { ...cintillo.watermark, position: 'bottom-left' },
                          })
                        }
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-1.5 transition-all ${
                          cintillo.watermark?.position === 'bottom-left'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Inf. Izquierda
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...cintillo,
                            watermark: { ...cintillo.watermark, position: 'bottom-right' },
                          })
                        }
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-end gap-1.5 transition-all ${
                          cintillo.watermark?.position === 'bottom-right'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        Inf. Derecha
                        <span className="w-2 h-2 rounded-full bg-current" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Size, Opacity, Margin Sliders */}
                <div className="md:col-span-7 space-y-3">
                  {/* Scale / Size (100% = Tamaño Real 1:1) */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Tamaño del Logo (100% = Real 1:1)</span>
                      {(cintillo.watermark?.scalePercent ?? 100) === 100 ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                          100% — Tamaño Real (1:1)
                        </span>
                      ) : (
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                          {cintillo.watermark?.scalePercent ?? 100}%
                        </span>
                      )}
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="1"
                      value={cintillo.watermark?.scalePercent ?? 100}
                      onChange={(e) =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, scalePercent: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />

                    {/* Quick presets and real pixel dimensions */}
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px]">Preajustes:</span>
                        {[50, 75, 100, 125, 150].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              onChange({
                                ...cintillo,
                                watermark: { ...cintillo.watermark, scalePercent: preset },
                              })
                            }
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              (cintillo.watermark?.scalePercent ?? 100) === preset
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {preset === 100 ? '100% Real' : `${preset}%`}
                          </button>
                        ))}
                      </div>

                      {/* Calculated dimensions in pixels */}
                      {cintillo.watermark?.originalWidth ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.round(
                            (cintillo.watermark.originalWidth * (cintillo.watermark.scalePercent ?? 100)) / 100
                          )}{' '}
                          ×{' '}
                          {Math.round(
                            (cintillo.watermark.originalHeight * (cintillo.watermark.scalePercent ?? 100)) / 100
                          )}{' '}
                          px
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Opacidad (Transparencia)</span>
                      <span className="font-bold text-indigo-600">
                        {Math.round((cintillo.watermark?.opacity ?? 0.85) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={cintillo.watermark?.opacity ?? 0.85}
                      onChange={(e) =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, opacity: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Marca de agua sutil (10%)</span>
                      <span>Logo nítido (100%)</span>
                    </div>
                  </div>

                  {/* Margin from Corner */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Separación del borde (Margen)</span>
                      <span className="font-bold text-indigo-600">{cintillo.watermark?.marginPx ?? 20} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="2"
                      value={cintillo.watermark?.marginPx ?? 20}
                      onChange={(e) =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, marginPx: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Al borde (0px)</span>
                      <span>Espaciado (60px)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DUAL LIVE PREVIEW: Truly interactive, real-time animated preview of Vertical & Horizontal photos */}
      {(hasBanner || hasLogo) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Previsualización dinámica en tiempo real (mueve los controles o haz clic en las esquinas):
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {mode === 'both' ? 'Cintillo + Logo activo' : mode === 'corner-logo' ? 'Logo en esquina activo' : 'Cintillo activo'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 items-start">
            {/* 1. Vertical Preview Card (4:5 Ratio) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1 text-[11px]">
                <span className="font-bold text-indigo-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                  Vertical (4:5)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1080 × 1350</span>
              </div>

              <div
                className="w-full bg-linear-to-b from-slate-900 via-slate-800 to-indigo-950 rounded-xl border border-slate-700/80 relative overflow-hidden shadow-inner select-none transition-all"
                style={{ aspectRatio: '4 / 5' }}
              >
                {/* Photo Mock Silhouette Background */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/40 mb-2 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/50" />
                  </div>
                  <span className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">Foto Vertical</span>
                </div>

                {/* Interactive Clickable Hotspots for fast positioning */}
                {(mode === 'corner-logo' || mode === 'both') && (
                  <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 p-1 pointer-events-auto">
                    <button
                      type="button"
                      title="Mover a Superior Izquierda"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'top-left' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Superior Derecha"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'top-right' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover al Centro"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'center' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Inferior Izquierda"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'bottom-left' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Inferior Derecha"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'bottom-right' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                  </div>
                )}

                {/* DYNAMIC WATERMARK / LOGO ON VERTICAL */}
                {(mode === 'corner-logo' || mode === 'both') && activeLogoUrl && (
                  <div
                    className="absolute pointer-events-none transition-all duration-200 z-20 flex items-center justify-center"
                    style={{
                      top:
                        cintillo.watermark?.position === 'top-left' || cintillo.watermark?.position === 'top-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1080) * 100)}%`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      bottom:
                        cintillo.watermark?.position === 'bottom-left' || cintillo.watermark?.position === 'bottom-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1080) * 100)}%`
                          : 'auto',
                      left:
                        cintillo.watermark?.position === 'top-left' || cintillo.watermark?.position === 'bottom-left'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1080) * 100)}%`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      right:
                        cintillo.watermark?.position === 'top-right' || cintillo.watermark?.position === 'bottom-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1080) * 100)}%`
                          : 'auto',
                      transform: cintillo.watermark?.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                      width: `${Math.max(
                        8,
                        Math.min(
                          85,
                          (((cintillo.watermark?.originalWidth ||
                            (mode === 'corner-logo' ? cintillo.originalWidth : 0) ||
                            400) *
                            (cintillo.watermark?.scalePercent ?? 100)) /
                            100 /
                            1080) *
                            100
                        )
                      )}%`,
                      opacity: cintillo.watermark?.opacity ?? 0.85,
                    }}
                  >
                    <img
                      src={activeLogoUrl}
                      alt="Logo preview"
                      className="w-full h-auto object-contain drop-shadow-md rounded"
                    />
                  </div>
                )}

                {/* DYNAMIC BANNER ON VERTICAL */}
                {(mode === 'banner' || mode === 'both') && cintillo.objectUrl && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none transition-all duration-200 z-15 flex items-center justify-center px-1"
                    style={{
                      top:
                        cintillo.position === 'top'
                          ? `${Math.max(2, ((cintillo.marginPx || 0) / 1350) * 100)}%`
                          : cintillo.position === 'center'
                          ? '50%'
                          : 'auto',
                      bottom:
                        cintillo.position === 'bottom'
                          ? `${Math.max(2, ((cintillo.marginPx || 0) / 1350) * 100)}%`
                          : 'auto',
                      transform: cintillo.position === 'center' ? 'translateY(-50%)' : undefined,
                      opacity: cintillo.opacity,
                    }}
                  >
                    <img
                      src={cintillo.objectUrl}
                      alt="Cintillo en Vertical"
                      className="object-contain drop-shadow-md rounded"
                      style={{
                        width:
                          cintillo.fitMode === 'full-width'
                            ? '100%'
                            : cintillo.fitMode === 'scale'
                            ? `${Math.max(
                                20,
                                Math.min(
                                  100,
                                  (((cintillo.originalWidth || 1080) * (cintillo.scalePercent ?? 100)) / 100 / 1080) * 100
                                )
                              )}%`
                            : 'auto',
                        maxHeight:
                          cintillo.fitMode === 'height-percent'
                            ? `${cintillo.heightPercent}%`
                            : '32%',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Horizontal Preview Card (16:10 / 5:4 Ratio) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1 text-[11px]">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  Horizontal (5:4 / 16:9)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1920 × 1200</span>
              </div>

              <div
                className="w-full bg-linear-to-b from-slate-900 via-slate-800 to-indigo-950 rounded-xl border border-slate-700/80 relative overflow-hidden shadow-inner select-none transition-all"
                style={{ aspectRatio: '16 / 10' }}
              >
                {/* Photo Mock Silhouette Background */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/40 mb-1.5 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-white/50" />
                  </div>
                  <span className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">Foto Horizontal</span>
                </div>

                {/* Interactive Clickable Hotspots for fast positioning */}
                {(mode === 'corner-logo' || mode === 'both') && (
                  <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 p-1 pointer-events-auto">
                    <button
                      type="button"
                      title="Mover a Superior Izquierda"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'top-left' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Superior Derecha"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'top-right' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover al Centro"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'center' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Inferior Izquierda"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'bottom-left' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                    <div />
                    <button
                      type="button"
                      title="Mover a Inferior Derecha"
                      onClick={() =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, position: 'bottom-right' },
                        })
                      }
                      className="cursor-pointer hover:bg-white/10 rounded transition-colors"
                    />
                  </div>
                )}

                {/* DYNAMIC WATERMARK / LOGO ON HORIZONTAL */}
                {(mode === 'corner-logo' || mode === 'both') && activeLogoUrl && (
                  <div
                    className="absolute pointer-events-none transition-all duration-200 z-20 flex items-center justify-center"
                    style={{
                      top:
                        cintillo.watermark?.position === 'top-left' || cintillo.watermark?.position === 'top-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1200) * 100)}%`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      bottom:
                        cintillo.watermark?.position === 'bottom-left' || cintillo.watermark?.position === 'bottom-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1200) * 100)}%`
                          : 'auto',
                      left:
                        cintillo.watermark?.position === 'top-left' || cintillo.watermark?.position === 'bottom-left'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1920) * 100)}%`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      right:
                        cintillo.watermark?.position === 'top-right' || cintillo.watermark?.position === 'bottom-right'
                          ? `${Math.max(3, ((cintillo.watermark.marginPx ?? 20) / 1920) * 100)}%`
                          : 'auto',
                      transform: cintillo.watermark?.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                      width: `${Math.max(
                        6,
                        Math.min(
                          75,
                          (((cintillo.watermark?.originalWidth ||
                            (mode === 'corner-logo' ? cintillo.originalWidth : 0) ||
                            400) *
                            (cintillo.watermark?.scalePercent ?? 100)) /
                            100 /
                            1920) *
                            100
                        )
                      )}%`,
                      opacity: cintillo.watermark?.opacity ?? 0.85,
                    }}
                  >
                    <img
                      src={activeLogoUrl}
                      alt="Logo horizontal preview"
                      className="w-full h-auto object-contain drop-shadow-md rounded"
                    />
                  </div>
                )}

                {/* DYNAMIC BANNER ON HORIZONTAL */}
                {(mode === 'banner' || mode === 'both') && cintillo.objectUrl && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none transition-all duration-200 z-15 flex items-center justify-center px-1"
                    style={{
                      top:
                        cintillo.position === 'top'
                          ? `${Math.max(2, ((cintillo.marginPx || 0) / 1200) * 100)}%`
                          : cintillo.position === 'center'
                          ? '50%'
                          : 'auto',
                      bottom:
                        cintillo.position === 'bottom'
                          ? `${Math.max(2, ((cintillo.marginPx || 0) / 1200) * 100)}%`
                          : 'auto',
                      transform: cintillo.position === 'center' ? 'translateY(-50%)' : undefined,
                      opacity: cintillo.opacity,
                    }}
                  >
                    <img
                      src={
                        cintillo.separateByOrientation && cintillo.horizontalCintillo?.objectUrl
                          ? cintillo.horizontalCintillo.objectUrl
                          : cintillo.objectUrl
                      }
                      alt="Cintillo en Horizontal"
                      className="object-contain drop-shadow-md rounded"
                      style={{
                        width:
                          cintillo.fitMode === 'full-width'
                            ? '100%'
                            : cintillo.fitMode === 'scale'
                            ? `${Math.max(
                                20,
                                Math.min(
                                  100,
                                  (((cintillo.originalWidth || 1920) * (cintillo.scalePercent ?? 100)) / 100 / 1920) * 100
                                )
                              )}%`
                            : 'auto',
                        maxHeight:
                          cintillo.fitMode === 'height-percent'
                            ? `${cintillo.heightPercent}%`
                            : '26%',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
