import React, { useEffect, useRef, useState } from 'react';
import { AspectRatioId, CintilloConfig, PhotoItem } from '../types';
import { ASPECT_RATIOS, canvasToBlob, getAspectRatio, getDefaultCrop, renderProcessedImage, triggerDownload } from '../utils/cropUtils';
import { Crop, Download, Trash2, CheckCircle2, ShieldCheck, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';

interface PhotoCardProps {
  photo: PhotoItem;
  cintillo: CintilloConfig;
  onOpenCrop: (photo: PhotoItem) => void;
  onUpdatePhoto: (updated: PhotoItem) => void;
  onDeletePhoto: (id: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  cintillo,
  onOpenCrop,
  onUpdatePhoto,
  onDeletePhoto,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRenderingThumb, setIsRenderingThumb] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(photo.name);

  // Keep name input in sync if changed from batch modal
  useEffect(() => {
    setNameInput(photo.name);
  }, [photo.name]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== photo.name) {
      // Preserve extension if user didn't write one
      const oldExtMatch = photo.name.match(/\.[^/.]+$/);
      const oldExt = oldExtMatch ? oldExtMatch[0] : '';
      const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(trimmed);
      const finalName = hasExt ? trimmed : `${trimmed}${oldExt}`;
      onUpdatePhoto({
        ...photo,
        name: finalName,
      });
    } else {
      setNameInput(photo.name);
    }
    setIsEditingName(false);
  };

  // Fast canvas thumbnail render reflecting exact crop & cintillo
  useEffect(() => {
    let active = true;
    setIsRenderingThumb(true);

    const updateThumb = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render full image with crop & cintillo
        const rendered = await renderProcessedImage(photo, cintillo);
        if (!active) return;

        // Size the thumbnail canvas cleanly
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxThumbWidth = 400;
        const scale = Math.min(1, maxThumbWidth / rendered.width);
        canvas.width = Math.round(rendered.width * scale);
        canvas.height = Math.round(rendered.height * scale);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(rendered, 0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error('Error rendering thumbnail for card:', photo.name, err);
      } finally {
        if (active) setIsRenderingThumb(false);
      }
    };

    updateThumb();

    return () => {
      active = false;
    };
  }, [
    photo.cropRect,
    photo.aspectRatioId,
    photo.applyCintillo,
    photo.objectUrl,
    cintillo.overlayMode,
    cintillo.objectUrl,
    cintillo.position,
    cintillo.fitMode,
    cintillo.heightPercent,
    cintillo.scalePercent,
    cintillo.opacity,
    cintillo.marginPx,
    cintillo.adaptiveBehavior,
    cintillo.maxHeightPercentHorizontal,
    cintillo.separateByOrientation,
    cintillo.horizontalCintillo?.objectUrl,
    cintillo.watermark?.objectUrl,
    cintillo.watermark?.position,
    cintillo.watermark?.scalePercent,
    cintillo.watermark?.opacity,
    cintillo.watermark?.marginPx,
  ]);

  const handleQuickRatioChange = (newRatioId: AspectRatioId) => {
    const ratio = getAspectRatio(newRatioId);
    const newCrop = getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio);
    onUpdatePhoto({
      ...photo,
      aspectRatioId: newRatioId,
      cropRect: newCrop,
    });
  };

  const handleToggleCintillo = () => {
    onUpdatePhoto({
      ...photo,
      applyCintillo: !photo.applyCintillo,
    });
  };

  const handleSingleDownload = async () => {
    setIsExporting(true);
    try {
      const fullCanvas = await renderProcessedImage(photo, cintillo, {
        format: 'jpeg',
        quality: 1.0,
        resolutionMode: 'original',
      });
      const blob = await canvasToBlob(fullCanvas, 'jpeg', 0.98);
      const cleanName = photo.name.replace(/\.[^/.]+$/, '');
      triggerDownload(blob, `${cleanName}_${photo.aspectRatioId}.jpg`);
    } catch (err) {
      console.error('Error al descargar:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <article
      id={`photo-card-${photo.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
    >
      {/* Thumbnail Area */}
      <div
        onClick={() => onOpenCrop(photo)}
        className="relative bg-slate-950 aspect-square flex items-center justify-center cursor-pointer overflow-hidden group/thumb"
      >
        {isRenderingThumb && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover/thumb:scale-[1.02]"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-lg transform -translate-y-1 group-hover/thumb:translate-y-0 transition-transform">
            <Crop className="w-3.5 h-3.5 text-indigo-600" />
            Editar Recorte
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold border border-slate-700/60 shadow-xs">
            {photo.aspectRatioId}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-slate-300 text-[10px] font-medium border border-white/10">
            {photo.originalHeight > photo.originalWidth ? 'Vertical' : photo.originalWidth > photo.originalHeight ? 'Horizontal' : 'Cuadrada'}
          </span>
          {photo.applyCintillo && (cintillo.objectUrl || cintillo.watermark?.objectUrl) && (
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-2.5 h-2.5" />
              {cintillo.overlayMode === 'both'
                ? 'Cintillo + Logo'
                : cintillo.overlayMode === 'corner-logo'
                ? 'Logo en esquina'
                : 'Cintillo'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeletePhoto(photo.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/70 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors z-10"
          title="Eliminar foto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Info & Controls */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setNameInput(photo.name);
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={handleSaveName}
                  autoFocus
                  className="w-full px-2 py-0.5 text-xs font-bold text-slate-800 border-2 border-indigo-500 rounded-md focus:outline-none bg-indigo-50/50"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSaveName}
                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
                  title="Guardar nombre"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNameInput(photo.name);
                    setIsEditingName(false);
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-400 rounded cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 group/name">
                <h4
                  onClick={() => setIsEditingName(true)}
                  className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                  title={`Clic o lápiz para cambiar nombre: ${photo.name}`}
                >
                  {photo.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover/name:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer shrink-0"
                  title="Cambiar nombre de la foto"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              {photo.cropRect.width} × {photo.cropRect.height} px
            </span>
          </div>

          {/* Quick Aspect Ratio Selector */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Formato rápido:</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['1:1', '4:5', '5:4', '9:16'] as AspectRatioId[]).map((rId) => {
                const isSelected = photo.aspectRatioId === rId;
                return (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => handleQuickRatioChange(rId)}
                    className={`py-1 text-[11px] font-semibold rounded-md border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {rId}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {cintillo.objectUrl ? (
            <button
              type="button"
              onClick={handleToggleCintillo}
              className={`text-[11px] font-medium inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                photo.applyCintillo
                  ? 'text-indigo-700 hover:text-indigo-800 bg-indigo-50/70'
                  : 'text-slate-400 hover:text-slate-600 bg-slate-100'
              }`}
              title="Activar/desactivar cintillo para esta foto"
            >
              {photo.applyCintillo ? (
                <>
                  <Eye className="w-3 h-3 text-indigo-600" />
                  Con cintillo
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  Sin cintillo
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Sin cintillo cargado</span>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenCrop(photo)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Ajustar recorte"
            >
              <Crop className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSingleDownload}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-semibold shadow-2xs transition-colors disabled:opacity-50"
              title="Descargar en resolución nativa"
            >
              {isExporting ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Descargar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
