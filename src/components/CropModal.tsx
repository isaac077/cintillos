import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AspectRatioId, CintilloConfig, CropRect, PhotoItem } from '../types';
import { ASPECT_RATIOS, clampCrop, getAspectRatio, getDefaultCrop } from '../utils/cropUtils';
import { 
  X, Check, ChevronLeft, ChevronRight, Maximize2, 
  AlignCenter, Eye, EyeOff, Layers
} from 'lucide-react';

interface CropModalProps {
  photo: PhotoItem;
  photos: PhotoItem[];
  cintillo: CintilloConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveCrop: (updatedPhoto: PhotoItem, applyToAll?: boolean) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  photo,
  photos,
  cintillo,
  isOpen,
  onClose,
  onSaveCrop,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const [currentRatioId, setCurrentRatioId] = useState<AspectRatioId>(photo.aspectRatioId);
  const [crop, setCrop] = useState<CropRect>(photo.cropRect);
  const [showCintilloPreview, setShowCintilloPreview] = useState<boolean>(photo.applyCintillo);
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 400 });

  // Update crop when photo changes
  useEffect(() => {
    setCurrentRatioId(photo.aspectRatioId);
    setCrop(photo.cropRect);
    setShowCintilloPreview(photo.applyCintillo);
  }, [photo]);

  // Monitor container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Calculate scaling factor between image natural coordinates and screen displayed coordinates
  const scale = Math.min(
    (containerSize.width - 32) / photo.originalWidth,
    (containerSize.height - 32) / photo.originalHeight,
    1
  );

  const displayWidth = Math.round(photo.originalWidth * scale);
  const displayHeight = Math.round(photo.originalHeight * scale);

  const offsetX = Math.round((containerSize.width - displayWidth) / 2);
  const offsetY = Math.round((containerSize.height - displayHeight) / 2);

  // Screen coordinates of crop box
  const screenCrop = {
    x: offsetX + crop.x * scale,
    y: offsetY + crop.y * scale,
    width: crop.width * scale,
    height: crop.height * scale,
  };

  // Switch Aspect Ratio
  const handleRatioChange = (ratioId: AspectRatioId) => {
    setCurrentRatioId(ratioId);
    const ratio = getAspectRatio(ratioId);
    const newCrop = getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio);
    setCrop(newCrop);
  };

  // Center crop button
  const handleCenterCrop = () => {
    const ratio = getAspectRatio(currentRatioId);
    const newCrop = getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio);
    setCrop(newCrop);
  };

  // Maximize crop button
  const handleMaximizeCrop = () => {
    const ratio = getAspectRatio(currentRatioId);
    const newCrop = getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio);
    setCrop(newCrop);
  };

  // Interactive Drag & Resize Handling
  const dragRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || scale <= 0) return;

      const { type, startX, startY, startCrop } = dragRef.current;
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;

      const ratio = getAspectRatio(currentRatioId);
      let newCrop = { ...startCrop };

      if (type === 'move') {
        newCrop.x = Math.max(0, Math.min(startCrop.x + dx, photo.originalWidth - startCrop.width));
        newCrop.y = Math.max(0, Math.min(startCrop.y + dy, photo.originalHeight - startCrop.height));
      } else if (ratio) {
        // Resizing with locked aspect ratio
        let deltaW = 0;
        if (type === 'se') {
          deltaW = Math.abs(dx) > Math.abs(dy * ratio) ? dx : dy * ratio;
          newCrop.width = Math.max(40, startCrop.width + deltaW);
          newCrop.height = Math.round(newCrop.width / ratio);
        } else if (type === 'sw') {
          deltaW = Math.abs(-dx) > Math.abs(dy * ratio) ? -dx : dy * ratio;
          const targetW = Math.max(40, startCrop.width + deltaW);
          newCrop.x = startCrop.x + (startCrop.width - targetW);
          newCrop.width = targetW;
          newCrop.height = Math.round(newCrop.width / ratio);
        } else if (type === 'ne') {
          deltaW = Math.abs(dx) > Math.abs(-dy * ratio) ? dx : -dy * ratio;
          const targetW = Math.max(40, startCrop.width + deltaW);
          newCrop.width = targetW;
          newCrop.height = Math.round(newCrop.width / ratio);
          newCrop.y = startCrop.y + (startCrop.height - newCrop.height);
        } else if (type === 'nw') {
          deltaW = Math.abs(-dx) > Math.abs(-dy * ratio) ? -dx : -dy * ratio;
          const targetW = Math.max(40, startCrop.width + deltaW);
          newCrop.width = targetW;
          newCrop.height = Math.round(newCrop.width / ratio);
          newCrop.x = startCrop.x + (startCrop.width - targetW);
          newCrop.y = startCrop.y + (startCrop.height - newCrop.height);
        } else if (type === 'e') {
          newCrop.width = Math.max(40, startCrop.width + dx);
          newCrop.height = Math.round(newCrop.width / ratio);
        } else if (type === 'w') {
          const targetW = Math.max(40, startCrop.width - dx);
          newCrop.x = startCrop.x + (startCrop.width - targetW);
          newCrop.width = targetW;
          newCrop.height = Math.round(newCrop.width / ratio);
        } else if (type === 's') {
          newCrop.height = Math.max(40, startCrop.height + dy);
          newCrop.width = Math.round(newCrop.height * ratio);
        } else if (type === 'n') {
          const targetH = Math.max(40, startCrop.height - dy);
          newCrop.y = startCrop.y + (startCrop.height - targetH);
          newCrop.height = targetH;
          newCrop.width = Math.round(newCrop.height * ratio);
        }
        newCrop = clampCrop(newCrop, photo.originalWidth, photo.originalHeight, ratio);
      } else {
        // Free ratio resize
        if (type.includes('e')) {
          newCrop.width = Math.max(40, startCrop.width + dx);
        }
        if (type.includes('w')) {
          const targetW = Math.max(40, startCrop.width - dx);
          newCrop.x = startCrop.x + (startCrop.width - targetW);
          newCrop.width = targetW;
        }
        if (type.includes('s')) {
          newCrop.height = Math.max(40, startCrop.height + dy);
        }
        if (type.includes('n')) {
          const targetH = Math.max(40, startCrop.height - dy);
          newCrop.y = startCrop.y + (startCrop.height - targetH);
          newCrop.height = targetH;
        }
        newCrop = clampCrop(newCrop, photo.originalWidth, photo.originalHeight, null);
      }

      setCrop(newCrop);
    },
    [scale, currentRatioId, photo.originalWidth, photo.originalHeight]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      dragRef.current = null;
    }
  };

  const handleSave = () => {
    onSaveCrop(
      {
        ...photo,
        aspectRatioId: currentRatioId,
        cropRect: crop,
        applyCintillo: showCintilloPreview,
      },
      applyToAll
    );
    onClose();
  };

  const currentIndex = photos.findIndex((p) => p.id === photo.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Editor de Recorte
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              Foto {currentIndex + 1} de {photos.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('prev')}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Foto anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('next')}
              disabled={currentIndex >= photos.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Siguiente foto"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              id="btn-close-crop-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aspect Ratio Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0 scrollbar-thin">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              Formato:
            </span>
            {ASPECT_RATIOS.map((item) => {
              const isSelected = currentRatioId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRatioChange(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.description}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCenterCrop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              title="Centrar marco de recorte"
            >
              <AlignCenter className="w-3.5 h-3.5" />
              Centrar
            </button>
            <button
              type="button"
              onClick={handleMaximizeCrop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              title="Ajustar al tamaño óptimo"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Ajustar
            </button>
          </div>
        </div>

        {/* Interactive Canvas/Workspace */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex-1 bg-slate-950 select-none overflow-hidden touch-none"
        >
          {/* Base Image */}
          {scale > 0 && (
            <div
              style={{
                position: 'absolute',
                left: offsetX,
                top: offsetY,
                width: displayWidth,
                height: displayHeight,
              }}
              className="pointer-events-none"
            >
              <img
                src={photo.objectUrl}
                alt="Para recortar"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          )}

          {/* Dark Overlay Outside Crop Area */}
          {scale > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={screenCrop.x}
                    y={screenCrop.y}
                    width={screenCrop.width}
                    height={screenCrop.height}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.72)"
                mask="url(#crop-mask)"
              />
            </svg>
          )}

          {/* Active Crop Box */}
          {scale > 0 && (
            <div
              style={{
                position: 'absolute',
                left: screenCrop.x,
                top: screenCrop.y,
                width: screenCrop.width,
                height: screenCrop.height,
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              className="z-20 cursor-move border-2 border-indigo-400 shadow-xl box-border"
            >
              {/* Rule of Thirds Grid */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Live Overlays in Cropper (Banner and/or Corner Logo) */}
              {showCintilloPreview && (cintillo.overlayMode === 'banner' || cintillo.overlayMode === 'both') && (cintillo.objectUrl || (cintillo.separateByOrientation && cintillo.horizontalCintillo?.objectUrl)) && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden flex z-10"
                  style={{
                    alignItems:
                      cintillo.position === 'top'
                        ? 'flex-start'
                        : cintillo.position === 'bottom'
                        ? 'flex-end'
                        : 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={
                      cintillo.separateByOrientation && crop.width > crop.height && cintillo.horizontalCintillo?.objectUrl
                        ? cintillo.horizontalCintillo.objectUrl
                        : cintillo.objectUrl || ''
                    }
                    alt="Cintillo preview"
                    style={{
                      opacity: cintillo.opacity,
                      width: cintillo.fitMode === 'full-width' ? '100%' : 'auto',
                      maxHeight:
                        cintillo.fitMode === 'height-percent'
                          ? `${cintillo.heightPercent}%`
                          : crop.width > crop.height
                          ? `${cintillo.maxHeightPercentHorizontal || 16}%`
                          : '35%',
                      margin: `${(cintillo.marginPx || 0) * scale}px`,
                      objectFit: 'contain',
                    }}
                    className="transition-all"
                  />
                </div>
              )}

              {/* Live Corner Logo / Watermark Overlay */}
              {showCintilloPreview &&
                (cintillo.overlayMode === 'corner-logo' || cintillo.overlayMode === 'both') &&
                (cintillo.watermark?.objectUrl || (cintillo.overlayMode === 'corner-logo' && cintillo.objectUrl)) && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      top:
                        cintillo.watermark?.position?.startsWith('top')
                          ? `${(cintillo.watermark.marginPx || 20) * scale}px`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      bottom:
                        cintillo.watermark?.position?.startsWith('bottom')
                          ? `${(cintillo.watermark.marginPx || 20) * scale}px`
                          : 'auto',
                      left:
                        cintillo.watermark?.position?.endsWith('left')
                          ? `${(cintillo.watermark.marginPx || 20) * scale}px`
                          : cintillo.watermark?.position === 'center'
                          ? '50%'
                          : 'auto',
                      right:
                        cintillo.watermark?.position?.endsWith('right')
                          ? `${(cintillo.watermark.marginPx || 20) * scale}px`
                          : 'auto',
                      transform:
                        cintillo.watermark?.position === 'center' ? 'translate(-50%, -50%)' : undefined,
                      width: `${cintillo.watermark?.scalePercent || 18}%`,
                      maxWidth: '45%',
                    }}
                  >
                    <img
                      src={
                        cintillo.watermark?.objectUrl ||
                        (cintillo.overlayMode === 'corner-logo' ? cintillo.objectUrl || '' : '')
                      }
                      alt="Watermark preview"
                      style={{
                        opacity: cintillo.watermark?.opacity ?? 0.85,
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                )}

              {/* Corner Handles */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'nw')}
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'ne')}
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'se')}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'sw')}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
              />

              {/* Edge Handles */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'n')}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm cursor-ns-resize shadow-xs"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 's')}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm cursor-ns-resize shadow-xs"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'w')}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm cursor-ew-resize shadow-xs"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'e')}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm cursor-ew-resize shadow-xs"
              />

              {/* Dimension Badge in Center */}
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 pointer-events-none">
                {crop.width} × {crop.height} px
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control & Save Bar */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            {cintillo.objectUrl && (
              <button
                type="button"
                onClick={() => setShowCintilloPreview(!showCintilloPreview)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  showCintilloPreview
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {showCintilloPreview ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Cintillo visible en recorte
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Cintillo oculto
                  </>
                )}
              </button>
            )}

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 rounded"
              />
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Aplicar proporción ({currentRatioId}) a todas las fotos
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              id="btn-save-crop"
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
            >
              <Check className="w-4 h-4" />
              Guardar y Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
