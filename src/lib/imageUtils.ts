/**
 * Compresses a base64 image string to fit within a target size (in bytes).
 * @param base64Str The original base64 image string.
 * @param maxWidth The maximum width for the compressed image.
 * @param maxHeight The maximum height for the compressed image.
 * @param quality The initial quality (0 to 1).
 * @returns A promise that resolves to the compressed base64 string.
 */
export async function compressImage(
  base64Str: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with specified quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (err) => reject(err);
    img.src = base64Str;
  });
}

/**
 * Attempt to save a base64 image to the device's photo gallery or files.
 * On mobile devices, uses the Web Share API to allow natural "Save Image" into the device's native photos app.
 * Falls back to programmatic file download.
 */
export async function saveImageToGallery(base64Str: string, namePrefix: string = 'FloraWild'): Promise<boolean> {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
  const fileName = `${namePrefix}_${timestamp}.jpg`;
  
  try {
    // Convert base64 to Blob
    const response = await fetch(base64Str);
    const blob = await response.blob();
    
    // Attempt Web Share API for native gallery saving (perfect for iOS/Android photos)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Salva Foto',
          text: 'Salva questa foto sul tuo dispositivo o galleria!',
        });
        return true;
      }
    }
    
    // Fallback: Programmatic standard file download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("[imageUtils] Errore nel salvataggio dell'immagine:", error);
    
    // Fallback: Simplest inline data URL trigger
    try {
      const link = document.createElement('a');
      link.href = base64Str;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (innerError) {
      console.error("[imageUtils] Fallback di emergenza fallito:", innerError);
      return false;
    }
  }
}

