import React, { useRef, useState } from 'react';
import { UploadCloud, ImagePlus, FileCheck, Compass, Sparkles, SlidersHorizontal } from 'lucide-react';
import { AspectRatioId, PhotoItem } from '../types';
import { detectOrientation, getAspectRatio, getDefaultCrop } from '../utils/cropUtils';

interface PhotoUploaderProps {
  onAddPhotos: (newPhotos: PhotoItem[]) => void;
  defaultAspectRatio: AspectRatioId;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onAddPhotos,
  defaultAspectRatio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Upload format strategy
  const [strategy, setStrategy] = useState<'smart-orientation' | 'original' | 'fixed'>('smart-orientation');
  const [verticalRatio, setVerticalRatio] = useState<AspectRatioId>('4:5');
  const [horizontalRatio, setHorizontalRatio] = useState<AspectRatioId>('5:4');

  const processFiles = async (files: FileList | File[]) => {
    setIsLoading(true);
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (validImageFiles.length === 0) {
      setIsLoading(false);
      return;
    }

    const newPhotoItems: PhotoItem[] = [];

    for (const file of validImageFiles) {
      const objectUrl = URL.createObjectURL(file);
      try {
        const { width, height } = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = reject;
            img.src = objectUrl;
          }
        );

        const orientation = detectOrientation(width, height);
        let assignedRatioId: AspectRatioId = defaultAspectRatio;

        if (strategy === 'smart-orientation') {
          if (orientation === 'vertical') {
            assignedRatioId = verticalRatio;
          } else if (orientation === 'horizontal') {
            assignedRatioId = horizontalRatio;
          } else {
            assignedRatioId = '1:1';
          }
        } else if (strategy === 'original') {
          assignedRatioId = 'original';
        } else {
          assignedRatioId = defaultAspectRatio;
        }

        const ratio = getAspectRatio(assignedRatioId);
        const crop = getDefaultCrop(width, height, ratio);

        newPhotoItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          file,
          objectUrl,
          originalWidth: width,
          originalHeight: height,
          naturalOrientation: orientation,
          aspectRatioId: assignedRatioId,
          cropRect: crop,
          rotation: 0,
          flipH: false,
          flipV: false,
          applyCintillo: true,
        });
      } catch (err) {
        console.error('Error al procesar imagen:', file.name, err);
      }
    }

    if (newPhotoItems.length > 0) {
      onAddPhotos(newPhotoItems);
    }
    setIsLoading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <section id="photo-uploader-section" className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleChange}
      />

      {/* Format Detection Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Al subir fotos con distintos formatos:</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setStrategy('smart-orientation')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              strategy === 'smart-orientation'
                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Ajusta automáticamente verticales a un formato y horizontales a otro"
          >
            🎯 Auto por Orientación
          </button>

          <button
            type="button"
            onClick={() => setStrategy('original')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              strategy === 'original'
                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Mantiene la proporción exacta original de cada imagen sin recortar bordes"
          >
            📐 Mantener Original
          </button>

          <button
            type="button"
            onClick={() => setStrategy('fixed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              strategy === 'fixed'
                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Aplica el mismo formato a todas sin importar su orientación"
          >
            Unificado ({defaultAspectRatio})
          </button>
        </div>
      </div>

      {strategy === 'smart-orientation' && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
          <span className="font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Configuración inteligente para cada foto según su forma:
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Verticales:</span>
              <select
                value={verticalRatio}
                onChange={(e) => setVerticalRatio(e.target.value as AspectRatioId)}
                className="bg-white border border-indigo-200 rounded px-1.5 py-0.5 font-bold text-indigo-700 cursor-pointer text-xs"
              >
                <option value="4:5">4:5 (Feed IG)</option>
                <option value="9:16">9:16 (Stories/Reels)</option>
                <option value="3:4">3:4 (Retrato)</option>
                <option value="2:3">2:3 (Réflex)</option>
                <option value="original">Original</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">Horizontales:</span>
              <select
                value={horizontalRatio}
                onChange={(e) => setHorizontalRatio(e.target.value as AspectRatioId)}
                className="bg-white border border-indigo-200 rounded px-1.5 py-0.5 font-bold text-indigo-700 cursor-pointer text-xs"
              >
                <option value="5:4">5:4 (Foto horizontal)</option>
                <option value="16:9">16:9 (Panorámico/X)</option>
                <option value="4:3">4:3 (Cámara Digital)</option>
                <option value="3:2">3:2 (Réflex)</option>
                <option value="original">Original</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div
        id="photos-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 sm:p-9 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {isLoading ? 'Cargando y analizando fotos...' : 'Sube fotos en cualquier formato (verticales u horizontales)'}
            </h3>
            <p className="text-xs text-slate-500">
              Arrastra y suelta tus archivos aquí, o haz clic para explorar tu dispositivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
              <FileCheck className="w-3 h-3 text-emerald-600" />
              JPG, PNG, WEBP, AVIF
            </span>
            <span>•</span>
            <span>Detecta orientación</span>
            <span>•</span>
            <span className="text-indigo-600 font-medium">100% Calidad Nativa</span>
          </div>

          <button
            type="button"
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:shadow-indigo-600/30"
          >
            <ImagePlus className="w-4 h-4" />
            Seleccionar fotos desde tu equipo
          </button>
        </div>
      </div>
    </section>
  );
};

