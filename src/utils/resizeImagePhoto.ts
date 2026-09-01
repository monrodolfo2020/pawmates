import type { ImagePickerAsset } from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// A phone camera's un-resized photo (often several MB before base64, which
// inflates it ~33% further) is enough on its own — or combined with a
// second photo in the same request, like signup's face+ID pair — to hit
// Vercel's hard 4.5MB serverless function body limit. That fails as a raw
// network error ("Load Failed" in Safari) before the backend ever sees the
// request, so there's no server-side error to fix; every photo picked
// anywhere in the app gets downscaled+recompressed through this first.
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

export async function resizeImagePhoto(
  asset: ImagePickerAsset,
): Promise<{ uri: string; base64: string | null }> {
  const longestSide = Math.max(asset.width, asset.height);
  const context = ImageManipulator.manipulate(asset.uri);
  if (longestSide > MAX_DIMENSION) {
    // Only one dimension needs to be given — the manipulator preserves
    // the aspect ratio.
    context.resize(asset.width >= asset.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG, base64: true });
  return {
    uri: saved.uri,
    base64: saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null,
  };
}
