// Cloudinary Upload Widget integration.
// Only ever store `secure_url` in Firestore — never local File objects.
declare global {
  interface Window {
    cloudinary?: any;
  }
}

const WIDGET_SCRIPT_SRC = 'https://upload-widget.cloudinary.com/global/all.js';

let scriptLoadPromise: Promise<void> | null = null;

function loadWidgetScript(): Promise<void> {
  if (window.cloudinary) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Cloudinary widget script')));
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cloudinary widget script'));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

interface OpenUploadWidgetOptions {
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  onSuccess: (result: CloudinaryUploadResult) => void;
  onProgress?: (percent: number) => void;
  onClose?: () => void;
  onError?: (message: string) => void;
  cropping?: boolean;
  croppingAspectRatio?: number;
  croppingShowDimensions?: boolean;
  croppingCoordinatesMode?: string;
}

// Opens the hosted Cloudinary Upload Widget. Requires
// VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET (an *unsigned*
// preset, since this all happens client-side with no backend in this phase).
export async function openCloudinaryUploadWidget(options: OpenUploadWidgetOptions) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    const msg = 'Cloudinary is not configured (missing VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).';
    console.error(msg);
    options.onError?.(msg);
    return;
  }

  try {
    await loadWidgetScript();
  } catch (error: any) {
    console.error(error);
    options.onError?.(error.message);
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName,
      uploadPreset,
      multiple: options.multiple ?? false,
      maxFiles: options.maxFiles ?? (options.multiple ? 10 : 1),
      folder: options.folder,
      sources: ['local', 'url', 'camera'],
      // Ask Cloudinary to hand back optimized delivery URLs.
      resourceType: 'image',
      cropping: options.cropping,
      croppingAspectRatio: options.croppingAspectRatio,
      croppingShowDimensions: options.croppingShowDimensions,
      croppingCoordinatesMode: options.croppingCoordinatesMode,
    },
    (error: any, result: any) => {
      if (error) {
        console.error(error);
        options.onError?.(error.statusText || 'Upload failed.');
        return;
      }
      if (!result) return;
      if (result.event === 'progress' && result.info?.percent != null) {
        options.onProgress?.(result.info.percent);
      }
      if (result.event === 'success') {
        options.onSuccess({
          secureUrl: result.info.secure_url,
          publicId: result.info.public_id,
        });
      }
      if (result.event === 'close') {
        options.onClose?.();
      }
    }
  );

  widget.open();
  return widget;
}
