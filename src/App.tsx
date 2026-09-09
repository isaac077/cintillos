import React, { useState } from 'react';
import { AspectRatioId, CintilloConfig, PhotoItem } from './types';
import { Navbar } from './components/Navbar';
import { CintilloManager } from './components/CintilloManager';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoCard } from './components/PhotoCard';
import { CropModal } from './components/CropModal';
import { BatchExportBar } from './components/BatchExportBar';
import { createDemoAssets, getAspectRatio, getDefaultCrop } from './utils/cropUtils';
import { Layers, Sparkles, SlidersHorizontal, Image as ImageIcon, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [cintillo, setCintillo] = useState<CintilloConfig>({
    overlayMode: 'banner',
    file: null,
    objectUrl: null,
    originalWidth: 0,
    originalHeight: 0,
    position: 'bottom',
    customYPercent: 85,
    fitMode: 'full-width',
    heightPercent: 14,
    scalePercent: 100,
    opacity: 1.0,
    marginPx: 0,
    adaptiveBehavior: 'auto',
    maxHeightPercentHorizontal: 16,
    separateByOrientation: false,
    watermark: {
      enabled: false,
      file: null,
      objectUrl: null,
      originalWidth: 0,
      originalHeight: 0,
      position: 'top-right',
      scalePercent: 100,
      opacity: 0.9,
      marginPx: 20,
    },
  });

  const [activeCropPhoto, setActiveCropPhoto] = useState<PhotoItem | null>(null);
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<AspectRatioId>('4:5');

  // Add new photos to collection
  const handleAddPhotos = (newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  // Update a single photo
  const handleUpdatePhoto = (updated: PhotoItem) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (activeCropPhoto?.id === updated.id) {
      setActiveCropPhoto(updated);
    }
  };

  // Batch rename photos
  const handleBatchRenamePhotos = (renamedList: { id: string; name: string }[]) => {
    const map = new Map(renamedList.map((item) => [item.id, item.name]));
    setPhotos((prev) =>
      prev.map((photo) => {
        const newName = map.get(photo.id);
        return newName ? { ...photo, name: newName } : photo;
      })
    );
    if (activeCropPhoto && map.has(activeCropPhoto.id)) {
      setActiveCropPhoto((prev) => prev ? { ...prev, name: map.get(prev.id)! } : null);
    }
  };

  // Delete photo
  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (activeCropPhoto?.id === id) {
      setActiveCropPhoto(null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('¿Seguro que deseas eliminar todas las fotos de la lista?')) {
      setPhotos([]);
      setActiveCropPhoto(null);
    }
  };

  // Apply aspect ratio to all photos
  const handleApplyRatioToAll = (ratioId: AspectRatioId) => {
    setDefaultAspectRatio(ratioId);
    const ratio = getAspectRatio(ratioId);
    setPhotos((prev) =>
      prev.map((photo) => ({
        ...photo,
        aspectRatioId: ratioId,
        cropRect: getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio),
      }))
    );
  };

  // Apply different ratios for vertical vs horizontal photos simultaneously
  const handleApplyRatioByOrientation = (verticalRatio: AspectRatioId, horizontalRatio: AspectRatioId) => {
    setPhotos((prev) =>
      prev.map((photo) => {
        const orientation = photo.naturalOrientation || (photo.originalWidth > photo.originalHeight ? 'horizontal' : 'vertical');
        const chosenRatioId = orientation === 'vertical' ? verticalRatio : orientation === 'horizontal' ? horizontalRatio : '1:1';
        const ratio = getAspectRatio(chosenRatioId);
        return {
          ...photo,
          aspectRatioId: chosenRatioId,
          cropRect: getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio),
        };
      })
    );
  };

  // Apply ratio only to vertical or only to horizontal photos
  const handleApplyRatioToOrientation = (ratioId: AspectRatioId, orientation: 'vertical' | 'horizontal' | 'square') => {
    const ratio = getAspectRatio(ratioId);
    setPhotos((prev) =>
      prev.map((photo) => {
        const photoOrient = photo.naturalOrientation || (photo.originalWidth > photo.originalHeight ? 'horizontal' : 'vertical');
        if (photoOrient === orientation) {
          return {
            ...photo,
            aspectRatioId: ratioId,
            cropRect: getDefaultCrop(photo.originalWidth, photo.originalHeight, ratio),
          };
        }
        return photo;
      })
    );
  };

  // Toggle cintillo for all photos
  const handleToggleCintilloAll = (apply: boolean) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        applyCintillo: apply,
      }))
    );
  };

  // Save crop from modal
  const handleSaveCrop = (updatedPhoto: PhotoItem, applyToAll?: boolean) => {
    if (applyToAll) {
      const ratio = getAspectRatio(updatedPhoto.aspectRatioId);
      setDefaultAspectRatio(updatedPhoto.aspectRatioId);
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id === updatedPhoto.id) {
            return updatedPhoto;
          }
          return {
            ...p,
            aspectRatioId: updatedPhoto.aspectRatioId,
            cropRect: getDefaultCrop(p.originalWidth, p.originalHeight, ratio),
          };
        })
      );
    } else {
      handleUpdatePhoto(updatedPhoto);
    }
  };

  // Navigate photos within crop modal
  const handleNavigateModal = (direction: 'prev' | 'next') => {
    if (!activeCropPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === activeCropPhoto.id);
    if (direction === 'prev' && currentIndex > 0) {
      setActiveCropPhoto(photos[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < photos.length - 1) {
      setActiveCropPhoto(photos[currentIndex + 1]);
    }
  };

  // Load demo assets (loads vertical AND horizontal sample photos with both cintillo and corner logo)
  const handleLoadDemo = async () => {
    try {
      const { samplePhotoVerticalFile, samplePhotoHorizontalFile, sampleCintilloFile, sampleLogoFile } = await createDemoAssets();

      // Set sample cintillo and sample watermark
      const cintilloUrl = URL.createObjectURL(sampleCintilloFile);
      const logoUrl = URL.createObjectURL(sampleLogoFile);

      const cImg = new Image();
      cImg.onload = () => {
        const lImg = new Image();
        lImg.onload = () => {
          setCintillo({
            overlayMode: 'both',
            file: sampleCintilloFile,
            objectUrl: cintilloUrl,
            originalWidth: cImg.naturalWidth,
            originalHeight: cImg.naturalHeight,
            position: 'bottom',
            customYPercent: 85,
            fitMode: 'full-width',
            heightPercent: 14,
            scalePercent: 100,
            opacity: 1.0,
            marginPx: 0,
            adaptiveBehavior: 'auto',
            maxHeightPercentHorizontal: 16,
            separateByOrientation: false,
            watermark: {
              enabled: true,
              file: sampleLogoFile,
              objectUrl: logoUrl,
              originalWidth: lImg.naturalWidth,
              originalHeight: lImg.naturalHeight,
              position: 'top-right',
              scalePercent: 100,
              opacity: 0.9,
              marginPx: 20,
            },
          });
        };
        lImg.src = logoUrl;
      };
      cImg.src = cintilloUrl;

      // Add sample vertical photo (4:5)
      const vPhotoUrl = URL.createObjectURL(samplePhotoVerticalFile);
      const vpImg = new Image();
      vpImg.onload = () => {
        const vCrop = getDefaultCrop(vpImg.naturalWidth, vpImg.naturalHeight, 4 / 5);
        const demoVertical: PhotoItem = {
          id: `demo-vert-${Date.now()}`,
          name: 'demo-vertical-4x5.jpg',
          file: samplePhotoVerticalFile,
          objectUrl: vPhotoUrl,
          originalWidth: vpImg.naturalWidth,
          originalHeight: vpImg.naturalHeight,
          naturalOrientation: 'vertical',
          aspectRatioId: '4:5',
          cropRect: vCrop,
          rotation: 0,
          flipH: false,
          flipV: false,
          applyCintillo: true,
        };

        // Add sample horizontal photo (5:4)
        const hPhotoUrl = URL.createObjectURL(samplePhotoHorizontalFile);
        const hpImg = new Image();
        hpImg.onload = () => {
          const hCrop = getDefaultCrop(hpImg.naturalWidth, hpImg.naturalHeight, 5 / 4);
          const demoHorizontal: PhotoItem = {
            id: `demo-horiz-${Date.now() + 1}`,
            name: 'demo-horizontal-5x4.jpg',
            file: samplePhotoHorizontalFile,
            objectUrl: hPhotoUrl,
            originalWidth: hpImg.naturalWidth,
            originalHeight: hpImg.naturalHeight,
            naturalOrientation: 'horizontal',
            aspectRatioId: '5:4',
            cropRect: hCrop,
            rotation: 0,
            flipH: false,
            flipV: false,
            applyCintillo: true,
          };

          setPhotos([demoVertical, demoHorizontal]);
        };
        hpImg.src = hPhotoUrl;
      };
      vpImg.src = vPhotoUrl;
    } catch (e) {
      console.error('Error cargando demo:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onLoadDemo={handleLoadDemo} photosCount={photos.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Step 1 & 2 Section: Cintillo + Photos Uploader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cintillo Panel (Left / Top) */}
          <div className="lg:col-span-6 xl:col-span-5">
            <CintilloManager
              cintillo={cintillo}
              onChange={setCintillo}
              onClear={() =>
                setCintillo({
                  ...cintillo,
                  file: null,
                  objectUrl: null,
                  originalWidth: 0,
                  originalHeight: 0,
                })
              }
            />
          </div>

          {/* Photo Uploader (Right) */}
          <div className="lg:col-span-6 xl:col-span-7">
            <PhotoUploader
              onAddPhotos={handleAddPhotos}
              defaultAspectRatio={defaultAspectRatio}
            />
          </div>
        </div>

        {/* Global batch bar if photos exist */}
        {photos.length > 0 && (
          <BatchExportBar
            photos={photos}
            cintillo={cintillo}
            onApplyRatioToAll={handleApplyRatioToAll}
            onApplyRatioByOrientation={handleApplyRatioByOrientation}
            onApplyRatioToOrientation={handleApplyRatioToOrientation}
            onToggleCintilloAll={handleToggleCintilloAll}
            onClearAll={handleClearAll}
            onBatchRenamePhotos={handleBatchRenamePhotos}
          />
        )}

        {/* Photos Gallery or Empty Guide */}
        {photos.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Galería de Fotos para Recortar y Exportar
                </h3>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  • Haz clic sobre cualquier foto para ajustar su recorte
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Añadir más fotos
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files: File[] = Array.from(e.target.files);
                        files.forEach(async (file: File) => {
                          const objectUrl = URL.createObjectURL(file);
                          const img = new Image();
                          img.onload = () => {
                            const ratio = getAspectRatio(defaultAspectRatio);
                            const crop = getDefaultCrop(img.naturalWidth, img.naturalHeight, ratio);
                            setPhotos((prev) => [
                              ...prev,
                              {
                                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                                name: file.name,
                                file,
                                objectUrl,
                                originalWidth: img.naturalWidth,
                                originalHeight: img.naturalHeight,
                                aspectRatioId: defaultAspectRatio,
                                cropRect: crop,
                                rotation: 0,
                                flipH: false,
                                flipV: false,
                                applyCintillo: true,
                              },
                            ]);
                          };
                          img.src = objectUrl;
                        });
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  cintillo={cintillo}
                  onOpenCrop={(p) => setActiveCropPhoto(p)}
                  onUpdatePhoto={handleUpdatePhoto}
                  onDeletePhoto={handleDeletePhoto}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Informative Empty State with Feature Guide */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Layers className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Recorta fotos en 1:1, 4:5, 5:4 y aplica tu cintillo al instante
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                Diseñado para fotógrafos, diseñadores y community managers que necesitan adaptar lotes de fotos para Instagram, prensa o catálogos sin perder ni un píxel de nitidez.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-800">Sube tus fotos</h4>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Arrastra múltiples imágenes sin límite de tamaño ni compresión.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-800">Añade tu cintillo</h4>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Sube tu cinta o banner y ajústalo abajo, arriba o con tamaño personalizado.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-800">Recorta y exporta</h4>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Elige 1:1, 4:5, 5:4 o 9:16 y descarga todas juntas en un archivo ZIP.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
              >
                <Sparkles className="w-4 h-4" />
                Cargar ejemplo de prueba con 1 clic
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Crop Modal */}
      {activeCropPhoto && (
        <CropModal
          photo={activeCropPhoto}
          photos={photos}
          cintillo={cintillo}
          isOpen={Boolean(activeCropPhoto)}
          onClose={() => setActiveCropPhoto(null)}
          onSaveCrop={handleSaveCrop}
          onNavigate={handleNavigateModal}
        />
      )}
    </div>
  );
}
