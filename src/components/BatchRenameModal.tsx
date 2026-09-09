import React, { useState, useMemo } from 'react';
import { PhotoItem } from '../types';
import { 
  Type, Hash, Replace, PlusCircle, RotateCcw, 
  Check, X, FileText, Sparkles, ArrowRight, AlertCircle, Edit3
} from 'lucide-react';

interface BatchRenameModalProps {
  isOpen: boolean;
  photos: PhotoItem[];
  onClose: () => void;
  onApplyRename: (renamedList: { id: string; name: string }[]) => void;
}

type RenameTab = 'sequential' | 'replace' | 'add-text' | 'manual';

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  photos,
  onClose,
  onApplyRename,
}) => {
  const [activeTab, setActiveTab] = useState<RenameTab>('sequential');

  // 1. Sequential Mode state
  const [prefix, setPrefix] = useState('Foto');
  const [suffix, setSuffix] = useState('');
  const [separator, setSeparator] = useState('_');
  const [startNumber, setStartNumber] = useState(1);
  const [digits, setDigits] = useState(2); // 2 -> 01, 3 -> 001, 1 -> 1

  // 2. Replace Mode state
  const [searchPattern, setSearchPattern] = useState('DSC_');
  const [replaceText, setReplaceText] = useState('Foto_');
  const [matchCase, setMatchCase] = useState(false);

  // 3. Add text state
  const [prependText, setPrependText] = useState('');
  const [appendText, setAppendText] = useState('_editado');

  // 4. Manual table edits
  const [manualNames, setManualNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    photos.forEach((p) => {
      initial[p.id] = p.name;
    });
    return initial;
  });

  // Calculate new names preview dynamically
  const previewList = useMemo(() => {
    return photos.map((photo, index) => {
      // Extract original extension
      const originalExtMatch = photo.name.match(/\.[^/.]+$/);
      const originalExt = originalExtMatch ? originalExtMatch[0] : '';
      const baseName = photo.name.replace(/\.[^/.]+$/, '');

      let computedName = photo.name;

      if (activeTab === 'sequential') {
        const numStr = String(startNumber + index).padStart(digits, '0');
        const sep = separator === 'none' ? '' : separator;
        const middle = suffix ? `${sep}${suffix}` : '';
        computedName = `${prefix}${sep}${numStr}${middle}${originalExt}`;
      } else if (activeTab === 'replace') {
        if (!searchPattern) {
          computedName = photo.name;
        } else {
          try {
            const flags = matchCase ? 'g' : 'gi';
            const regex = new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            computedName = photo.name.replace(regex, replaceText);
          } catch {
            computedName = photo.name;
          }
        }
      } else if (activeTab === 'add-text') {
        computedName = `${prependText}${baseName}${appendText}${originalExt}`;
      } else if (activeTab === 'manual') {
        computedName = manualNames[photo.id] || photo.name;
      }

      // Sanitize illegal path characters
      const sanitized = computedName.replace(/[/\\?%*:|"<>]/g, '_').trim() || `foto_${index + 1}${originalExt}`;

      return {
        id: photo.id,
        currentName: photo.name,
        originalFileName: photo.file.name,
        newName: sanitized,
        objectUrl: photo.objectUrl,
      };
    });
  }, [
    photos,
    activeTab,
    prefix,
    suffix,
    separator,
    startNumber,
    digits,
    searchPattern,
    replaceText,
    matchCase,
    prependText,
    appendText,
    manualNames,
  ]);

  if (!isOpen) return null;

  const handleApply = () => {
    const payload = previewList.map((item) => ({
      id: item.id,
      name: item.newName,
    }));
    onApplyRename(payload);
    onClose();
  };

  const handleRestoreOriginalFiles = () => {
    const payload = photos.map((p) => ({
      id: p.id,
      name: p.file.name,
    }));
    onApplyRename(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                Renombrar Fotos en Lote
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {photos.length} fotos
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Personaliza nombres secuenciales o reemplaza textos para exportar de forma organizada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-white flex gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sequential')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sequential'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Secuencial (Prefijo + 01)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'replace'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Replace className="w-3.5 h-3.5" />
            Buscar y Reemplazar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add-text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'add-text'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Añadir Prefijo / Sufijo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edición Manual Rápida
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-200 shrink-0">
          {activeTab === 'sequential' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-slate-700">Prefijo del nombre</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="ej. Boda, Graduacion, Foto"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
                <div className="flex gap-1 pt-1">
                  {['Boda', 'Evento', 'Graduacion', 'Sesion', 'Foto'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrefix(preset)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Separador</label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="_">Guion bajo (_)</option>
                  <option value="-">Guion medio (-)</option>
                  <option value=" ">Espacio ( )</option>
                  <option value="none">Sin separador</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Iniciar en</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white text-center"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Ceros (Dígitos)</label>
                <select
                  value={digits}
                  onChange={(e) => setDigits(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white cursor-pointer"
                >
                  <option value={1}>1, 2...</option>
                  <option value={2}>01, 02...</option>
                  <option value={3}>001, 002...</option>
                  <option value={4}>0001...</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'replace' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-700">Texto a buscar</label>
                <input
                  type="text"
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                  placeholder="ej. DSC_, IMG_, Copia de"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-700">Reemplazar con</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="ej. Portada_, Foto_, o déjalo vacío para borrar"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-12 flex items-center gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={(e) => setMatchCase(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  Distinguir mayúsculas y minúsculas
                </label>
              </div>
            </div>
          )}

          {activeTab === 'add-text' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Prefijo (al principio del nombre)</label>
                <input
                  type="text"
                  value={prependText}
                  onChange={(e) => setPrependText(e.target.value)}
                  placeholder="ej. 2026_ o Final_"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sufijo (al final del nombre antes de extensión)</label>
                <input
                  type="text"
                  value={appendText}
                  onChange={(e) => setAppendText(e.target.value)}
                  placeholder="ej. _editada o _web"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Edita directamente el nombre de cada foto en la tabla inferior:</span>
              <button
                type="button"
                onClick={() => {
                  const reset: Record<string, string> = {};
                  photos.forEach((p) => {
                    reset[p.id] = p.name;
                  });
                  setManualNames(reset);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
              >
                Restablecer campos
              </button>
            </div>
          )}
        </div>

        {/* Live Preview List / Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 px-1">
            <span>Previsualización en tiempo real ({photos.length} fotos)</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Revisa cómo se nombrará cada imagen al exportar
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {previewList.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                {/* Photo Thumbnail & Current Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    <img
                      src={item.objectUrl}
                      alt={item.currentName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 truncate" title={item.currentName}>
                      {item.currentName}
                    </div>
                    {item.currentName !== item.originalFileName && (
                      <div className="text-[10px] text-slate-400 truncate">
                        Orig: {item.originalFileName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-slate-400 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* New Name */}
                <div className="flex-1 min-w-0">
                  {activeTab === 'manual' ? (
                    <input
                      type="text"
                      value={manualNames[item.id] ?? item.currentName}
                      onChange={(e) =>
                        setManualNames({
                          ...manualNames,
                          [item.id]: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs font-semibold text-indigo-950 border border-indigo-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-indigo-50/40"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-indigo-700 truncate font-mono bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200/70" title={item.newName}>
                        {item.newName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRestoreOriginalFiles}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1 px-2 rounded hover:bg-rose-50"
            title="Vuelve a colocar los nombres originales de archivo del disco"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar nombres originales de archivo
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Aplicar Nuevos Nombres ({photos.length})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
