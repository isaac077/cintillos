import React, { useState } from 'react';
import { AspectRatioId, CintilloConfig, ExportSettings, OrientationType, PhotoItem } from '../types';
import { 
  ASPECT_RATIOS, 
  canvasToBlob, 
  detectOrientation, 
  getAspectRatio, 
  getDefaultCrop, 
  renderProcessedImage, 
  triggerDownload 
} from '../utils/cropUtils';
import { 
  Download, Sliders, CheckCircle2, FileArchive, Layers, 
  Trash2, Compass, Sparkles, Filter, Type
} from 'lucide-react';
import JSZip from 'jszip';
import { BatchRenameModal } from './BatchRenameModal';

interface BatchExportBarProps {
  photos: PhotoItem[];
  cintillo: CintilloConfig;
  onApplyRatioToAll: (ratioId: AspectRatioId) => void;
  onApplyRatioByOrientation: (verticalRatio: AspectRatioId, horizontalRatio: AspectRatioId) => void;
  onApplyRatioToOrientation: (ratioId: AspectRatioId, orientation: OrientationType) => void;
  onToggleCintilloAll: (apply: boolean) => void;
  onClearAll: () => void;
  onBatchRenamePhotos?: (renamedList: { id: string; name: string }[]) => void;
}

export const BatchExportBar: React.FC<BatchExportBarProps> = ({
  photos,
  cintillo,
  onApplyRatioToAll,
  onApplyRatioByOrientation,
  onApplyRatioToOrientation,
  onToggleCintilloAll,
  onClearAll,
  onBatchRenamePhotos,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'jpeg',
    quality: 1.0,
    resolutionMode: 'original',
    namingStyle: 'sequential-ratio',
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ total: number; message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: '',
  });

  const verticalPhotos = photos.filter((p) => {
    const o = p.naturalOrientation || detectOrientation(p.originalWidth, p.originalHeight);
    return o === 'vertical';
  });

  const horizontalPhotos = photos.filter((p) => {
    const o = p.naturalOrientation || detectOrientation(p.originalWidth, p.originalHeight);
    return o === 'horizontal';
  });

  const hasMixedOrientations = verticalPhotos.length > 0 && horizontalPhotos.length > 0;

  const handleExportZip = async () => {
    if (photos.length === 0 || isExportingZip) return;

    setIsExportingZip(true);
    setProgress({ current: 0, total: photos.length, stage: 'Iniciando exportación en máxima resolución...' });

    try {
      const zip = new JSZip();
      const usedFilenames = new Set<string>();
      let processedCount = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress({
          current: i + 1,
          total: photos.length,
          stage: `Procesando foto ${i + 1} de ${photos.length}: ${photo.name}...`,
        });

        try {
          const canvas = await renderProcessedImage(photo, cintillo, settings);
          const blob = await canvasToBlob(canvas, settings.format, settings.quality);

          // Clean name, remove any forbidden OS characters and replace colons in aspect ratio (Windows rejects colons!)
          const cleanName = photo.name.replace(/\.[^/.]+$/, '').replace(/[/\\?%*:|"<>]/g, '_').trim() || 'foto';
          const safeRatio = String(photo.aspectRatioId || 'recorte').replace(/:/g, '-');
          const ext = settings.format === 'jpeg' ? 'jpg' : settings.format;
          const indexStr = String(i + 1).padStart(2, '0');

          let baseFilename = `${indexStr}_${cleanName}_${safeRatio}.${ext}`;
          if (settings.namingStyle === 'exact') {
            baseFilename = `${cleanName}.${ext}`;
          } else if (settings.namingStyle === 'sequential-name') {
            baseFilename = `${indexStr}_${cleanName}.${ext}`;
          }

          let finalFilename = baseFilename;
          let counter = 1;
          while (usedFilenames.has(finalFilename.toLowerCase())) {
            if (settings.namingStyle === 'exact') {
              finalFilename = `${cleanName}_${counter}.${ext}`;
            } else if (settings.namingStyle === 'sequential-name') {
              finalFilename = `${indexStr}_${cleanName}_${counter}.${ext}`;
            } else {
              finalFilename = `${indexStr}_${cleanName}_${safeRatio}_${counter}.${ext}`;
            }
            counter++;
          }
          usedFilenames.add(finalFilename.toLowerCase());

          zip.file(finalFilename, blob);
          processedCount++;
        } catch (photoErr) {
          console.error(`Error procesando foto individual ${photo.name}:`, photoErr);
        }
      }

      if (processedCount === 0) {
        throw new Error('No se pudo procesar ninguna foto.');
      }

      setProgress({
        current: photos.length,
        total: photos.length,
        stage: `Comprimiendo archivo ZIP con las ${processedCount} fotos en máxima calidad...`,
      });

      // Using STORE avoids heavy memory compression overhead on already-compressed JPEG/PNG images
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
      });

      triggerDownload(zipBlob, `fotos_recortadas_${Date.now()}.zip`);
      setSuccessInfo({
        total: processedCount,
        message: `¡Se exportaron las ${processedCount} de ${photos.length} fotos con éxito en máxima resolución!`,
      });
    } catch (err) {
      console.error('Error al exportar lote en ZIP:', err);
      alert('Hubo un error al generar el archivo ZIP. Verifica que el navegador tenga suficiente memoria.');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <>
      <section id="batch-actions-bar" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
        {/* Top summary & primary actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left: Summary & Orientation Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {photos.length}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {photos.length === 1 ? '1 Foto en lista' : `${photos.length} Fotos en lista`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 text-[11px]">
              {verticalPhotos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  {verticalPhotos.length} {verticalPhotos.length === 1 ? 'Vertical' : 'Verticales'}
                </span>
              )}
              {horizontalPhotos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                  {horizontalPhotos.length} {horizontalPhotos.length === 1 ? 'Horizontal' : 'Horizontales'}
                </span>
              )}
            </div>

            {/* Overlay (Cintillo/Logo) toggles */}
            {(cintillo.objectUrl || cintillo.watermark?.objectUrl) && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => onToggleCintilloAll(true)}
                  className="text-[11px] font-medium text-slate-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-slate-100"
                >
                  {cintillo.overlayMode === 'both' ? 'Cintillo+Logo en todas' : cintillo.overlayMode === 'corner-logo' ? 'Logo en todas' : 'Cintillo en todas'}
                </button>
                <span className="text-slate-300">/</span>
                <button
                  type="button"
                  onClick={() => onToggleCintilloAll(false)}
                  className="text-[11px] font-medium text-slate-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-slate-100"
                >
                  Sin elementos
                </button>
              </div>
            )}
          </div>

          {/* Right: Export settings & Batch Download Button */}
          <div className="flex items-center gap-2.5 shrink-0 justify-end">
            {onBatchRenamePhotos && (
              <button
                id="btn-batch-rename"
                type="button"
                onClick={() => setShowRenameModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
                title="Renombrar fotos en lote (Secuencial, prefijos, buscar y reemplazar)"
              >
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                <span>Renombrar ({photos.length})</span>
              </button>
            )}

            <button
              id="btn-export-settings"
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Ajustes de exportación (Formato, calidad, resolución)"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="uppercase font-bold">{settings.format}</span>
              <span className="text-slate-400">|</span>
              <span>{settings.resolutionMode === 'original' ? 'Máx. Calidad' : settings.resolutionMode}</span>
            </button>

            <button
              id="btn-export-zip"
              type="button"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-101 active:scale-98 disabled:opacity-50"
            >
              {isExportingZip ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileArchive className="w-4 h-4" />
              )}
              Exportar Lote en ZIP ({photos.length})
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Limpiar todas las fotos"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orientation-Aware Format Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto smart button */}
            {hasMixedOrientations && (
              <button
                type="button"
                onClick={() => onApplyRatioByOrientation('4:5', '5:4')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-2xs transition-all"
                title="Aplica 4:5 a las fotos verticales y 5:4 a las horizontales con un solo clic"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto: Verticales a 4:5 y Horizontales a 5:4
              </button>
            )}

            {/* Individual orientation selectors */}
            {verticalPhotos.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="font-semibold text-indigo-700">Verticales ({verticalPhotos.length}) a:</span>
                {(['4:5', '9:16', '3:4', 'original'] as AspectRatioId[]).map((rId) => (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => onApplyRatioToOrientation(rId, 'vertical')}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-indigo-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {rId}
                  </button>
                ))}
              </div>
            )}

            {horizontalPhotos.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="font-semibold text-emerald-700">Horizontales ({horizontalPhotos.length}) a:</span>
                {(['5:4', '16:9', '4:3', 'original'] as AspectRatioId[]).map((rId) => (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => onApplyRatioToOrientation(rId, 'horizontal')}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-emerald-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {rId}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unified format */}
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-[11px]">Todo igual:</span>
            {(['1:1', '4:5', '5:4', '9:16'] as AspectRatioId[]).map((rId) => (
              <button
                key={rId}
                type="button"
                onClick={() => onApplyRatioToAll(rId)}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600"
                title={`Forzar ${rId} en absolutamente todas`}
              >
                {rId}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Ajustes de Calidad y Exportación
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Formato de Salida</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'jpeg', label: 'JPG', desc: 'Fotografía estándar' },
                  { id: 'png', label: 'PNG', desc: 'Sin pérdida (100% nitidez)' },
                  { id: 'webp', label: 'WEBP', desc: 'Moderno y ligero' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, format: fmt.id as any })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.format === fmt.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{fmt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for JPG & WEBP) */}
            {settings.format !== 'png' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Calidad de compresión</span>
                  <span className="text-indigo-600 font-bold">{Math.round(settings.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.0"
                  step="0.02"
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Alta (80%)</span>
                  <span>Máxima Fidelidad (100%)</span>
                </div>
              </div>
            )}

            {/* Resolution Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Resolución de Exportación</label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'original',
                    title: 'Resolución Original (Recomendado)',
                    desc: 'Mantiene exactamente la cantidad nativa de megapíxeles de tus fotos sin reducir tamaño.',
                  },
                  {
                    id: 'instagram',
                    title: 'Optimizado para Redes Sociales (1080px)',
                    desc: 'Escala el ancho a 1080px (estándar oficial de Instagram/Meta) evitando que la red social comprima bruscamente.',
                  },
                  {
                    id: '4k',
                    title: 'Ultra HD 4K',
                    desc: 'Asegura un tope máximo de 3840px para pantallas 4K.',
                  },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      settings.resolutionMode === mode.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionMode"
                      checked={settings.resolutionMode === mode.id}
                      onChange={() => setSettings({ ...settings, resolutionMode: mode.id as any })}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{mode.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{mode.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Naming Style in ZIP */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Formato del Nombre en el ZIP</label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'sequential-ratio',
                    title: 'Numerado con Formato (Recomendado)',
                    desc: 'ej. 01_Boda_4-5.jpg (Permite mantener orden y saber el recorte)',
                  },
                  {
                    id: 'exact',
                    title: 'Nombre Exacto Personalizado',
                    desc: 'ej. Boda_01.jpg (Ideal si ya renombraste las fotos a tu gusto)',
                  },
                  {
                    id: 'sequential-name',
                    title: 'Número + Nombre Limpio',
                    desc: 'ej. 01_Boda.jpg (Mantiene orden alfabético)',
                  },
                ].map((style) => (
                  <label
                    key={style.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      (settings.namingStyle || 'sequential-ratio') === style.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="namingStyle"
                      checked={(settings.namingStyle || 'sequential-ratio') === style.id}
                      onChange={() => setSettings({ ...settings, namingStyle: style.id as any })}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{style.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{style.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Aceptar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Processing Progress Modal */}
      {isExportingZip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Exportando en Alta Resolución</h4>
              <p className="text-xs text-slate-500 mt-1">{progress.stage}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>{progress.current} de {progress.total} fotos</span>
                <span>{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Procesado 100% en tu navegador a resolución nativa
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">¡Descarga Completada!</h4>
              <p className="text-xs text-slate-600 mt-1">{successInfo.message}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Fotos empaquetadas:</span>
                <span className="font-bold text-slate-900">{successInfo.total} archivos</span>
              </div>
              <div className="flex justify-between">
                <span>Calidad:</span>
                <span className="font-bold text-emerald-600">Máxima nativa (100%)</span>
              </div>
              <div className="flex justify-between">
                <span>Compatibilidad:</span>
                <span className="font-bold text-indigo-600">Windows / Mac / Móvil</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessInfo(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Batch Rename Modal */}
      {onBatchRenamePhotos && (
        <BatchRenameModal
          isOpen={showRenameModal}
          photos={photos}
          onClose={() => setShowRenameModal(false)}
          onApplyRename={(renamedList) => {
            onBatchRenamePhotos(renamedList);
          }}
        />
      )}
    </>
  );
};
