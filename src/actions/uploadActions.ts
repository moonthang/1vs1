'use server';

import { getImageKitClient } from '@/lib/imagekit';

export interface UploadResponse {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

export async function uploadImage(
  base64: string,
  fileName: string,
  folder: string,
): Promise<UploadResponse> {
  const imagekit = getImageKitClient();
  if (!imagekit) {
    return { success: false, error: 'ImageKit SDK is not initialized on the server.' };
  }
  
  try {
    const response = await imagekit.upload({
      file: base64,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });
    return { success: true, url: response.url, fileId: response.fileId };
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    return { success: false, error: error.message || 'Failed to upload image.' };
  }
}

export async function deleteImage(fileId: string): Promise<{ success: boolean, error?: string }> {
  const imagekit = getImageKitClient();
  if (!imagekit) {
    return { success: false, error: 'ImageKit SDK is not initialized on the server.' };
  }

  try {
    await imagekit.deleteFile(fileId);
    return { success: true };
  } catch (error: any) {
    console.error('ImageKit delete error:', error);
    if (error.name === 'NotFoundError') {
      console.warn(`Attempted to delete non-existent fileId: ${fileId}`);
      return { success: true }; 
    }
    return { success: false, error: error.message || 'Failed to delete image.' };
  }
}
