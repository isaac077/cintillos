export type AspectRatioId = 
  | '1:1' 
  | '4:5' 
  | '5:4' 
  | '9:16' 
  | '16:9' 
  | '4:3' 
  | '3:4' 
  | '3:2' 
  | '2:3' 
  | 'free'
  | 'original';

export type OrientationType = 'vertical' | 'horizontal' | 'square';

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  ratio: number | null; // width / height (null for free/original)
  description: string;
  category: 'vertical' | 'horizontal' | 'square' | 'free';
  iconName?: string;
}

export interface CropRect {
  x: number; // in pixels relative to original image
  y: number;
  width: number;
  height: number;
}

export interface PhotoItem {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  originalWidth: number;
  originalHeight: number;
  naturalOrientation: OrientationType;
  aspectRatioId: AspectRatioId;
  cropRect: CropRect;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  applyCintillo: boolean;
  previewUrl?: string;
}

export type CintilloPosition = 'bottom' | 'top' | 'center' | 'custom';

export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export type OverlayMode = 'banner' | 'corner-logo' | 'both';

export interface WatermarkConfig {
  enabled: boolean;
  file: File | null;
  objectUrl: string | null;
  originalWidth: number;
  originalHeight: number;
  position: CornerPosition;
  scalePercent: number; // 8 to 40% of photo dimension
  opacity: number; // 0 to 1
  marginPx: number; // margin in px
}

export interface CintilloConfig {
  overlayMode: OverlayMode; // 'banner' | 'corner-logo' | 'both'
  file: File | null;
  objectUrl: string | null;
  originalWidth: number;
  originalHeight: number;
  position: CintilloPosition;
  customYPercent: number; // 0 to 100 from top
  // Scaling options:
  fitMode: 'full-width' | 'height-percent' | 'scale';
  heightPercent: number; // e.g. 14% of image height
  scalePercent: number; // 100% default
  opacity: number; // 0 to 1
  marginPx: number; // padding from edge
  // Orientation adaptive settings:
  adaptiveBehavior: 'auto' | 'full-width-always' | 'height-limited';
  maxHeightPercentHorizontal: number; // e.g. 16% in horizontal to avoid covering too much
  // Optional separate banner for horizontal if the user has two distinct designs:
  separateByOrientation?: boolean;
  horizontalCintillo?: {
    file: File | null;
    objectUrl: string | null;
    originalWidth: number;
    originalHeight: number;
  } | null;
  // Corner watermark / logo config:
  watermark: WatermarkConfig;
}

export interface UploadPresetConfig {
  mode: 'smart-orientation' | 'single-fixed';
  verticalDefault: AspectRatioId;
  horizontalDefault: AspectRatioId;
  squareDefault: AspectRatioId;
}

export type ExportFormat = 'jpeg' | 'png' | 'webp';

export interface ExportSettings {
  format: ExportFormat;
  quality: number; // 0.8 - 1.0 (for jpeg/webp)
  resolutionMode: 'original' | 'instagram' | '4k';
}

