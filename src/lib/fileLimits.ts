export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILES_MERGE = 30;
export const MAX_FILES_IMAGES = 50;
export const MAX_HTML_LENGTH = 500_000; // ~500 KB de texto pegado

interface ValidateFilesOptions {
  maxSizeMB?: number;
  maxCount?: number;
  existingCount?: number;
}

export function validateFiles(files: File[], options: ValidateFilesOptions = {}): string | null {
  const maxSizeMB = options.maxSizeMB ?? MAX_FILE_SIZE_MB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const oversized = files.find(f => f.size > maxSizeBytes);
  if (oversized) {
    return `"${oversized.name}" supera el límite de ${maxSizeMB} MB por archivo.`;
  }

  if (options.maxCount != null) {
    const total = (options.existingCount ?? 0) + files.length;
    if (total > options.maxCount) {
      return `Solo se permiten hasta ${options.maxCount} archivos por conversión.`;
    }
  }

  return null;
}
