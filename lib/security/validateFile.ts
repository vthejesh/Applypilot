export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_TYPES: Record<string, string[]> = {
  resume: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
};

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10');

export function validateFile(
  file: { size: number; type: string; name: string },
  category: keyof typeof ALLOWED_TYPES = 'document'
): FileValidationResult {
  const maxBytes = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` };
  }

  const allowed = ALLOWED_TYPES[category];
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${allowed.join(', ')}`,
    };
  }

  // Basic filename sanitation
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
  if (safeName !== file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_')) {
    // Just a warning, not a block
  }

  return { valid: true };
}

/**
 * Checks for magic bytes to confirm real file type (basic check)
 */
export function checkMagicBytes(buffer: Buffer): string | null {
  // PDF: %PDF
  if (buffer.slice(0, 4).toString() === '%PDF') return 'application/pdf';
  // PNG: \x89PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    return 'image/png';
  // JPEG: \xFF\xD8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  // DOCX (ZIP-based): PK\x03\x04
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  return null;
}
