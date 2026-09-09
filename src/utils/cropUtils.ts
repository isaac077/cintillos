import { 
  AspectRatioId, 
  AspectRatioOption, 
  CintilloConfig, 
  CropRect, 
  ExportSettings, 
  OrientationType, 
  PhotoItem, 
  UploadPresetConfig 
} from '../types';

export const ASPECT_RATIOS: AspectRatioOption[] = [
  // Formatos Verticales
  { id: '4:5', label: '4:5', ratio: 4 / 5, description: 'Feed Instagram, Retrato', category: 'vertical' },
  { id: '9:16', label: '9:16', ratio: 9 / 16, description: 'Stories, Reels, TikTok, Shorts', category: 'vertical' },
  { id: '3:4', label: '3:4', ratio: 3 / 4, description: 'Retrato Estándar', category: 'vertical' },
  { id: '2:3', label: '2:3', ratio: 2 / 3, description: 'Vertical Réflex 35mm', category: 'vertical' },
  
  // Formatos Horizontales
  { id: '5:4', label: '5:4', ratio: 5 / 4, description: 'Horizontal Fotografía / Catálogo', category: 'horizontal' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, description: 'Paisaje, YouTube, Twitter/X', category: 'horizontal' },
  { id: '4:3', label: '4:3', ratio: 4 / 3, description: 'Cámara Digital Clásica', category: 'horizontal' },
  { id: '3:2', label: '3:2', ratio: 3 / 2, description: 'Réflex Paisaje 3:2', category: 'horizontal' },

  // Cuadrado y Otros
  { id: '1:1', label: '1:1', ratio: 1 / 1, description: 'Cuadrado (Post Instagram, Perfil)', category: 'square' },
  { id: 'original', label: 'Original', ratio: null, description: 'Proporción original sin recortar', category: 'free' },
  { id: 'free', label: 'Libre', ratio: null, description: 'Recorte manual sin restricción', category: 'free' },
];

export function getAspectRatio(id: AspectRatioId): number | null {
  const found = ASPECT_RATIOS.find((r) => r.id === id);
  return found ? found.ratio : null;
}

/**
 * Detect image orientation (vertical, horizontal, or square)
 */
export function detectOrientation(width: number, height: number): OrientationType {
  const diff = Math.abs(width - height) / Math.max(width, height);
  if (diff < 0.04) return 'square';
  return width > height ? 'horizontal' : 'vertical';
}

/**
 * Pick smart default ratio based on detected orientation and presets
 */
export function getSmartDefaultRatio(
  orientation: OrientationType,
  preset?: UploadPresetConfig
): AspectRatioId {
  if (preset?.mode === 'single-fixed') {
    return preset.verticalDefault;
  }
  if (orientation === 'vertical') return preset?.verticalDefault || '4:5';
  if (orientation === 'horizontal') return preset?.horizontalDefault || '5:4';
  return preset?.squareDefault || '1:1';
}

/**
 * Calculates the maximum centered crop rectangle that fits inside image dimensions for a ratio.
 */
export function getDefaultCrop(
  imgWidth: number,
  imgHeight: number,
  aspectRatio: number | null
): CropRect {
  if (!aspectRatio) {
    return {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    };
  }

  const imgRatio = imgWidth / imgHeight;
  let cropWidth = imgWidth;
  let cropHeight = imgHeight;

  if (imgRatio > aspectRatio) {
    // Image is wider than desired ratio -> fit height, crop sides
    cropHeight = imgHeight;
    cropWidth = Math.round(cropHeight * aspectRatio);
  } else {
    // Image is taller than desired ratio -> fit width, crop top/bottom
    cropWidth = imgWidth;
    cropHeight = Math.round(cropWidth / aspectRatio);
  }

  // Ensure within bounds
  cropWidth = Math.min(imgWidth, cropWidth);
  cropHeight = Math.min(imgHeight, cropHeight);

  const x = Math.max(0, Math.round((imgWidth - cropWidth) / 2));
  const y = Math.max(0, Math.round((imgHeight - cropHeight) / 2));

  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * Clamp crop rect to stay inside image and respect aspect ratio
 */
export function clampCrop(
  crop: CropRect,
  imgWidth: number,
  imgHeight: number,
  aspectRatio: number | null
): CropRect {
  let { x, y, width, height } = crop;

  // Minimum size
  const minSize = 20;
  width = Math.max(minSize, Math.min(width, imgWidth));
  height = Math.max(minSize, Math.min(height, imgHeight));

  if (aspectRatio) {
    if (width / height !== aspectRatio) {
      // Adjust width or height to preserve ratio
      height = Math.round(width / aspectRatio);
      if (height > imgHeight) {
        height = imgHeight;
        width = Math.round(height * aspectRatio);
      }
    }
  }

  // Clamp x and y
  x = Math.max(0, Math.min(x, imgWidth - width));
  y = Math.max(0, Math.min(y, imgHeight - height));

  return { x, y, width, height };
}

/**
 * Loads an image from URL or objectUrl as HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Renders the final cropped image with the cintillo overlay at 100% full original resolution
 */
export async function renderProcessedImage(
  photo: PhotoItem,
  cintillo: CintilloConfig,
  settings?: ExportSettings
): Promise<HTMLCanvasElement> {
  const img = await loadImage(photo.objectUrl);

  const crop = photo.cropRect;
  let targetWidth = crop.width;
  let targetHeight = crop.height;

  // Optional scaling if user requested Instagram optimal or 4K
  if (settings?.resolutionMode === 'instagram') {
    // Standard Instagram resolution
    const scale = 1080 / targetWidth;
    targetWidth = 1080;
    targetHeight = Math.round(crop.height * scale);
  } else if (settings?.resolutionMode === '4k') {
    const maxDim = Math.max(targetWidth, targetHeight);
    if (maxDim > 3840) {
      const scale = 3840 / maxDim;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D del canvas');
  }

  // Set maximum rendering quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw cropped original image onto target canvas
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Draw overlays based on overlayMode (banner, corner-logo, or both)
  const shouldRenderBanner =
    cintillo.overlayMode === 'banner' || cintillo.overlayMode === 'both';
  const shouldRenderWatermark =
    cintillo.overlayMode === 'corner-logo' || cintillo.overlayMode === 'both';

  // 1. Draw Cintillo / Banner if enabled
  if (photo.applyCintillo && shouldRenderBanner) {
    const isHorizontal = targetWidth > targetHeight;
    const activeUrl =
      isHorizontal && cintillo.separateByOrientation && cintillo.horizontalCintillo?.objectUrl
        ? cintillo.horizontalCintillo.objectUrl
        : cintillo.objectUrl;

    if (activeUrl) {
      try {
        const cintilloImg = await loadImage(activeUrl);
        drawCintilloOnCanvas(ctx, cintilloImg, cintillo, targetWidth, targetHeight);
      } catch (err) {
        console.error('Error cargando imagen de cintillo:', err);
      }
    }
  }

  // 2. Draw Corner Logo / Watermark if enabled
  if (photo.applyCintillo && shouldRenderWatermark) {
    // If in corner-logo only mode, allow using cintillo.objectUrl if watermark.objectUrl is not set
    const watermarkUrl =
      cintillo.watermark?.objectUrl ||
      (cintillo.overlayMode === 'corner-logo' ? cintillo.objectUrl : null);

    if (watermarkUrl) {
      try {
        const watermarkImg = await loadImage(watermarkUrl);
        drawWatermarkOnCanvas(ctx, watermarkImg, cintillo.watermark, targetWidth, targetHeight);
      } catch (err) {
        console.error('Error cargando logo o marca de agua:', err);
      }
    }
  }

  return canvas;
}

/**
 * Draw logo or watermark in corner (or center) onto target canvas
 */
export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  watermarkImg: HTMLImageElement,
  watermark: any,
  canvasWidth: number,
  canvasHeight: number
) {
  const origW = watermarkImg.naturalWidth || watermarkImg.width;
  const origH = watermarkImg.naturalHeight || watermarkImg.height;
  if (!origW || !origH) return;

  const ratio = origW / origH;
  // 100% scale means exactly 1:1 original natural pixel size of the watermark/logo image
  const scalePercent = watermark?.scalePercent ?? 100;
  let drawW = Math.round((origW * scalePercent) / 100);
  let drawH = Math.round((origH * scalePercent) / 100);

  const margin = Math.round(watermark?.marginPx ?? 20);

  // If the drawn size exceeds the available canvas area, fit proportionally inside bounds
  const effectiveMarginForBound = Math.max(0, margin);
  const maxW = Math.max(10, canvasWidth - effectiveMarginForBound * 2);
  const maxH = Math.max(10, canvasHeight - effectiveMarginForBound * 2);
  if (drawW > maxW || drawH > maxH) {
    const factor = Math.min(maxW / drawW, maxH / drawH);
    if (factor < 1) {
      drawW = Math.round(drawW * factor);
      drawH = Math.round(drawW / ratio);
    }
  }

  let drawX = margin;
  let drawY = margin;

  const position = watermark?.position || 'top-right';

  switch (position) {
    case 'top-left':
      drawX = margin;
      drawY = margin;
      break;
    case 'top-right':
      drawX = canvasWidth - drawW - margin;
      drawY = margin;
      break;
    case 'bottom-left':
      drawX = margin;
      drawY = canvasHeight - drawH - margin;
      break;
    case 'bottom-right':
      drawX = canvasWidth - drawW - margin;
      drawY = canvasHeight - drawH - margin;
      break;
    case 'center':
      drawX = Math.round((canvasWidth - drawW) / 2);
      drawY = Math.round((canvasHeight - drawH) / 2);
      break;
  }

  ctx.save();
  ctx.globalAlpha = watermark?.opacity ?? 0.85;
  ctx.drawImage(watermarkImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Draw cintillo banner onto target context with configured sizing and positioning
 * Intelligent adaptive logic ensures it works seamlessly across vertical and horizontal formats!
 */
export function drawCintilloOnCanvas(
  ctx: CanvasRenderingContext2D,
  cintilloImg: HTMLImageElement,
  cintillo: CintilloConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  const origW = cintilloImg.naturalWidth || cintilloImg.width;
  const origH = cintilloImg.naturalHeight || cintilloImg.height;
  if (!origW || !origH) return;

  const isHorizontalCanvas = canvasWidth > canvasHeight;
  const cintilloRatio = origW / origH;
  const margin = cintillo.marginPx || 0;

  let drawW = canvasWidth;
  let drawH = drawW / cintilloRatio;

  if (cintillo.fitMode === 'full-width') {
    // Matches 100% of canvas width minus margin
    drawW = canvasWidth - margin * 2;
    drawH = drawW / cintilloRatio;

    // Smart Adaptive behavior for horizontal photos:
    // If it's a horizontal canvas and adaptiveBehavior is 'auto' (or 'height-limited'):
    // When a banner is full width on a landscape photo, it can become too tall vertically.
    // We cap the height to maxHeightPercentHorizontal (default 16%) so it never obscures the subject!
    if (isHorizontalCanvas && cintillo.adaptiveBehavior !== 'full-width-always') {
      const maxH = (canvasHeight * (cintillo.maxHeightPercentHorizontal || 16)) / 100;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * cintilloRatio;
      }
    }
  } else if (cintillo.fitMode === 'height-percent') {
    // Scales to X% of canvas height
    const targetH = (canvasHeight * cintillo.heightPercent) / 100;
    drawH = targetH;
    drawW = drawH * cintilloRatio;
    if (drawW > canvasWidth - margin * 2) {
      drawW = canvasWidth - margin * 2;
      drawH = drawW / cintilloRatio;
    }
  } else if (cintillo.fitMode === 'scale') {
    // 100% scale means 1:1 original pixel dimensions of the banner image!
    const scale = (cintillo.scalePercent ?? 100) / 100;
    drawW = Math.round(origW * scale);
    drawH = Math.round(origH * scale);
    if (drawW > canvasWidth - margin * 2) {
      drawW = canvasWidth - margin * 2;
      drawH = Math.round(drawW / cintilloRatio);
    }
  }

  // Calculate X position (centered horizontally by default)
  const drawX = Math.round((canvasWidth - drawW) / 2);

  // Calculate Y position
  let drawY = 0;
  switch (cintillo.position) {
    case 'top':
      drawY = margin;
      break;
    case 'bottom':
      drawY = canvasHeight - drawH - margin;
      break;
    case 'center':
      drawY = Math.round((canvasHeight - drawH) / 2);
      break;
    case 'custom':
      drawY = Math.round((canvasHeight * cintillo.customYPercent) / 100 - drawH / 2);
      break;
  }

  // Save context state for opacity
  ctx.save();
  ctx.globalAlpha = cintillo.opacity ?? 1.0;
  ctx.drawImage(cintilloImg, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Generate Blob from Canvas with user export settings
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  quality: number = 0.98
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Fallo al generar archivo de imagen'));
      },
      mimeType,
      format === 'png' ? undefined : quality
    );
  });
}

/**
 * Download a single blob directly in the browser
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Generates sample demo images (1 Vertical portrait + 1 Horizontal landscape)
 * and sample demo cintillo to show both formats in action!
 */
export async function createDemoAssets(): Promise<{
  samplePhotoVerticalFile: File;
  samplePhotoHorizontalFile: File;
  sampleCintilloFile: File;
  sampleLogoFile: File;
}> {
  // 1. Create Vertical Photo (1200 x 1500, 4:5 Portrait)
  const vertCanvas = document.createElement('canvas');
  vertCanvas.width = 1200;
  vertCanvas.height = 1500;
  const vctx = vertCanvas.getContext('2d')!;

  const vgrad = vctx.createLinearGradient(0, 0, 0, 1500);
  vgrad.addColorStop(0, '#0f172a'); // dark night sky
  vgrad.addColorStop(0.4, '#1e1b4b'); // deep indigo
  vgrad.addColorStop(0.7, '#4338ca'); // vibrant purple-blue
  vgrad.addColorStop(1, '#064e3b'); // emerald base
  vctx.fillStyle = vgrad;
  vctx.fillRect(0, 0, 1200, 1500);

  // Soft glowing moon / orb
  vctx.beginPath();
  vctx.arc(600, 500, 160, 0, Math.PI * 2);
  vctx.fillStyle = '#fef08a';
  vctx.shadowColor = '#facc15';
  vctx.shadowBlur = 60;
  vctx.fill();
  vctx.shadowBlur = 0;

  // Architectural / Tree silhouette in portrait
  vctx.fillStyle = '#030712';
  vctx.beginPath();
  vctx.moveTo(0, 1500);
  vctx.lineTo(0, 1000);
  vctx.lineTo(200, 900);
  vctx.lineTo(500, 1100);
  vctx.lineTo(600, 800);
  vctx.lineTo(700, 1100);
  vctx.lineTo(1000, 920);
  vctx.lineTo(1200, 1020);
  vctx.lineTo(1200, 1500);
  vctx.closePath();
  vctx.fill();

  vctx.fillStyle = 'rgba(255,255,255,0.85)';
  vctx.font = 'bold 38px sans-serif';
  vctx.fillText('FOTO VERTICAL (4:5 / RETRATO)', 60, 1380);

  const vertBlob = await new Promise<Blob>((res) => vertCanvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
  const samplePhotoVerticalFile = new File([vertBlob], 'demo-vertical-retrato.jpg', { type: 'image/jpeg' });

  // 2. Create Horizontal Photo (2400 x 1600, 3:2 / 16:9 Landscape)
  const horizCanvas = document.createElement('canvas');
  horizCanvas.width = 2400;
  horizCanvas.height = 1600;
  const hctx = horizCanvas.getContext('2d')!;

  const hgrad = hctx.createLinearGradient(0, 0, 0, 1600);
  hgrad.addColorStop(0, '#1e1b4b'); // deep indigo
  hgrad.addColorStop(0.35, '#4338ca'); // rich blue
  hgrad.addColorStop(0.65, '#ea580c'); // warm orange sunset
  hgrad.addColorStop(0.85, '#facc15'); // golden glow
  hgrad.addColorStop(1, '#0f172a'); // silhouette ground
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 2400, 1600);

  // Sunset Sun
  hctx.beginPath();
  hctx.arc(1200, 950, 180, 0, Math.PI * 2);
  hctx.fillStyle = '#fffbeb';
  hctx.shadowColor = '#fbbf24';
  hctx.shadowBlur = 80;
  hctx.fill();
  hctx.shadowBlur = 0;

  // Mountain silhouettes
  hctx.fillStyle = '#090d16';
  hctx.beginPath();
  hctx.moveTo(0, 1600);
  hctx.lineTo(0, 1100);
  hctx.lineTo(400, 850);
  hctx.lineTo(850, 1200);
  hctx.lineTo(1300, 780);
  hctx.lineTo(1800, 1150);
  hctx.lineTo(2400, 890);
  hctx.lineTo(2400, 1600);
  hctx.closePath();
  hctx.fill();

  hctx.fillStyle = 'rgba(255,255,255,0.85)';
  hctx.font = 'bold 44px sans-serif';
  hctx.fillText('FOTO HORIZONTAL (5:4 / 16:9 PAISAJE)', 80, 1480);

  const horizBlob = await new Promise<Blob>((res) => horizCanvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
  const samplePhotoHorizontalFile = new File([horizBlob], 'demo-horizontal-paisaje.jpg', { type: 'image/jpeg' });

  // 3. Create professional banner/cintillo (PNG transparent with modern bar)
  const cintilloCanvas = document.createElement('canvas');
  cintilloCanvas.width = 1600;
  cintilloCanvas.height = 180;
  const cctx = cintilloCanvas.getContext('2d')!;

  // Crisp modern ribbon with gradient
  const cgrad = cctx.createLinearGradient(0, 0, 1600, 0);
  cgrad.addColorStop(0, '#dc2626'); // vibrant red
  cgrad.addColorStop(0.25, '#b91c1c');
  cgrad.addColorStop(1, '#1e293b'); // dark slate
  cctx.fillStyle = cgrad;

  // Rounded sleek banner shape
  cctx.beginPath();
  cctx.roundRect(10, 10, 1580, 160, 16);
  cctx.fill();

  // White border highlight
  cctx.lineWidth = 3;
  cctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  cctx.stroke();

  // Accent badge
  cctx.fillStyle = '#ffffff';
  cctx.beginPath();
  cctx.roundRect(40, 35, 180, 110, 12);
  cctx.fill();

  cctx.fillStyle = '#dc2626';
  cctx.font = '900 42px sans-serif';
  cctx.fillText('EXCLUSIVO', 50, 105);

  // Main text
  cctx.fillStyle = '#ffffff';
  cctx.font = 'bold 50px sans-serif';
  cctx.fillText('EDICIÓN ESPECIAL 2026', 260, 95);

  // Subtitle
  cctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  cctx.font = '500 28px sans-serif';
  cctx.fillText('Cintillo Adaptable para Fotos Verticales y Horizontales', 265, 135);

  // Right icon or tag
  cctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  cctx.font = 'bold 36px sans-serif';
  cctx.fillText('★ OFICIAL', 1360, 105);

  const cintilloBlob = await new Promise<Blob>((res) => cintilloCanvas.toBlob((b) => res(b!), 'image/png'));
  const sampleCintilloFile = new File([cintilloBlob], 'cintillo-muestra-oficial.png', { type: 'image/png' });

  // 4. Create sample corner logo / watermark (PNG transparent circular brand stamp)
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 400;
  logoCanvas.height = 400;
  const lctx = logoCanvas.getContext('2d')!;

  // Circular badge with dark navy background
  lctx.fillStyle = '#0f172a';
  lctx.beginPath();
  lctx.arc(200, 200, 185, 0, Math.PI * 2);
  lctx.fill();

  // Outer gold ring
  lctx.strokeStyle = '#f59e0b';
  lctx.lineWidth = 12;
  lctx.stroke();

  // Inner ring
  lctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  lctx.lineWidth = 3;
  lctx.beginPath();
  lctx.arc(200, 200, 160, 0, Math.PI * 2);
  lctx.stroke();

  // Logo Icon / Star
  lctx.fillStyle = '#f59e0b';
  lctx.font = 'bold 84px sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText('★', 200, 135);

  // Brand Name
  lctx.fillStyle = '#ffffff';
  lctx.font = '900 38px sans-serif';
  lctx.fillText('STUDIO', 200, 215);

  lctx.fillStyle = '#94a3b8';
  lctx.font = 'bold 22px sans-serif';
  lctx.fillText('BRAND 2026', 200, 260);

  const logoBlob = await new Promise<Blob>((res) => logoCanvas.toBlob((b) => res(b!), 'image/png'));
  const sampleLogoFile = new File([logoBlob], 'logo-marca-de-agua.png', { type: 'image/png' });

  return { samplePhotoVerticalFile, samplePhotoHorizontalFile, sampleCintilloFile, sampleLogoFile };
}

