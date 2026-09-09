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
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => onChange({ ...cintillo, fitMode: 'full-width' })}
                      className={`py-1.5 px-2 rounded-md text-center transition-all ${
                        cintillo.fitMode === 'full-width'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ancho completo
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...cintillo, fitMode: 'height-percent' })}
                      className={`py-1.5 px-2 rounded-md text-center transition-all ${
                        cintillo.fitMode === 'height-percent'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      % Altura foto
                    </button>
                  </div>
                </div>

                {/* Height % Slider if in height-percent mode, or scale slider */}
                {cintillo.fitMode === 'height-percent' ? (
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
                      max="40"
                      step="2"
                      value={cintillo.marginPx}
                      onChange={(e) => onChange({ ...cintillo, marginPx: Number(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Pegado (0px)</span>
                      <span>Espaciado (40px)</span>
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
                  {/* Scale / Size */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Tamaño del Logo / Marca de agua</span>
                      <span className="font-bold text-indigo-600">{cintillo.watermark?.scalePercent || 18}%</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="38"
                      step="1"
                      value={cintillo.watermark?.scalePercent || 18}
                      onChange={(e) =>
                        onChange({
                          ...cintillo,
                          watermark: { ...cintillo.watermark, scalePercent: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Discreto (8%)</span>
                      <span>Medio (18%)</span>
                      <span>Grande (38%)</span>
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
                      max="50"
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
                      <span>Holgado (50px)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DUAL LIVE PREVIEW: Shows how the photo cards look with Banner, Corner Logo, or Both */}
      {(hasBanner || hasLogo) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Previsualización en tiempo real (Vertical vs Horizontal):
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {mode === 'both' ? 'Cintillo + Logo activo' : mode === 'corner-logo' ? 'Logo en esquina activo' : 'Cintillo activo'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Vertical Preview Card */}
            <div className="bg-slate-900 rounded-lg p-2.5 flex flex-col justify-between aspect-4/5 border border-slate-800 relative overflow-hidden group shadow-inner">
              {/* Header inside vertical preview */}
              <div className="flex items-center justify-between w-full z-10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  Vertical (4:5)
                </span>

                {/* If logo is top-right, show it */}
                {(mode === 'corner-logo' || mode === 'both') &&
                  activeLogoUrl &&
                  (cintillo.watermark?.position || 'top-right') === 'top-right' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="h-7 w-7 object-contain rounded"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
              </div>

              {/* If logo is top-left, bottom-left, or center */}
              {(mode === 'corner-logo' || mode === 'both') && activeLogoUrl && (
                <>
                  {(cintillo.watermark?.position || 'top-right') === 'top-left' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute top-8 left-2 h-7 w-7 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'center' && (
                    <img
                      src={activeLogoUrl}
                      alt="Center watermark preview"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'bottom-left' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute bottom-9 left-2 h-7 w-7 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'bottom-right' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute bottom-9 right-2 h-7 w-7 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                </>
              )}

              <div className="text-[10px] text-slate-500 self-center my-auto">Foto Vertical</div>

              {/* Banner if enabled */}
              {(mode === 'banner' || mode === 'both') && cintillo.objectUrl ? (
                <div
                  className="w-full bg-black/40 border border-white/10 rounded p-1 flex items-center justify-center z-10"
                  style={{
                    alignSelf: cintillo.position === 'top' ? 'flex-start' : cintillo.position === 'center' ? 'center' : 'flex-end',
                  }}
                >
                  <img
                    src={cintillo.objectUrl}
                    alt="Cintillo en Vertical"
                    className="max-h-5 object-contain"
                    style={{ opacity: cintillo.opacity }}
                  />
                </div>
              ) : (
                <div className="h-1" />
              )}
            </div>

            {/* Horizontal Preview Card */}
            <div className="bg-slate-900 rounded-lg p-2.5 flex flex-col justify-between aspect-16/10 border border-slate-800 relative overflow-hidden group shadow-inner">
              <div className="flex items-center justify-between w-full z-10">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Horizontal (5:4 / 16:9)
                </span>

                {(mode === 'corner-logo' || mode === 'both') &&
                  activeLogoUrl &&
                  (cintillo.watermark?.position || 'top-right') === 'top-right' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="h-6 w-6 object-contain rounded"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
              </div>

              {/* Other corner positions on horizontal */}
              {(mode === 'corner-logo' || mode === 'both') && activeLogoUrl && (
                <>
                  {(cintillo.watermark?.position || 'top-right') === 'top-left' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute top-7 left-2 h-6 w-6 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'center' && (
                    <img
                      src={activeLogoUrl}
                      alt="Center watermark preview"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'bottom-left' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute bottom-8 left-2 h-6 w-6 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                  {cintillo.watermark?.position === 'bottom-right' && (
                    <img
                      src={activeLogoUrl}
                      alt="Corner logo preview"
                      className="absolute bottom-8 right-2 h-6 w-6 object-contain z-10"
                      style={{ opacity: cintillo.watermark?.opacity ?? 0.85 }}
                    />
                  )}
                </>
              )}

              <div className="text-[10px] text-slate-500 self-center my-auto">Foto Horizontal</div>

              {/* Banner on horizontal */}
              {(mode === 'banner' || mode === 'both') && cintillo.objectUrl ? (
                <div
                  className="w-full bg-black/40 border border-white/10 rounded p-1 flex items-center justify-center z-10"
                  style={{
                    alignSelf: cintillo.position === 'top' ? 'flex-start' : cintillo.position === 'center' ? 'center' : 'flex-end',
                  }}
                >
                  <img
                    src={
                      cintillo.separateByOrientation && cintillo.horizontalCintillo?.objectUrl
                        ? cintillo.horizontalCintillo.objectUrl
                        : cintillo.objectUrl
                    }
                    alt="Cintillo en Horizontal"
                    className="max-h-4 object-contain"
                    style={{ opacity: cintillo.opacity }}
                  />
                </div>
              ) : (
                <div className="h-1" />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
