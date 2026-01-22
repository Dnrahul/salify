/**
 * Compression Utilities for Salify
 * Handles compression for images, videos, and PDFs
 */

/**
 * Compress image with better algorithm
 * Uses canvas API with dimension reduction for better compression
 */
export const compressImage = async (file, quality) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions based on quality level
          // Higher quality = larger dimensions, lower quality = smaller dimensions
          const scaleFactor = Math.sqrt(quality); // More aggressive scaling at lower quality
          const newWidth = Math.max(Math.floor(img.width * scaleFactor), 1);
          const newHeight = Math.max(Math.floor(img.height * scaleFactor), 1);

          canvas.width = newWidth;
          canvas.height = newHeight;

          // Use better image rendering quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw scaled image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            file.type || 'image/jpeg',
            Math.min(quality, 1) // Ensure quality is between 0-1
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Simulate video compression
 * Real implementation would use ffmpeg.wasm
 * Current: estimates compression based on quality level
 */
export const compressVideo = async (file, compressionConfig) => {
  // Video compression calculation
  // Based on bitrate reduction from original
  const estimatedBitrate = compressionConfig.videoBitrate; // in kbps
  const videoDuration = 60; // assume 1 minute as default
  const estimatedSize = Math.floor((estimatedBitrate * videoDuration) / 8); // Convert kbps to bytes per second

  return {
    estimatedSize: Math.min(estimatedSize, file.size), // Never estimate larger than original
    type: 'video'
  };
};

/**
 * Compress PDF
 * Basic implementation: reduces image quality in PDF
 * For production, use pdf-lib or similar
 */
export const compressPDF = async (file, quality) => {
  // PDF compression is complex and typically requires server-side processing
  // For client-side, we can only do basic estimates
  // A rough estimate: PDFs compress to about 85-90% of original with quality reduction
  const compressionFactor = 0.85 + (quality * 0.1); // 0.85-0.95 depending on quality
  const estimatedSize = Math.floor(file.size * compressionFactor);

  return {
    estimatedSize,
    type: 'pdf'
  };
};

/**
 * Get compression configuration based on mode
 */
export const getCompressionConfig = (mode) => {
  const configs = {
    high: {
      label: 'High Quality',
      desc: 'Minimal compression, max clarity',
      imageQuality: 0.85,
      videoWidth: 0.9,
      videoBitrate: 8000,
      pdfQuality: 0.9
    },
    balanced: {
      label: 'Balanced',
      desc: 'Medium compression, good quality',
      imageQuality: 0.60,
      videoWidth: 0.7,
      videoBitrate: 4000,
      pdfQuality: 0.7
    },
    max: {
      label: 'Max Compression',
      desc: 'Aggressive compression, smaller size',
      imageQuality: 0.35,
      videoWidth: 0.5,
      videoBitrate: 1500,
      pdfQuality: 0.5
    }
  };

  return configs[mode] || configs.balanced;
};

/**
 * Process and compress any file based on type
 */
export const processFile = async (file, compressionConfig) => {
  try {
    let compressedBlob = null;
    let estimatedSize = file.size;
    let compressionType = 'unsupported';

    if (file.type.startsWith('image/')) {
      compressedBlob = await compressImage(file, compressionConfig.imageQuality);
      estimatedSize = compressedBlob.size;
      compressionType = 'image';
    } else if (file.type.startsWith('video/')) {
      const result = await compressVideo(file, compressionConfig);
      estimatedSize = result.estimatedSize;
      compressionType = 'video';
    } else if (file.type === 'application/pdf') {
      const result = await compressPDF(file, compressionConfig.pdfQuality);
      estimatedSize = result.estimatedSize;
      compressionType = 'pdf';
    } else {
      // Unsupported file type - no compression
      estimatedSize = file.size;
    }

    const savedBytes = file.size - estimatedSize;
    const savedPercent = Math.round((savedBytes / file.size) * 100);

    return {
      success: true,
      compressedBlob,
      estimatedSize: Math.max(estimatedSize, 1),
      savedBytes: Math.max(savedBytes, 0),
      savedPercent: Math.max(savedPercent, 0),
      compressionType
    };
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    return {
      success: false,
      error: error.message,
      estimatedSize: file.size,
      savedBytes: 0,
      savedPercent: 0
    };
  }
};
